import got from 'got';
import { Context, Contract } from 'fabric-contract-api';
import { DataLedger, IdentityLedger } from '../ledger';
import { verify } from '../utils/ecdsa';
import { G1, G2, PRE } from '../utils/pre';
import { Data, PK, Request, RK } from '../constants/types';

class PreDAuthContext extends Context {
    data: DataLedger;
    identity: IdentityLedger;

    constructor() {
        super();
        this.data = new DataLedger(this);
        this.identity = new IdentityLedger(this);
    }
}

export class PreDAuth extends Contract {
    pre!: PRE;
    g!: G1;
    h!: G2;

    createContext() {
        return new PreDAuthContext();
    }

    private handleReEncrypt(encrypted: Data, rk: RK) {
        return Object.fromEntries(Object.entries(rk).map(([tag, rk]) => {
            const { key, data, iv } = encrypted[tag];
            const { cb0, cb1 } = this.pre.reEncrypt(key, rk);
            return [tag, { data, key: { cb0, cb1 }, iv, }];
        }));
    }

    async init(_: PreDAuthContext, str1: string, str2: string) {
        this.pre = new PRE();
        await this.pre.init();
        const { g, h } = this.pre.generatorGen(str1, str2);
        this.g = g;
        this.h = h;
    }

    async getIdentity(ctx: PreDAuthContext, id: string) {
        return await ctx.identity.get([id]);
    }

    async setIdentity(ctx: PreDAuthContext, id: string, request: string) {
        const { nonce, signature, payload }: Request<PK> = JSON.parse(request);
        const publicKey = await this.getIdentity(ctx, id) || payload.publicKey;
        if (!verify(nonce, publicKey, signature)) {
            throw new Error('Verification failed');
        }
        await ctx.identity.set([id], payload.publicKey);
    }

    async getData(ctx: PreDAuthContext, id: string) {
        return await ctx.data.get([id]);
    }

    async setData(ctx: PreDAuthContext, id: string, request: string) {
        const { nonce, signature, payload }: Request<Data> = JSON.parse(request);
        if (!verify(nonce, await this.getIdentity(ctx, id), signature)) {
            throw new Error('Verification failed');
        }
        await ctx.data.set([id], JSON.stringify(payload));
    }

    async reEncrypt(ctx: PreDAuthContext, id: string, request: string, to: string) {
        const { nonce, signature, payload: tagRK }: Request<RK> = JSON.parse(request);
        if (!verify(nonce, await this.getIdentity(ctx, id), signature)) {
            throw new Error('Verification failed');
        }
        const encrypted: Data = JSON.parse(await this.getData(ctx, id));
        await got.post(to, { json: this.handleReEncrypt(encrypted, tagRK) });
    }

    getGH() {
        return JSON.stringify({
            g: this.pre.serialize(this.g),
            h: this.pre.serialize(this.h),
        });
    }
}

