import { Context, Contract } from 'fabric-contract-api';
import got from 'got';

import { DataLedger } from '../ledger';
import { G1, G2, PRE } from '../utils/pre';
import { verify } from '../utils/verify';

interface Data {
    key: {
        ca0: string;
        ca1: string;
    };
    data: string;
    iv: string;
}

class PreDAuthContext extends Context {
    data: DataLedger;

    constructor() {
        super();
        this.data = new DataLedger(this);
    }
}

export class PreDAuth extends Contract {
    pre!: PRE;

    g!: G1;

    h!: G2;

    createContext() {
        return new PreDAuthContext();
    }

    async init(_: PreDAuthContext, str1: string, str2: string) {
        this.pre = new PRE();
        await this.pre.init();
        const { g, h } = this.pre.generatorGen(str1, str2);
        this.g = g;
        this.h = h;
    }

    async getData(ctx: PreDAuthContext, json: string) {
        const tags: string[] = JSON.parse(json);
        const result: Record<string, Data> = {};
        for (const tag of tags) {
            result[tag] = JSON.parse(await ctx.data.get([tag]));
        }
        return JSON.stringify(result);
    }

    async setData(ctx: PreDAuthContext, json: string) {
        const data: [string, Data, string][] = JSON.parse(json);
        for (const [tag, value, proof] of data) {
            if (!verify(tag, proof)) {
                throw new Error('Verification failed');
            }
            await ctx.data.set([tag], JSON.stringify(value));
        }
    }

    async delData(ctx: PreDAuthContext, json: string) {
        const data: [string, string][] = JSON.parse(json);
        for (const [tag, proof] of data) {
            if (!verify(tag, proof)) {
                throw new Error('Verification failed');
            }
            await ctx.data.del([tag]);
        }
    }

    async reEncrypt(ctx: PreDAuthContext, json: string, to: string) {
        const data: [string, string, string][] = JSON.parse(json);
        for (const [tag, , proof] of data) {
            if (!verify(tag, proof)) {
                throw new Error('Verification failed');
            }
        }
        await got.post(to, {
            json: await Promise.all(data.map(async ([tag, rk]) => {
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
