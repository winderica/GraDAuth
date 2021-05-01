import { fromUint8Array, toUint8Array } from './codec';

export const hmac = async (
    data: string,
    key: CryptoKey,
    inputEncoding: 'hex' | 'utf-8' | 'base64' = 'utf-8',
    outputEncoding: 'hex' | 'utf-8' | 'base64' = 'base64'
) => {
    const result = await crypto.subtle.sign('HMAC', key, toUint8Array(data, inputEncoding));
    return fromUint8Array(new Uint8Array(result), outputEncoding);
};
