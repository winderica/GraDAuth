import { generateKeyPairSync, randomUUID, randomFillSync, publicEncrypt, privateDecrypt } from 'crypto';
import { BLS12_381, BN254, init } from 'mcl';
import { prng } from '@guildofweavers/air-assembly';
import { createPrimeField } from '@guildofweavers/galois';
import { inline, instantiateScript } from '@guildofweavers/genstark';

class PRE {
    async init(curve = BLS12_381) {
        this.mcl = await init(curve);
    }

    generatorGen(g, h) {
        return {
            g: this.mcl.hashAndMapToG1(g),
            h: this.mcl.hashAndMapToG2(h),
        };
    }

    keyGenInG1(g) {
        const sk = this.randomInFr(); // SKa = a is randomly selected from Fr
        const pk = this.mcl.mul(g, sk); // PKa = g^SKa = g^a
        return { sk, pk };
    }

    keyGenInG2(h) {
        const sk = this.randomInFr(); // SKb = b is randomly selected from Fr
        const pk = this.mcl.mul(h, sk); // PKb = h^SKb = h^b
        return { sk, pk };
    }

    encrypt(m, pk, g, h) {
        const r = this.randomInFr(); // r is randomly selected from Fr

        const z = this.mcl.pairing(g, h); // Z = e(g, h)
        const ca0 = this.mcl.add(m, this.mcl.hashToFr(this.mcl.pow(z, r).serialize())); // Ca0 = m*Z^r

        const ca1 = this.mcl.mul(pk, r); // Ca1 = PKa^r = g^(ra)
        return { ca0, ca1 }; // Ca = (Ca0, Ca1)
    }

    decrypt({ ca0, ca1 }, sk, h) {
        const e = this.mcl.pairing(ca1, h); // e(Ca1, h) = e(g^(ra), h)
        const eInv = this.mcl.pow(e, this.mcl.inv(sk)); // e(g^(ra), h)^(1/SKa) = e(g^(ra), h)^(1/a) = e(g, h)^r = Z^r
        return this.mcl.sub(ca0, this.mcl.hashToFr(eInv.serialize())); // Ca0/Z^r = m*Z^r/Z^r = m
    }

    reKeyGen(ska, pkb) {
        return this.mcl.mul(pkb, this.mcl.inv(ska)); // RK = PKb^(1/SKa) = h^(b/a)
    }

    reEncrypt({ ca0, ca1 }, reKey) {
        // Cb1 = e(g^(ra), h^(b/a)) = e(g, h)^(rb) = Z^(rb)
        const cb1 = this.mcl.pairing(ca1, reKey);
        return { cb0: ca0, cb1 }; // Cb0 = Ca0
    }

    reDecrypt({ cb0, cb1 }, sk) {
        // (Z^(rb))^(1/Skb) = (Z^(rb))^(1/b) = Z^r
        const divisor = this.mcl.pow(cb1, this.mcl.inv(sk));
        // Cb0/Z^r = m*Z^r/Z^r = m
        return this.mcl.sub(cb0, this.mcl.hashToFr(divisor.serialize()));
    }

    sign(msgHash, sk) {
        const msgPoint = this.mcl.hashAndMapToG2(msgHash);
        return this.mcl.mul(msgPoint, sk);
    }

    verify(msgHash, signature, pk, g) {
        const msgPoint = this.mcl.hashAndMapToG2(msgHash);
        const lhs = this.mcl.pairing(g, signature);
        const rhs = this.mcl.pairing(pk, msgPoint);
        return lhs.isEqual(rhs);
    }

    randomGen() {
        return this.randomInFr();
    }

    randomInFr() {
        const p = new this.mcl.Fr();
        p.setByCSPRNG();
        return p;
    }
}

export class Poseidon {
    modulus = 2n ** 128n - 9n * 2n ** 32n + 1n;

    field = createPrimeField(this.modulus);

    sBoxExp = 5n;

    stateWidth = 6;

    fRounds = 8;

    pRounds = 55;

