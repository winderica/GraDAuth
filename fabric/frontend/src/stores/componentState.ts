import { makeAutoObservable } from 'mobx';

export class ComponentStateStore {
    progressOn = false;

    constructor() {
        makeAutoObservable(this);
    }

    setProgress(on = true) {
        this.progressOn = on;
    }
}
