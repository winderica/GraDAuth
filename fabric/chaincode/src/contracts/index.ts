import { Context, Contract } from 'fabric-contract-api';
import got from 'got';

import { DataLedger } from '../ledger';
import { parseSalt } from '../utils/deserializers';
import { Poseidon } from '../utils/poseidon';
import { G1, G2, PRE } from '../utils/pre';

const poseidon = new Poseidon();

interface Data {
    key: {
        ca0: string;
        ca1: string;
    };
    data: string;
    iv: string;
}

class GraDAuthContext extends Context {
    data: DataLedger;

    constructor() {
        super();
        this.data = new DataLedger(this);
    }
}

export class GraDAuth extends Contract {
    pre!: PRE;

    g!: G1;

    h!: G2;

    createContext() {
        return new GraDAuthContext();
    }

    async init(_: GraDAuthContext, str1: string, str2: string) {
        this.pre = new PRE();
        await this.pre.init();
        const { g, h } = this.pre.generatorGen(str1, str2);
        this.g = g;
        this.h = h;
    }

    async getData(ctx: GraDAuthContext, json: string) {
        const tags: string[] = JSON.parse(json);
        const result: Record<string, Data> = {};
        for (const tag of tags) {
            result[tag] = JSON.parse(await ctx.data.get([tag]));
        }
        return JSON.stringify(result);
    }

    async setData(ctx: GraDAuthContext, json: string) {
        const payload: [string, Data, number, string, string][] = JSON.parse(json);
        for (const [tag, , now, hash, proof] of payload) {
            if (Date.now() - now >= 10 * 1000 || !poseidon.verify(hash, proof, parseSalt(tag, now))) {
                throw new Error('Verification failed');
            }
        }
        for (const [tag, data] of payload) {
            await ctx.data.set([tag], JSON.stringify(data));
        }
    }

    async delData(ctx: GraDAuthContext, json: string) {
        const payload: [string, number, string, string][] = JSON.parse(json);
        for (const [tag, now, hash, proof] of payload) {
            if (Date.now() - now >= 10 * 1000 || !poseidon.verify(hash, proof, parseSalt(tag, now))) {
                throw new Error('Verification failed');
            }
        }
        for (const [tag] of payload) {
            await ctx.data.del([tag]);
        }
    }

    async reEncrypt(ctx: GraDAuthContext, json: string, to: string) {
        const payload: [string, string, number, string, string][] = JSON.parse(json);
        for (const [tag, , now, hash, proof] of payload) {
            if (Date.now() - now >= 10 * 1000 || !poseidon.verify(hash, proof, parseSalt(tag, now))) {
                throw new Error('Verification failed');
            }
        }
        await got.post(to, {
            json: await Promise.all(payload.map(async ([tag, rk]) => {
                const { key, data, iv }: Data = JSON.parse(await ctx.data.get([tag]));
                const { cb0, cb1 } = this.pre.reEncrypt(key, rk);
                return { data, key: { cb0, cb1 }, iv };
            })),
        });
    }

    getGH() {
        return JSON.stringify({
            g: this.pre.serialize(this.g),
            h: this.pre.serialize(this.h),
        });
    }
}
