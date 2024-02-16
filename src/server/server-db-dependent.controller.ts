import { EventListener, Export, FiveMController } from '../decorators/armoury.decorators';
import { ServerController } from "./server.controller";
import { Cfx } from "..";
import { isJSON } from '../utils/utils';

// @ts-ignore
@FiveMController()
export class ServerDBDependentController<T extends { id: number }> extends ServerController {
  private _entities: T[] = [];
  protected get entities(): T[] {
    return this._entities;
  }

  private _cachedProperties: string[] = [];
  protected get cachedProperties(): string[] {
    return this._cachedProperties;
  }

  private _playerToEntityBindings: Map<number, (number | string)[]> = new Map<number, (number | string)[]>();
  protected get playerToEntityBindings(): Map<number, (number | string)[]> {
    return this._playerToEntityBindings;
  }

  public constructor(protected dbTableName: string, loadAllAtStart: boolean = false) {
    super();

    this.computeTableProperties();

    if (loadAllAtStart) {
      this.loadDBEntities();
    }
  }

  // @ts-ignore
  @Export()
  protected getEntities(): T[] {
    return this._entities;
  }

  protected createEntity(entity: T, forceId?: number): Promise<T | null> {
    return (async () => {
      try {
        let entityProperties: string[] = this.getEntityProperties(entity);
        let entityValues: string[] = this.getEntityPropertiesValues(entity, entityProperties);

        if (forceId) {
          entityProperties = ['id', ...entityProperties];
          entityValues = [forceId.toString(), ...entityValues]
        }

        const id: any =
          await global.exports['oxmysql'].insert_async(
            `INSERT INTO \`${this.dbTableName}\` (${entityProperties.join(', ')}) VALUES (${Array(entityProperties.length).fill('?').join(', ')})`,
            entityValues
          );

        const createdEntity: T = { ...entity, id: forceId || id };
        this._entities.push(createdEntity);
        this.syncWithClients();

        return createdEntity;
      }
      catch (error: any) {
        console.log(error);
        return null;
      }
    })();
  }

  protected removeEntity(entity: T): Promise<boolean> {
    return (async () => {
      try {
        const result: any =
          await global.exports['oxmysql'].query_async(
            `DELETE FROM \`${this.dbTableName}\` WHERE id = ?`,
            [entity.id]
          );

        this._entities = this._entities.filter((_entity: T) => _entity.id !== entity.id);
        this.syncWithClients();

        return !!result;
      }
      catch (error: any) {
        console.log(error);
        return false;
      }
    })();
  }

  protected saveDBEntityAsync(id: number): Promise<boolean> {
    return (async () => {
      try {
        const entity: T | undefined = this.getEntityByDBId(id);

        if (!entity)
            return false;

        const updateKeys: string[] = this.getEntityProperties(entity);
        const updateValues: string[] = this.getEntityPropertiesValues(entity, updateKeys);
        const concatString: string = ' = ?, ';

        const result: number =
          await global.exports['oxmysql'].update_async(
            `UPDATE \`${this.dbTableName}\` SET ${updateKeys.join(concatString).concat(concatString).slice(0, -2)} WHERE id = ?`,
            [...updateValues, entity.id]
          );

        if (result) {
          this.syncWithClients();
        }

        return result > 0;
      }
      catch (error: any) {
        console.log(error);
        return false;
      }
    })();
  }

  protected getEntityByDBId(id: number): T | undefined {
    return this._entities.find((_entity: T) => _entity.id === id);
  }

  protected async loadDBEntityFor(value: number | string, key: string = 'id', bindTo?: number): Promise<T | T[] | null> {
    const result: T[] = (await global.exports['oxmysql'].query_async(`SELECT * FROM \`${this.dbTableName}\` WHERE ${key} = ?`, [value])).map(
      (resultItem: any) => {
        Object.keys(resultItem).forEach((property: string) => {
          resultItem[property] = JSON.parse(isJSON(resultItem[property].toString()) ? resultItem[property] : `"${resultItem[property]}"`, function(_k, v) { 
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
      setTimeout(() => { this.syncWithClients(); }, 2000);

      return <T | T[]>(result?.length > 1 ? result : result[0]);
    }

    return null;
  }

  protected async loadDBEntities(): Promise<T[]> {
    const result: T[] = (await global.exports['oxmysql'].query_async(`SELECT * FROM \`${this.dbTableName}\``, [])).map(
      (resultItem: any) => {
        Object.keys(resultItem).forEach((property: string) => {
          resultItem[property] = JSON.parse(isJSON(resultItem[property].toString()) ? resultItem[property] : `"${resultItem[property]}"`, function(_k, v) { 
            return (typeof v === "object" || isNaN(v)) ? v : Number(v); 
          });
        });

        return resultItem;
      }
    );

    if (result?.length) {
      this._entities = result;
      
      setTimeout(() => { this.syncWithClients(); }, 2000);
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
      if (Array.isArray((<any> entity)[key]) || typeof((<any> entity)[key]) === 'object') {
        return JSON.stringify((<any> entity)[key]);
      }

      return (<any> entity)[key].toString();
    });
  }

  protected syncWithClients(client?: number): void {
    // TODO: Probable performance issue cause. Entity updates should be sent to clients only for a specific property, so they don't need to wipe ALL data and rewrite it back.
    Cfx.Server.TriggerClientEvent(`${Cfx.Server.GetCurrentResourceName()}:db-send-entities`, client || -1, this.entities);
  }

  protected bindEntityToPlayer(entity: T, playerId: number): void {
    if (this.entities.includes(entity)) {
      this.bindEntityToPlayerByEntityId(entity.id, playerId);
    }
  }

  protected bindEntityToPlayerByEntityId(id: number | string, playerId: number): void {
    const entityExists: boolean = this._entities.some((entity: T) => entity.id === id);

    if (entityExists) {
      if (this._playerToEntityBindings.has(playerId)) {
        this._playerToEntityBindings.set(playerId, [...this._playerToEntityBindings.get(playerId)!, id]);
      } else {
        this._playerToEntityBindings.set(playerId, [id]);
      }
    }
  }

  protected onBoundEntityDestroyed(_entity: T, _boundPlayer: number): void { }

  // @ts-ignore
  @EventListener()
  public onPlayerAuthenticate(playerId: number, _player: any): void {
    if (this._entities.length) {
      this.syncWithClients(playerId);
    }
  }

  // @ts-ignore
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
          this.onBoundEntityDestroyed(entityBoundToPlayer, Cfx.source);
          this._entities.splice(this._entities.indexOf(entityBoundToPlayer), 1);
        }
      });

      this._playerToEntityBindings.delete(Cfx.source);
    }
  }

  private async computeTableProperties(): Promise<void> {
    const result: any[] = await global.exports['oxmysql'].query_async(
      `DESCRIBE ${this.dbTableName}`,
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
}