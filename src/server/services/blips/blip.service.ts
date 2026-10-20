import { Injectable } from 'injection-js';

@Injectable()
export class Blip {

  private static _blipIds: Array<number> = [];

  public static createLocalized(
    x: number, y: number, z: number,
    localizationKey: string,
    options?: Omit<BlipCreateOptions, 'localizationKey'>
  ): number {
    const newOptions: BlipCreateOptions = {
      ...(options ? options : {}),
      localizationKey
    }

    return this.create(x, y, z, newOptions);
  }

  public static create(x: number, y: number, z: number, options?: BlipCreateOptions): number {
    options = { ...options, toPlayerId: options?.toPlayerId ?? -1 };

    const lastBlipId = !this._blipIds.length ? -1 : this._blipIds[this._blipIds.length - 1];
    const blipId = lastBlipId + 1;

    this._blipIds.push(blipId);

    Cfx.emitNet('armoury:safe:blip:create', options.toPlayerId, blipId, x, y, z, options.spriteId ?? undefined, options.localizationKey ?? undefined);
    Cfx.emit('armoury:safe:blip:created', blipId, x, y, z, options);

    return blipId;
  }

}

type BlipCreateOptions = {
  spriteId?: number;
  localizationKey?: string;
  toPlayerId?: number;
}
