import { TaggedEncrypted, TaggedPreKeyPair, UserData, UserDataArray } from '../constants/types';

import { Alice } from './alice';

export const encrypt = async (
    aliceInstance: Alice,
    data: UserDataArray,
    dataKey = getDataKey(aliceInstance, data.map(({ tag }) => tag))
) => {
    const encrypted: TaggedEncrypted = {};
    for (const { key, tag, value } of data) {
        encrypted[tag] = await aliceInstance.encrypt(JSON.stringify({ key, value }), dataKey[tag].pk);
    }
    return { encrypted, dataKey };
};

export const getDataKey = (aliceInstance: Alice, tags: string[]) => {
    return Object.fromEntries(tags.map((tag) => [tag, aliceInstance.key()]));
};

export const decrypt = async (aliceInstance: Alice, data: TaggedEncrypted, dataKey: TaggedPreKeyPair) => {
    const decrypted: UserData = {};
    for (const [tag, encrypted] of Object.entries(data)) {
        const { key, value } = JSON.parse(await aliceInstance.decrypt(encrypted, dataKey[tag].sk));
        decrypted[key as string] = { tag, value };
    }
    return decrypted;
};
