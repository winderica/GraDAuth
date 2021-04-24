import { fromUint8Array, hexToUint8Array, toUint8Array, uint8ArrayToHex } from './codec';

export class AES {
    readonly #key: CryptoKey;

    readonly #iv: Uint8Array;

    readonly #algorithm: string;

    constructor(key: CryptoKey, iv?: Uint8Array, algorithm = 'AES-GCM') {
        this.#key = key;
        this.#iv = iv ?? crypto.getRandomValues(new Uint8Array(algorithm === 'AES-GCM' ? 12 : 16));
        this.#algorithm = algorithm;
    }

    static convertKey(key: string, algorithm = 'AES-GCM') {
        return crypto.subtle.importKey(
            'raw',
            hexToUint8Array(key),
            {
                name: algorithm,
                length: 256,
            },
            false,
            ['encrypt', 'decrypt'],
        );
    }

    static convertIV(iv: string) {
        return hexToUint8Array(iv);
    }

    get iv() {
        return uint8ArrayToHex(this.#iv);
    }

    async encrypt(
        plaintext: string,
        plaintextEncoding: 'hex' | 'utf-8' | 'base64' = 'utf-8',
        ciphertextEncoding: 'hex' | 'utf-8' | 'base64' = 'base64'
    ) {
        return fromUint8Array(new Uint8Array(await crypto.subtle.encrypt(
            {
                name: this.#algorithm,
                iv: this.#algorithm === 'AES-CTR' ? undefined : this.#iv,
                counter: this.#algorithm === 'AES-CTR' ? this.#iv : undefined,
                length: this.#algorithm === 'AES-CTR' ? 64 : undefined,
            },
            this.#key,
            toUint8Array(plaintext, plaintextEncoding),
        )), ciphertextEncoding);
    }

    async decrypt(
        ciphertext: string,
        ciphertextEncoding: 'hex' | 'utf-8' | 'base64' = 'base64',
        plaintextEncoding: 'hex' | 'utf-8' | 'base64' = 'utf-8',
    ) {
        return fromUint8Array(new Uint8Array(await crypto.subtle.decrypt(
            {
                name: this.#algorithm,
                iv: this.#algorithm === 'AES-CTR' ? undefined : this.#iv,
                counter: this.#algorithm === 'AES-CTR' ? this.#iv : undefined,
                length: this.#algorithm === 'AES-CTR' ? 64 : undefined,
            },
            this.#key,
            toUint8Array(ciphertext, ciphertextEncoding),
        )), plaintextEncoding);
    }
}
