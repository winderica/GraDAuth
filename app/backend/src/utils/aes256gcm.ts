import crypto from 'crypto';

export const decrypt = (encrypted: string, key: string, iv: string) => {
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    const buffer = Buffer.from(encrypted, 'base64');
    decipher.setAuthTag(buffer.slice(-16));
    return decipher.update(buffer.slice(0, -16), undefined, 'utf8') + decipher.final('utf8');
};
