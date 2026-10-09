import { Inject, Injectable, Optional, Provider } from "injection-js";
import { IAccount } from "../../../shared";
import { ISessionItemBase } from "../../models";
import { isJSON } from "../../../utils/utils";
import { ISession } from "../../models/session/session.model";
import { EVENT_DIRECTIONS, EventListener, Export } from "../../../decorators";

@Injectable()
export class ServerSessionService {
    private _sessions: Map<number, ISession> = new Map();
    private _untrackedSessionItems: string[] = [];

    public get players(): number[] {
        return Array.from(this._sessions.keys());
    }

    public get authenticatedPlayers(): number[] {
        return Array.from(this._sessions.entries())
            .filter(([, session]) => session.id)
            .map(([playerId,]) => playerId);
    }

    public constructor(
        @Optional() @Inject('sessionItems') private readonly _sessionItems?: ISessionItemBase[],
    ) {
        this._sessionItems = _sessionItems?.filter((item) => !!item) ?? [];

        if (!Cfx.exports['oxmysql']) {
            console.error(`[Armoury (${Cfx.Server.GetCurrentResourceName()}):] Could not find the 'oxmysql' resource. Armoury's session service can't work without it. Did you forget to load it?`);
            return;
        }
    }

    /**
     * Registers an account.
     * @param playerId The playerId (NOT from the database) of this player
     * @param accountName The account name of this player
     * @param hashedPassword The hashed password of this account
     * @param email The email of this account
     * @returns The SQL ID of the newly-created account
     */
    public async register(playerId: number, accountName: string, hashedPassword: string, email: string): Promise<number> {
        const accountId = await Cfx.exports['oxmysql'].insert_async(
            'INSERT INTO `accounts`(`name`, `password`, `email`) VALUES (?, ?, ?)',
            [accountName, hashedPassword, email]
        );

        this._sessions.set(playerId, { accountId });

        return accountId;
    }

    /**
     * Logs into an account
     * @param playerId The playerId (NOT from the database) of this player
     * @param email The email of the account
     * @param hashedPassword The hashed password fo this account
     * @returns Account data for this account
     */
    public async login(playerId: number, email: string, hashedPassword: string): Promise<IAccount> {
        const result = await Cfx.exports['oxmysql'].single_async(
            'SELECT * FROM `accounts` WHERE email=? AND password=?',
            [email, hashedPassword]
        );

        this._sessions.set(playerId, { accountId: result.id });

        return result;
    }

    /**
     * Fetches all the characters related to the provided account
     * @param playerId The playerId (NOT from the database) of this player
     * @param accountId The accountId of the
     * @returns Data for all characters on the given account
     */
    public async fetch(playerId: number, accountId?: number): Promise<ISession[]> {
        accountId = accountId ?? this._sessions.get(playerId)?.accountId;

        return await global.exports['oxmysql'].query_async(
            `SELECT * FROM players WHERE accountId = ?`,
            [accountId]
        );
    }

    /**
     * Loads the entire character given a character ID
     * @param playerId The playerId (NOT from the database) of this player
     * @param characterId The character's SQL ID
     * @returns Data for the given characterId
     */
    public async load(playerId: number, characterId: number): Promise<ISession> {
        if (!this._sessions.has(playerId)) {
            throw new Error('No session has been found for that user.');
        }

        const session: ISession = await global.exports['oxmysql'].single_async(
            'SELECT * FROM `players` WHERE id=? AND accountId=?',
            [characterId, this._sessions.get(playerId)?.accountId!]
        );

        Array.from(Object.entries(session))
            .map(([key, ]) => this._sessionItems?.find((sessionItem) => sessionItem.name === key))
            .filter((sessionItem) => !!sessionItem)
            .forEach(async (sessionItem) => {
                console.log('for sessionItem', sessionItem!.name, 'the value is', await sessionItem?.load(this._sessions.get(playerId)?.accountId!, characterId, session[sessionItem?.name!]) ?? session[sessionItem?.name!].value);
                this.setPlayerInfo(
                    playerId, sessionItem!.name,
                    await sessionItem?.load(this._sessions.get(playerId)?.accountId!, characterId, session[sessionItem?.name!]) ?? session[sessionItem?.name!].value
                )
            });

        this._sessions.set(playerId, { ...this._sessions.get(playerId)!, id: characterId });

        return session;
    }

