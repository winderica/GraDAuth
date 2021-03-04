import { makeAutoObservable } from 'mobx';

export class IdentityStore {
    password = sessionStorage.getItem('password') || '';

    constructor() {
        makeAutoObservable(this);
    }

    setPassword(password: string) {
        this.password = password;
        sessionStorage.setItem('password', password);
    }
}
