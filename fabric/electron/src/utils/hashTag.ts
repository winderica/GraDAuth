import { sha256 } from './sha256';

export const hashTag = (tag: string, salt: string) =>
    sha256(`${tag}.${salt}`).match(/.{1,16}/g)!.map((i) => BigInt(`0x${i}`));
