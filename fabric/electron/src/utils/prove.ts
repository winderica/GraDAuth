import { Assertion } from '@guildofweavers/genstark';

import { rounds } from './poseidonHashJS';
import { poseidonHashSTARK } from './poseidonHashSTARK';

export const prove = (inputs: bigint[], [r0, r1]: bigint[]) => {
    const assertions: Assertion[] = [
        { step: rounds, register: 0, value: r0 },
        { step: rounds, register: 1, value: r1 },
    ];

    const proof = poseidonHashSTARK.prove(assertions, inputs.map((i) => [i]));
    return poseidonHashSTARK.serialize(proof).toString('base64');
};
