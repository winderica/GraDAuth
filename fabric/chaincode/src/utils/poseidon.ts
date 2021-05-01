import { prng } from '@guildofweavers/air-assembly';
import { createPrimeField } from '@guildofweavers/galois';
import { inline, instantiateScript, Logger } from '@guildofweavers/genstark';

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

    stark = instantiateScript(Buffer.from(`
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
        wasm: true,
    }, null as unknown as Logger);

    private getConstants(seed: string, count: number) {
        return prng.sha256(Buffer.from(seed), count, this.field);
    }

    private getMdsMatrix(width: number) {
        const xValues = this.getConstants('HadesMDSx', width);
        const yValues = this.getConstants('HadesMDSy', width);
        return xValues.map((x) => yValues.map((y) => this.field.inv(this.field.sub(x, y))));
    }

    private getRoundConstants() {
        return [...new Array(this.stateWidth)].map((_, i) => this.getConstants(`Hades${i}`, 64));
    }

    static transpose(matrix: bigint[][]) {
        const rowCount = matrix.length;
        const colCount = matrix[0].length;

        const result = new Array<bigint[]>(colCount);
        for (let i = 0; i < colCount; i++) {
            result[i] = new Array<bigint>(rowCount);
            for (let j = 0; j < rowCount; j++) {
                result[i][j] = matrix[j][i];
            }
        }

        return result;
    }

    static serialize(poseidon: bigint[]) {
        return poseidon.map((i) => i.toString(16).padStart(32, '0')).join('');
    }

    hash(
        value: [bigint, bigint, bigint, bigint, bigint, bigint],
        salt: [bigint, bigint, bigint, bigint, bigint, bigint]
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
        return [result[0], result[1]] as [bigint, bigint];
    }

    prove(
        value: [bigint, bigint, bigint, bigint, bigint, bigint],
        salt: [bigint, bigint, bigint, bigint, bigint, bigint],
        [r0, r1]: [bigint, bigint]
    ) {
        const proof = this.stark.prove(
            [
                { step: this.rounds, register: 0, value: r0 },
                { step: this.rounds, register: 1, value: r1 },
            ],
            [...value, ...salt].map((i) => [i])
        );
        return this.stark.serialize(proof).toString('base64');
    }

    verify(hash: string, proof: string, salt: [bigint, bigint, bigint, bigint, bigint, bigint]) {
        const [r0, r1] = hash.match(/.{1,32}/g)!.map((i) => BigInt(`0x${i}`));
        try {
            return this.stark.verify(
                [
                    { step: this.rounds, register: 0, value: r0 },
                    { step: this.rounds, register: 1, value: r1 },
                ],
                this.stark.parse(Buffer.from(proof, 'base64')), salt.map((i) => [i])
            );
        } catch {
            return false;
        }
    }
}