    /**
     * Creates a character 
     * @param playerId 
     * @param accountName 
     * @param hashedPassword 
     * @param email 
     * @returns 
     */
    public async create(playerId: number, accountId?: number): Promise<number> {
        accountId = accountId ?? this._sessions.get(playerId)?.accountId;

        const characterId = await Cfx.exports['oxmysql'].insert_async(
            'INSERT INTO `players`(`accountId`) VALUES (?)',
            [accountId]
        );

        this._sessions.set(playerId, { accountId });

        return characterId;
    }

    public setPlayerInfo<T>(playerId: number, stat: string, value: T, ...args: any[]): void {
        const updater = new SessionUpdater(playerId).from(stat, value, ...args);
        updater.execute(this.getPlayerInfo<number>(playerId, 'accountId'), this.getPlayerInfo<number>(playerId, 'id'), this._sessionItems!);

        const untrackedItems = updater.items
            .filter((item) =>
                !this._untrackedSessionItems.includes(item.stat)
                && !this._sessionItems?.some((sessionItem) => sessionItem.name === item.stat)
            );

        if (untrackedItems.length) {
            this._untrackedSessionItems.push(...untrackedItems.map((item) => item.stat));
        }
    }

    public setPlayerCash(playerId: number, value: number, options?: SessionUpdaterOptions): void {
        return this.setPlayerInfo(playerId, 'cash', value, options);
    }

    public givePlayerCash(playerId: number, value: number, options?: SessionUpdaterOptions): void {
        return this.setPlayerCash(playerId, this.getPlayerCash(playerId) + value, options);
    }

    public getPlayerCash(playerId: number): number {
        return this.getPlayerInfo<number>(playerId, 'cash');
    }

    public saveCritical(playerId: number): void {
        const criticalStats: string[] = this._sessionItems
            ?.filter((sessionItem) => sessionItem.critical)
            ?.map((sessionItem) => sessionItem.name)!;

        console.log(`${Cfx.Server.GetCurrentResourceName()}: Critical keys are`, criticalStats, 'playerId is', playerId);

        this.setPlayerInfo(
            playerId,
            criticalStats[0],
            this.getPlayerInfo(playerId, criticalStats[0]),
            ...criticalStats.slice(1).reduce((prev: string[], curr: string) => [
                ...prev,
                curr,
                this.getPlayerInfo(playerId, curr)
            ], []),
            {
                executeSqlCommand: true
            }
        );
    }

    public getPlayerInfo<T>(playerId: number, stat: string): T {
        let value: string = Cfx.Server.GetConvar(`${playerId}_PI_${stat}`, '-1');

        if (isJSON(value.toString())) {
            value = JSON.parse(value, function (_k, v) {
                return typeof v === 'object' || isNaN(v) ? v : Number(v);
            });
        }

        return value as unknown as T;
    }

    public clearPlayerInfo(playerId: number): void {
        [...this._sessionItems?.map((sessionItem) => sessionItem.name)!, ...this._untrackedSessionItems]
            .forEach((prop) => {
                Cfx.Server.SetConvarReplicated(`${playerId}_PI_${prop}`, '-1');
                Cfx.Server.SetConvarReplicated(`${playerId}_PI_${prop}_lastUpdate`, '-1');
            });
    }

    @EventListener({ eventName: 'onResourceStart', direction: EVENT_DIRECTIONS.CLIENT_TO_CLIENT })
    public onResourceStart(resource: string): void {
        if (resource !== Cfx.Server.GetCurrentResourceName()) {
            if (Cfx.exports[resource].exchangeSessionItems) {
                console.log(`[Armoury:] Resource (${resource}) has started. Attempting to exchange session items with it..`);
                this.exchangeSessionItems(Cfx.exports[resource].exchangeSessionItems(this._sessionItems ?? []) ?? []);
            }
        }
    }

