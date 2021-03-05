import { BLS12_381, Common, Fr, G1, G2, GT, init, Mcl } from 'mcl';

export { Fr, G1, G2, GT };

export class PRE {
    mcl!: Mcl;

    g!: G1;

    h!: G2;

    async init(curve: number = BLS12_381) {
        this.mcl = await init(curve);
    }

    keyGenInG2(h: G2) {
        const sk = this.randomInFr(); // SKb = b is randomly selected from Fr
        const pk = this.mcl.mul(h, sk); // PKb = h^SKb = h^b
        return { sk, pk };
    }

    reDecrypt({ cb0, cb1 }: { cb0: Fr; cb1: GT }, sk: Fr) {
        const divisor = this.mcl.pow(cb1, this.mcl.inv(sk)); // (Z^(rb))^(1/Skb) = (Z^(rb))^(1/b) = Z^r
        const reDecrypted = this.mcl.sub(cb0, this.mcl.hashToFr(divisor.serialize())); // Cb0/Z^r = m*Z^r/Z^r = m
        return this.serialize(reDecrypted);
    }

    randomInFr() {
        const p = new this.mcl.Fr();
        p.setByCSPRNG();
        return p;
    }

    serialize(obj: Common) {
        return obj.serializeToHexStr();
    }

    deserialize(str: string, group: 'G1'): G1;

    deserialize(str: string, group: 'G2'): G2;

    deserialize(str: string, group: 'GT'): GT;

    deserialize(str: string, group: 'Fr'): Fr;

    deserialize(str: string, group: 'G1' | 'G2' | 'GT' | 'Fr') {
        switch (group) {
            case 'Fr':
                return this.mcl.deserializeHexStrToFr(str);
            case 'G1':
                return this.mcl.deserializeHexStrToG1(str);
            case 'G2':
                return this.mcl.deserializeHexStrToG2(str);
            case 'GT':
                return this.mcl.deserializeHexStrToGT(str);
        }
    }
}
