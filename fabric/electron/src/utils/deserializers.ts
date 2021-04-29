import assert from 'assert';

export const parseSalt = (tag: string, now: number) => {
    assert(tag.length === 64);
    return tag
        .match(/.{1,16}/g)!
        .map((i) => BigInt(`0x${i}`))
        .concat([BigInt(now), 0n]) as [bigint, bigint, bigint, bigint, bigint, bigint];
};

export const parseKey = (key: string) => {
    assert(key.length === 64);
    return key
        .match(/.{1,16}/g)!
        .map((i) => BigInt(`0x${i}`))
        .concat([0n, 0n]) as [bigint, bigint, bigint, bigint, bigint, bigint];
};
