import { uint8ArrayToHex } from './codec';

export const randomId = (length = 16) => {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return uint8ArrayToHex(array);
};
