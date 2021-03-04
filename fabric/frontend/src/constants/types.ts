export interface Generators {
    g: string;
    h: string;
}

export type UserData = Record<string, { value: string; tag: string }>;

export type UserDataArray = { key: string; value: string; tag: string }[];

export type TaggedUserData = Record<string, Record<string, string>>;

export type TaggedUserDataArray = [string, Record<string, string>][];

export interface PreKeyPair {
    pk: string;
    sk: string;
}

export type TaggedPreKeyPair = Record<string, PreKeyPair>;

export interface Encrypted {
    data: string;
    key: {
        ca0: string;
        ca1: string;
    };
    iv: string;
}

export type TaggedEncrypted = Record<string, Encrypted>;

export type TaggedReKey = Record<string, string>;

export type Checked = Record<string, boolean | undefined>;