    rounds = this.fRounds + this.pRounds;

    mds = this.getMdsMatrix(this.stateWidth);

    roundConstants = this.getRoundConstants();

    matrix = this.field.newMatrixFrom(this.mds);

    ark = Poseidon.transpose(this.roundConstants).map((v) => this.field.newVectorFrom(v));

    constructor(wasm) {
        this.stark = instantiateScript(Buffer.from(`
            define Poseidon6x128 over prime field (${this.modulus}) {
                const mds: ${inline.matrix(this.mds)};
                static roundConstants: [
                    cycle ${inline.vector(this.roundConstants[0])},
                    cycle ${inline.vector(this.roundConstants[1])},
                    cycle ${inline.vector(this.roundConstants[2])},
                    cycle ${inline.vector(this.roundConstants[3])},
                    cycle ${inline.vector(this.roundConstants[4])},
                    cycle ${inline.vector(this.roundConstants[5])}
                ];
                secret input value: element[6];
                public input salt: element[6];
                transition 6 registers {
                    for each (value, salt) {
                        init {
                            yield value + salt;
                        }
                        for steps [1..4, 60..63] {
                            yield mds # ($r + roundConstants)^5;
                        }
                        for steps [5..59] {
                            v5 <- ($r5 + roundConstants[5])^5;
                            yield mds # [...($r[0..4] + roundConstants[0..4]), v5];
                        }
                    }
                }
                enforce 6 constraints {
                    for all steps {
                        enforce transition($r) = $n;
                    }
                }
            }
        `), {
            hashAlgorithm: 'blake2s256',
            extensionFactor: 32,
            exeQueryCount: 44,
            friQueryCount: 30,
            wasm,
        }, null);
    }

    getConstants(seed, count) {
        return prng.sha256(Buffer.from(seed), count, this.field);
    }

    getMdsMatrix(width) {
        const xValues = this.getConstants('HadesMDSx', width);
        const yValues = this.getConstants('HadesMDSy', width);
        return xValues.map((x) => yValues.map((y) => this.field.inv(this.field.sub(x, y))));
    }

    getRoundConstants() {
        return [...new Array(this.stateWidth)].map((_, i) => this.getConstants(`Hades${i}`, 64));
    }

    static transpose(matrix) {
        const rowCount = matrix.length;
        const colCount = matrix[0].length;

        const result = new Array(colCount);
        for (let i = 0; i < colCount; i++) {
            result[i] = new Array(rowCount);
            for (let j = 0; j < rowCount; j++) {
                result[i][j] = matrix[j][i];
            }
        }

        return result;
    }

    static serialize(poseidon) {
        return poseidon.map((i) => i.toString(16).padStart(32, '0')).join('');
    }

    hash(
        value,
        salt
    ) {
        let state = this.field.addVectorElements(this.field.newVectorFrom(value), this.field.newVectorFrom(salt));
        for (let i = 0; i < this.rounds; i++) {
            state = this.field.addVectorElements(state, this.ark[i]);

            if (i < this.fRounds / 2 || i >= this.fRounds / 2 + this.pRounds) {
                state = this.field.expVectorElements(state, this.sBoxExp);
            } else {
                const stateValues = state.toValues();
                stateValues[this.stateWidth - 1] = this.field.exp(stateValues[this.stateWidth - 1], this.sBoxExp);
                state = this.field.newVectorFrom(stateValues);
            }

            state = this.field.mulMatrixByVector(this.matrix, state);
        }
        const result = state.toValues();
        return [result[0], result[1]];
    }

    prove(
        value,
        salt,
        [r0, r1]
    ) {
        return this.stark.prove(
            [
                { step: this.rounds, register: 0, value: r0 },
                { step: this.rounds, register: 1, value: r1 },
            ],
            [...value, ...salt].map((i) => [i])
        );
    }

    verify([r0, r1], proof, salt) {
        this.stark.verify(
            [
                { step: this.rounds, register: 0, value: r0 },
                { step: this.rounds, register: 1, value: r1 },
            ],
            proof,
            salt.map((i) => [i])
        );
    }
}

