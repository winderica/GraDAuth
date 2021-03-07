interface Window {
    require<T>(dependency: string): T;

    require(dependency: 'electron'): {
        ipcRenderer: {
            once<T>(channel: string, listener: (event: Event, ...args: T) => void): this;
            on<T>(channel: string, listener: (event: Event, ...args: T) => void): this;
            send<T>(channel: string, ...args: T): void;
        };
    };
}
