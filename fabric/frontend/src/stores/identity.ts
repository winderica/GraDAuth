import { makeAutoObservable } from 'mobx';

export class IdentityStore {
    password = '';

    constructor() {
        makeAutoObservable(this);
    }

    setPassword(password: string) {
        this.password = password;
    }
}