const bench = (action, round = 100) => {
    const t = performance.now();
    for (let i = 0; i < round; i++) {
        action(i);
    }
    return (performance.now() - t) / round;
}

const benchAsync = async (action, round = 100) => {
    const t = performance.now();
    for (let i = 0; i < round; i++) {
        await action(i);
    }
    return (performance.now() - t) / round;
}

console.log('PRE init BLS12_381', await benchAsync(async () => {
    const pre = new PRE();
    await pre.init(BLS12_381);
}));
console.log('PRE init BN254', await benchAsync(async () => {
    const pre = new PRE();
    await pre.init(BN254);
}));
const preBLS = new PRE();
await preBLS.init(BLS12_381);
const preBN = new PRE();
await preBN.init(BN254);
const gs = [...new Array(100)].map(() => randomUUID());
const hs = [...new Array(100)].map(() => randomUUID());
const generatorsBLS = [];
const generatorsBN = [];
console.log('PRE generatorGen BLS12_381', bench((i) => {
    generatorsBLS[i] = preBLS.generatorGen(gs[i], hs[i]);
}));
console.log('PRE generatorGen BN254', bench((i) => {
    generatorsBN[i] = preBN.generatorGen(gs[i], hs[i]);
}));
const aliceKeysBLS = [];
const bobKeysBLS = [];
const rksBLS = [];
const aliceKeysBN = [];
const bobKeysBN = [];
const rksBN = [];
console.log('PRE keyGenInG1 BLS12_381', bench((i) => {
    aliceKeysBLS[i] = preBLS.keyGenInG1(generatorsBLS[i].g);
}));
console.log('PRE keyGenInG1 BN254', bench((i) => {
    aliceKeysBN[i] = preBN.keyGenInG1(generatorsBN[i].g);
}));
console.log('PRE keyGenInG2 BLS12_381', bench((i) => {
    bobKeysBLS[i] = preBLS.keyGenInG2(generatorsBLS[i].h);
}));
console.log('PRE keyGenInG2 BN254', bench((i) => {
    bobKeysBN[i] = preBN.keyGenInG2(generatorsBN[i].h);
}));
console.log('PRE reKeyGen BLS12_381', bench((i) => {
    rksBLS[i] = preBLS.reKeyGen(aliceKeysBLS[i].sk, bobKeysBLS[i].pk);
}));
console.log('PRE reKeyGen BN254', bench((i) => {
    rksBN[i] = preBN.reKeyGen(aliceKeysBN[i].sk, bobKeysBN[i].pk);
}));
const rsaKeys1024 = [];
const rsaKeys2048 = [];
const rsaKeys3072 = [];
console.log('RSA keygen 1024', bench((i) => {
    rsaKeys1024[i] = generateKeyPairSync('rsa', { modulusLength: 1024 });
}));
console.log('RSA keygen 2048', bench((i) => {
    rsaKeys2048[i] = generateKeyPairSync('rsa', { modulusLength: 2048 });
}));
console.log('RSA keygen 3072', bench((i) => {
    rsaKeys3072[i] = generateKeyPairSync('rsa', { modulusLength: 3072 });
}));
const msBLS = [...new Array(100)].map(() => preBLS.randomGen());
const msBN = [...new Array(100)].map(() => preBN.randomGen());
const csBLS = [];
const csBN = [];
const rsBLS = [];
const rsBN = [];
console.log('PRE encrypt BLS12_381', bench((i) => {
    csBLS[i] = preBLS.encrypt(msBLS[i], aliceKeysBLS[i].pk, generatorsBLS[i].g, generatorsBLS[i].h);
}));
console.log('PRE encrypt BN254', bench((i) => {
    csBN[i] = preBN.encrypt(msBN[i], aliceKeysBN[i].pk, generatorsBN[i].g, generatorsBN[i].h);
}));
console.log('PRE reEncrypt BLS12_381', bench((i) => {
    rsBLS[i] = preBLS.reEncrypt(csBLS[i], rksBLS[i]);
}));
console.log('PRE reEncrypt BN254', bench((i) => {
    rsBN[i] = preBN.reEncrypt(csBN[i], rksBN[i]);
}));
console.log('PRE decrypt BLS12_381', bench((i) => {
    preBLS.decrypt(csBLS[i], aliceKeysBLS[i].sk, generatorsBLS[i].h);
}));
console.log('PRE decrypt BN254', bench((i) => {
    preBN.decrypt(csBN[i], aliceKeysBN[i].sk, generatorsBN[i].h);
}));
console.log('PRE reDecrypt BLS12_381', bench((i) => {
    preBLS.reDecrypt(rsBLS[i], bobKeysBLS[i].sk);
}));
console.log('PRE reDecrypt BN254', bench((i) => {
    preBN.reDecrypt(rsBN[i], bobKeysBN[i].sk);
}));
const msRSA = [...new Array(100)].map(() => randomUUID());
const csRSA1024 = [];
const csRSA2048 = [];
const csRSA3072 = [];
console.log('RSA encrypt 1024', bench((i) => {
    csRSA1024[i] = publicEncrypt(rsaKeys1024[i].publicKey, msRSA[i]);
}));
console.log('RSA encrypt 2048', bench((i) => {
    csRSA2048[i] = publicEncrypt(rsaKeys2048[i].publicKey, msRSA[i]);
}));
console.log('RSA encrypt 3072', bench((i) => {
    csRSA3072[i] = publicEncrypt(rsaKeys3072[i].publicKey, msRSA[i]);
}));
console.log('RSA decrypt 1024', bench((i) => {
    privateDecrypt(rsaKeys1024[i].privateKey, csRSA1024[i]);
}));
console.log('RSA decrypt 2048', bench((i) => {
    privateDecrypt(rsaKeys2048[i].privateKey, csRSA2048[i]);
}));
console.log('RSA decrypt 3072', bench((i) => {
    privateDecrypt(rsaKeys3072[i].privateKey, csRSA3072[i]);
}));

