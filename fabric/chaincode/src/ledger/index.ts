import { Context } from 'fabric-contract-api';

abstract class StateLedger {
    protected constructor(private readonly ctx: Context, private readonly name: string) {
    }

    async set(attributes: string[], state: string) {
        await this.ctx.stub.putState(
            this.ctx.stub.createCompositeKey(this.name, attributes),
            Buffer.from(state)
        );
    }

    async get(attributes: string[], throwIfEmpty = true) {
        const data = await this.ctx.stub.getState(this.ctx.stub.createCompositeKey(this.name, attributes));
        const result = Buffer.from(data).toString('utf8');
        if (throwIfEmpty && !result) {
            throw new Error(`Data of [${attributes.join(',')}] is empty`);
        }
        return result;
    }

    async del(attributes: string[]) {
        await this.ctx.stub.deleteState(this.ctx.stub.createCompositeKey(this.name, attributes));
    }
}

export class DataLedger extends StateLedger {
    constructor(ctx: Context) {
        super(ctx, 'dataLedger');
    }
}
