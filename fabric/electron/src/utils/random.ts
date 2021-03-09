import { randomFillSync } from 'crypto';

export const random = (length = 16) => {
    const array = new Uint8Array(length);
    randomFillSync(array);
    return Buffer.from(array).toString('hex');
};
