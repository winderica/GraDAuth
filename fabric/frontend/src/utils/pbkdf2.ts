export const deriveKeyFromPassword = async (password: string, salt: Uint8Array) => {
    return new Uint8Array(await crypto.subtle.exportKey(
        'raw',
        await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt,
                iterations: 100000,
                hash: 'SHA-256',
            },
            await crypto.subtle.importKey(
                'raw',
                new TextEncoder().encode(password),
                'PBKDF2',
                false,
                ['deriveBits', 'deriveKey']
            ),
            {
                name: 'AES-GCM',
                length: 256,
            },
            true,
            ['encrypt']
        )
    ));
};
