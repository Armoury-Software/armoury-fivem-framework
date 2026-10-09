export abstract class SessionItem<T> implements ISessionItem<T> {
    public constructor(
        public readonly name: string,
        public readonly defaultValue: T,
        public readonly critical: boolean = false
    ) { }

    public load(_accountId: number, _characterId: number, bruteValue: any): Promise<T> {
        return Promise.resolve(!Number.isNaN(Number(bruteValue))
            ? Number(bruteValue!)
            : bruteValue!
        );
    }

    public compute(_playerId: number, originalValue: T): T {
        return originalValue;
    }
}

export interface ISessionItem<T> extends ISessionItemBase {
    defaultValue: T;
    compute(playerId: number, originalValue: T): T;
    load(accountId: number, characterId: number, bruteValue: any): Promise<T>;
    save?(accountId: number, characterId: number, value: T): Promise<void>;
}

export interface ISessionItemBase {
    name: string;
    defaultValue: any;
    critical?: boolean;
    compute(playerId: number, originalValue: any): any;
    load(accountId: number, characterId: number, bruteValue: any): any;
    save?(accountId: number, characterId: number, value: any): Promise<void>;
}
