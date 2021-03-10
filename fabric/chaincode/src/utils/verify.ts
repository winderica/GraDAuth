import { Assertion } from '@guildofweavers/genstark';

import { poseidonHashSTARK, rounds } from './poseidonHashSTARK';

export const verify = (hash: string, proof: string) => {
    const controls = hash.match(/.{1,32}/g)!.map((i) => BigInt(`0x${i}`));
    const assertions: Assertion[] = [
        { step: rounds, register: 0, value: controls[0] },
        { step: rounds, register: 1, value: controls[1] },
    ];

    try {
        return poseidonHashSTARK.verify(assertions, poseidonHashSTARK.parse(Buffer.from(proof, 'base64')));
    } catch {
        return false;
    }
};