{
    console.log('poseidon', bench(() => {
        new Poseidon(true);
    }));
    const poseidon = new Poseidon(true);
    const values = [...new Array(100)].map(() => [...randomFillSync(new BigUint64Array(6))]);
    const salts = [...new Array(100)].map(() => [...randomFillSync(new BigUint64Array(6))]);
    const hashes = [];
    const proofs = [];
    console.log('poseidon hash', bench((i) => {
        hashes[i] = poseidon.hash(values[i], salts[i]);
    }));
    console.log('poseidon prove', bench((i) => {
        proofs[i] = poseidon.prove(values[i], salts[i], hashes[i]);
    }));
    console.log(poseidon.stark.serialize(proofs[0]).length);
    console.log(poseidon.stark.serialize(proofs[1]).length);
    console.log('poseidon verify', bench((i) => {
        poseidon.verify(hashes[i], proofs[i], salts[i]);
    }));    
}
{
    console.log('poseidon', bench(() => {
        new Poseidon(false);
    }));
    const poseidon = new Poseidon(false);
    const values = [...new Array(100)].map(() => [...randomFillSync(new BigUint64Array(6))]);
    const salts = [...new Array(100)].map(() => [...randomFillSync(new BigUint64Array(6))]);
    const hashes = [];
    const proofs = [];
    console.log('poseidon hash', bench((i) => {
        hashes[i] = poseidon.hash(values[i], salts[i]);
    }));
    console.log('poseidon prove', bench((i) => {
        proofs[i] = poseidon.prove(values[i], salts[i], hashes[i]);
    }));
    console.log(poseidon.stark.serialize(proofs[0]).length);
    console.log(poseidon.stark.serialize(proofs[1]).length);
    console.log('poseidon verify', bench((i) => {
        poseidon.verify(hashes[i], proofs[i], salts[i]);
    }));
}