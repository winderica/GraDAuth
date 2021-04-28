export const deriveKeyFromPassword = async (password: string, salt: Uint8Array) => {
    return await crypto.subtle.deriveKey(
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
            name: 'HMAC',
            hash: {
                name: 'SHA-256',
            },
        },
        true,
        ['sign', 'verify']
    );
};
