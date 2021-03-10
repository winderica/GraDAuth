export const parseTag = (tag: string) => tag.match(/.{1,16}/g)!.map((i) => BigInt(`0x${i}`));
