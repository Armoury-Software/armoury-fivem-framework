import { Inject, Injectable, Optional } from "injection-js";
import { Observable, Subject } from "rxjs";
import { EventListener, Export } from "../../decorators";
import { isJSON } from "../../utils/utils";

@Injectable()
export class ServerResourceDatabase<T extends { id: number }> {
    private _onBoundEntityDestroyed$: Subject<{ entity: T, boundPlayer: number }> = new Subject();
    public get onBoundEntityDestroyed$(): Observable<{ entity: T, boundPlayer: number }> {
        return this._onBoundEntityDestroyed$.asObservable();
    }

    private _onSync$: Subject<{ player: number } | void> = new Subject();
    public get onSync$(): Observable<{ player: number } | void> {
        return this._onSync$.asObservable();
    }

    private _entities: T[] = [];
    public get entities(): T[] {
        return this._entities;
    }

    private _cachedProperties: string[] = [];
    public get cachedProperties(): string[] {
        return this._cachedProperties;
    }

    private _playerToEntityBindings: Map<number, (number | string)[]> = new Map();
    public get playerToEntityBindings(): Map<number, (number | string)[]> {
        return this._playerToEntityBindings;
    }

    public constructor(
        @Inject('tableName') public readonly _tableName: string,
        @Optional() @Inject('loadEverythingAtStart') public readonly _loadAllAtStart?: boolean,
    ) {
        this.computeTableProperties();

        if (this._loadAllAtStart) {
            this.loadDBEntities();
        }

        this.onSync$.subscribe((data: { player: number } | void) => {
            // TODO: Probable performance issue cause. Entity updates should be sent to clients only for a specific property, so they don't need to wipe ALL data and rewrite it back.
            Cfx.Server.TriggerClientEvent(`${Cfx.Server.GetCurrentResourceName()}:db-send-entities`, data?.player ?? -1, this.entities);
        });
    }

    public create(entity: T, forceId?: number): Promise<T | null> {
        return (async () => {
            try {
                let entityProperties: string[] = this.getEntityProperties(entity);
                let entityValues: string[] = this.getEntityPropertiesValues(entity, entityProperties);

                if (forceId) {
                    entityProperties = ['id', ...entityProperties];
                    entityValues = [forceId.toString(), ...entityValues]
                }

                const id: any =
                    await Cfx.exports['oxmysql'].insert_async(
                        `INSERT INTO \`${this._tableName}\` (${entityProperties.join(', ')}) VALUES (${Array(entityProperties.length).fill('?').join(', ')})`,
                        entityValues
                    );

                const createdEntity: T = { ...entity, id: forceId || id };
                this._entities.push(createdEntity);
                this._onSync$.next();

                return createdEntity;
            }
            catch (error: any) {
                console.log(error);
                return null;
            }
        })();
    }

    public remove(entity: T): Promise<boolean> {
        return (async () => {
            try {
                const result: any =
                    await Cfx.exports['oxmysql'].query_async(
                        `DELETE FROM \`${this._tableName}\` WHERE id = ?`,
                        [entity.id]
                    );

                this._entities = this._entities.filter((_entity: T) => _entity.id !== entity.id);
                this._onSync$.next();

                return !!result;
            }
            catch (error: any) {
                console.log(error);
                return false;
            }
        })();
    }

    public saveAsync(id: number): Promise<boolean> {
        return (async () => {
            try {
                const entity: T | undefined = this.getEntityByDBId(id);

                if (!entity)
                    return false;

                const updateKeys: string[] = this.getEntityProperties(entity);
                const updateValues: string[] = this.getEntityPropertiesValues(entity, updateKeys);
                const concatString: string = ' = ?, ';

                const result: number =
                    await Cfx.exports['oxmysql'].update_async(
                        `UPDATE \`${this._tableName}\` SET ${updateKeys.join(concatString).concat(concatString).slice(0, -2)} WHERE id = ?`,
                        [...updateValues, entity.id]
                    );

                if (result) {
                    this._onSync$.next();
                }

                return result > 0;
            }
            catch (error: any) {
                console.log(error);
                return false;
            }
        })();
    }