    @Export()
    public exchangeSessionItems(items: ISessionItemBase[]): ISessionItemBase[] {
        items.forEach((item) => {
            if (!this._sessionItems?.some((sessionItem) => sessionItem.name === item.name)) {
                this._sessionItems?.push(item);
            }
        });

        console.log(`[${Cfx.Server.GetCurrentResourceName()}:] My updated session items are now`, this._sessionItems ?? []);
        return this._sessionItems ?? [];
    }

    public static withDefaults(): Provider {
        return ({
            provide: ServerSessionService,
            useFactory: (sessionItems) => new ServerSessionService(sessionItems || []),
            deps: ['sessionItems'],
        });
    }

    public static withItems<T extends { new(...args: any[]): any }>(...items: T[]): Provider[] {
        return [
            ...items.map((sessionItem) => ({
                provide: 'sessionItems',
                useValue: new sessionItem(),
                multi: true,
            })),
            ServerSessionService.withDefaults()
        ];
    }
}

class SessionUpdater {
    public items: SessionUpdaterItemBase[] = [];
    public options: SessionUpdaterOptions | null = null;

    public constructor(public readonly playerId: number) { }

    public from(...statsAndValues: string | any): SessionUpdater {
        if (statsAndValues.length % 2 !== 0 && typeof statsAndValues.slice(-1)[0] === 'object') {
            this.options = statsAndValues.slice(-1)[0];
        }

        for (let i = 0; i < statsAndValues.length; i += 2) {
            if (typeof statsAndValues[i] === 'string' && !!statsAndValues[i + 1]) {
                this.add(statsAndValues[i], statsAndValues[i + 1]);
            }
        }

        return this;
    }

    public add<T>(stat: string, value: T): SessionUpdater {
        this.items.push(<SessionUpdaterItem<T>>{ stat, value });
        return this;
    }

    public execute(accountId: number, characterId: number, sessionItems: ISessionItemBase[]): void {
        this.items.forEach((item) => {
            let value = item.value;

            const correspondingSessionItem = sessionItems.find((sessionItem) => sessionItem.name === item.stat);
            if (correspondingSessionItem) {
                value = correspondingSessionItem.compute(this.playerId, item.value);
            }

            Cfx.Server.SetConvarReplicated(
                `${this.playerId}_PI_${item.stat}`,
                Array.isArray(value) || typeof value === 'object'
                    ? JSON.stringify(value)
                    : value.toString()
            );

            Cfx.Server.SetConvarReplicated(
                `${this.playerId}_PI_${item.stat}_lastUpdate`,
                new Date().getTime().toString()
            );
        });

        if (this.options?.executeSqlCommand) {
            const syncableItems = this.items.filter(
                (item) => sessionItems.some(
                    (sessionItem) => sessionItem.name === item.stat) && !this.options?.ignoreSqlCommandFor?.includes(item.stat)
            );

            if (syncableItems.length) {
                const predicate = (item: SessionUpdaterItemBase) => sessionItems.find((sessionItem) => sessionItem.name === item.stat)?.save;
                const simpleSyncableItems = syncableItems.filter((item) => !predicate(item)).filter((item) => !!item && item.value != null);

                console.log('simpleSyncableItems are', simpleSyncableItems);

                Cfx.exports['oxmysql'].update_async(
                    `UPDATE \`players\` SET ${simpleSyncableItems.map((item) => `${item.stat} = ?`).join(', ')} WHERE id = ?`,
                    [...simpleSyncableItems.map((item) => JSON.stringify(item.value)), characterId]
                );

                const nonSimpleSyncableItems = syncableItems.filter((item) => predicate(item));
                nonSimpleSyncableItems.forEach((item) =>
                    sessionItems.find((sessionItem) => sessionItem.name === item.stat)!.save!(accountId, characterId, item.value)
                );
            }
        }
    }
}

interface SessionUpdaterItem<T> extends SessionUpdaterItemBase {
    value: T;
}

interface SessionUpdaterItemBase {
    stat: string,
    value: any;
}

interface SessionUpdaterOptions {
    executeSqlCommand?: boolean;
    ignoreSqlCommandFor?: string[];
}