    protected async loadDBEntityFor(value: number | string, key: string = 'id', bindTo?: number): Promise<T | T[] | null> {
        const result: T[] = (await Cfx.exports['oxmysql'].query_async(`SELECT * FROM \`${this._tableName}\` WHERE ${key} = ?`, [value])).map(
            (resultItem: any) => {
                Object.keys(resultItem).forEach((property: string) => {
                    resultItem[property] = JSON.parse(isJSON(resultItem[property].toString()) ? resultItem[property] : `"${resultItem[property]}"`, function (_k, v) {
                        return (typeof v === "object" || isNaN(v)) ? v : Number(v);
                    });
                });

                return resultItem;
            }
        );

        if (result?.length) {
            result.forEach((entity: T) => {
                this._entities.push(entity);

                if (bindTo) {
                    this.bindEntityToPlayerByEntityId(entity.id, bindTo);
                }
            });
            setTimeout(() => { this._onSync$.next(); }, 2000);

            return <T | T[]>(result?.length > 1 ? result : result[0]);
        }

        return null;
    }

    protected async loadDBEntities(): Promise<T[]> {
        const result: T[] = (await Cfx.exports['oxmysql'].query_async(`SELECT * FROM \`${this._tableName}\``, [])).map(
            (resultItem: any) => {
                Object.keys(resultItem).forEach((property: string) => {
                    resultItem[property] = JSON.parse(isJSON(resultItem[property].toString()) ? resultItem[property] : `"${resultItem[property]}"`, function (_k, v) {
                        return (typeof v === "object" || isNaN(v)) ? v : Number(v);
                    });
                });

                return resultItem;
            }
        );

        if (result?.length) {
            this._entities = result;

            setTimeout(() => { this._onSync$.next(); }, 2000);
        }

        return this._entities;
    }

    private getEntityProperties(entity: T): string[] {
        const keys: string[] = [];
        for (let key in entity) {
            if (key !== 'id' && (!this._cachedProperties.length || this._cachedProperties.includes(key))) {
                keys.push(key);
            }
        }

        return keys;
    }

    private getEntityPropertiesValues(entity: T, properties: string[]): string[] {
        return properties.map((key: string) => {
            if (Array.isArray((<any>entity)[key]) || typeof ((<any>entity)[key]) === 'object') {
                return JSON.stringify((<any>entity)[key]);
            }

            return (<any>entity)[key].toString();
        });
    }

    public bindEntityToPlayer(entity: T, playerId: number): void {
        if (this.entities.includes(entity)) {
            this.bindEntityToPlayerByEntityId(entity.id, playerId);
        }
    }

    public bindEntityToPlayerByEntityId(id: number | string, playerId: number): void {
        const entityExists: boolean = this._entities.some((entity: T) => entity.id === id);

        if (entityExists) {
            if (this._playerToEntityBindings.has(playerId)) {
                this._playerToEntityBindings.set(playerId, [...this._playerToEntityBindings.get(playerId)!, id]);
            } else {
                this._playerToEntityBindings.set(playerId, [id]);
            }
        }
    }

    @EventListener()
    public onPlayerAuthenticate(playerId: number, _player: any): void {
        console.log('a player has authenticated!');
        if (this._entities.length) {
            this._onSync$.next({ player: playerId });
        }
    }

    @EventListener()
    public onPlayerDisconnect(): void {
        if (this._playerToEntityBindings.has(Cfx.source)) {
            const bindings: (number | string)[] =
                (this._playerToEntityBindings.has(Cfx.source)
                    ? this._playerToEntityBindings.get(Cfx.source)
                    : [])!;

            bindings.forEach((entityId: number | string) => {
                const entityBoundToPlayer: T | undefined = this._entities.find((entity: T) => entity.id === entityId);

                if (entityBoundToPlayer) {
                    this._onBoundEntityDestroyed$.next({ entity: entityBoundToPlayer, boundPlayer: Cfx.source });
                    this._entities.splice(this._entities.indexOf(entityBoundToPlayer), 1);
                }
            });

            this._playerToEntityBindings.delete(Cfx.source);
        }
    }

    private async computeTableProperties(): Promise<void> {
        const result: any[] = await Cfx.exports['oxmysql'].query_async(
            `DESCRIBE ${this._tableName}`,
            []
        );

        if (result) {
            result.forEach((sqlStructureObject: any) => {
                this._cachedProperties.push(sqlStructureObject.Field);
            });
        } else {
            console.error(`[SQL ERROR:] computeTableProperties for ${Cfx.Server.GetCurrentResourceName()} did not work.`);
        }
    }

    public getEntityByDBId(id: number): T | undefined {
        return this._entities.find((_entity: T) => _entity.id === id);
    }

    @Export()
    public getEntities(): T[] {
        return this._entities;
    }
}
