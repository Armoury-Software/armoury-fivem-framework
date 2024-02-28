// TODO: Remove
import { COLOR_MAPPINGS } from './constants/color.mappings';
import { ClientBase } from './client.base';

import { Blip, BlipMonitored } from '../models/blip.model';
import { Marker, MarkerMonitored } from '../models/marker.model';
import { Delay } from '../utils/utils';
import { Controller, EventListener } from '../decorators';

@Controller()
export class ClientEntities extends ClientBase {
  private _blips: BlipMonitored[] = [];
  protected get blips(): Blip[] {
    return this._blips;
  }

  private _markers: MarkerMonitored[] = [];
  protected get markers(): Marker[] {
    return this._markers;
  }

  private _vehicles: number[] = [];
  protected get vehicles(): number[] {
    return this._vehicles;
  }

  private _peds: number[] = [];
  protected get peds(): number[] {
    return this._peds;
  }

  private _waypoints: number[] = [];
  protected get waypoints(): number[] {
    return this._waypoints;
  }

  private _checkpoints: Map<number, number[]> = new Map();
  protected get checkpoints(): Map<number, number[]> {
    return this._checkpoints;
  }

  public constructor() {
    super();

    this.assignDefaultEntityListeners();
  }

  protected createBlips(blips: Blip[]): void {
    const _blips: BlipMonitored[] = blips.map((blip: Blip) => <BlipMonitored>({ ...blip, instance: null }));

    this._blips.push(..._blips);
    this.refreshBlips();
  }

  protected createBlip(blip: Blip): number {
    const _blip: number = (
      !blip.type || blip.type === 'coords'
        ? Cfx.Client.AddBlipForCoord(blip.pos[0], blip.pos[1], blip.pos[2])
        : (
          blip.type === 'range'
            ? Cfx.Client.AddBlipForRadius(blip.pos[0], blip.pos[1], blip.pos[2], blip.scale || 1.0)
            : Cfx.Client.AddBlipForEntity(blip.entityId ?? Cfx.Client.PlayerPedId())
        )
    );

    if (!blip.type || blip.type !== 'range') {
      Cfx.Client.SetBlipScale(_blip, blip.scale || 1.0);
    }

    Cfx.Client.SetBlipSprite(_blip, blip.id);
    Cfx.Client.SetBlipDisplay(_blip, 4);
    Cfx.Client.SetBlipColour(_blip, blip.color);
    Cfx.Client.SetBlipAlpha(_blip, blip.alpha || 255);
    Cfx.Client.SetBlipAsShortRange(_blip, !blip.longRange);
    Cfx.Client.BeginTextCommandSetBlipName('STRING');
    Cfx.Client.AddTextComponentString(blip.title);
    Cfx.Client.EndTextCommandSetBlipName(_blip);

    return _blip;
  }

  protected clearBlip(blipId: number): void {
    this._blips = this._blips.filter((_blip) => _blip.instance !== blipId);

    if (Cfx.Client.DoesBlipExist(blipId)) {
      Cfx.Client.RemoveBlip(blipId);
    }
  }

  protected clearBlips(): void {
    this._blips.forEach((blip: BlipMonitored) => {
      Cfx.Client.RemoveBlip(blip.instance!);
    });

    this._blips = [];
  }

  private refreshBlips(): void {
    this.blips.forEach((blip: BlipMonitored) => {
      if (!blip.instance) {
        blip.instance = this.createBlip(blip);
      }
    });
  }

  /** Defines a custom, irreplaceable waypoint */
  protected createWaypoint(pos: number[], title?: string, color?: number, id?: number, routeColor?: number, diameter: number = 3.0): number {
    const currentResource: string = Cfx.Client.GetCurrentResourceName().replace('-', ' ');
    const defaultTitle: string = `${currentResource.slice(0, 1).toUpperCase()}${currentResource.slice(1)}`;

    const _waypoint: number = this.createBlip({
      id: id || 1,
      color: color || 69,
      title: title || defaultTitle,
      pos,
      longRange: true
    });
    this.createCheckpoint(2, pos[0], pos[1], pos[2], null, null, null, diameter, COLOR_MAPPINGS[color ?? 0][0], COLOR_MAPPINGS[color ?? 0][1], COLOR_MAPPINGS[color ?? 0][2], 255, 0);
    
    if (routeColor !== -1) {
      Cfx.Client.SetBlipRoute(_waypoint, true);
      if (routeColor) {
        Cfx.Client.SetBlipRouteColour(_waypoint, routeColor);
      }
    }

    this._waypoints.push(_waypoint);

    return _waypoint;
  }

  protected clearWaypoints(): void {
    this._waypoints.forEach((waypoint: number) => {
      this.clearWaypoint(waypoint, true);
    });

    this._waypoints = [];
  }

  protected clearWaypoint(waypoint: number, ignoreSplice: boolean = false): void {
    this.clearCheckpointByPosition(Cfx.Client.GetBlipCoords(waypoint));

    Cfx.Client.SetBlipRoute(waypoint, false);
    Cfx.Client.RemoveBlip(waypoint);

    if (!ignoreSplice) {
      this._waypoints.splice(this._waypoints.indexOf(waypoint), 1);
    }
  }

  protected createCheckpoint(
      type: number,
      posX1: number,
      posY1: number,
      posZ1: number,
      posX2: number | null,
      posY2: number | null,
      posZ2: number | null,
      diameter: number, 
  red: number, 
  green: number, 
  blue: number, 
  alpha: number, 
  reserved: number
  ): number {
    const checkpoint = Cfx.Client.CreateCheckpoint(type, posX1, posY1, posZ1, posX2!, posY2!, posZ2!, diameter, red, green, blue, alpha, reserved);
    this._checkpoints.set(checkpoint, [posX1, posY1, posZ1, posX2!, posY2!, posZ2!]);

    return checkpoint;
  }

  protected clearCheckpoint(checkpoint: number): void {
    Cfx.Client.DeleteCheckpoint(checkpoint);
    if (this._checkpoints.has(checkpoint)) {
      this._checkpoints.delete(checkpoint);
    }
  }

  protected clearCheckpointByPosition(pos: number[]): void {
    const checkpoint: number | undefined = Array.from(this._checkpoints.keys()).find(
      (_checkpoint: number) =>
        Math.floor(this._checkpoints.get(_checkpoint)![0]) === Math.floor(pos[0])
        && Math.floor(this._checkpoints.get(_checkpoint)![1]) === Math.floor(pos[1])
        && Math.floor(this._checkpoints.get(_checkpoint)![2]) === Math.floor(pos[2])
    );

    if (checkpoint) {
      this.clearCheckpoint(checkpoint);
    }
  }

  /** Defines permanent markers. Handles draw-per-tick automatically. */
  protected createMarkers(markers: Marker[]): void {
    const _markers: MarkerMonitored[] = markers.map((marker: Marker) => <Marker>({ ...marker, instance: null }));
    this._markers.push(..._markers);
  }

  protected clearMarkers(): void {
    this._markers = [];
  }

  /** Wrapper of FiveM's native CreateVehicle - includes requesting the model */
  protected async createVehicleAsync(modelHash: string | number, x: number, y: number, z: number, heading: number, isNetwork: boolean, netMissionEntity: boolean, putPlayerInVehicle: boolean = false): Promise<number> {
    let attempts: number = 0;

    Cfx.Client.RequestModel(modelHash);
    while (!Cfx.Client.HasModelLoaded(modelHash)) {
      if (attempts > 10) {
          return 0;
      }

      await Delay(100);
      attempts ++;
    }
    
    const createdVehicle: number = Cfx.Client.CreateVehicle(modelHash, x, y, z, heading, isNetwork, netMissionEntity);
    if (createdVehicle) {
      if (netMissionEntity) {
        this._vehicles.push(createdVehicle);
      }

      if (putPlayerInVehicle) {
        Cfx.Client.TaskWarpPedIntoVehicle(Cfx.Client.GetPlayerPed(-1), createdVehicle, -1);
      }
    }
    return createdVehicle;
  }

  protected removeVehicle(vehicle: number) {
    if (Cfx.Client.DoesEntityExist(vehicle)) {
      Cfx.Client.DeleteEntity(vehicle);
    }

    if (this._vehicles.indexOf(vehicle) > -1) {
      this._vehicles.splice(this._vehicles.indexOf(vehicle), 1);
    }
  }

  protected removePed(ped: number) {
    if (Cfx.Client.DoesEntityExist(ped)) {
      Cfx.Client.DeleteEntity(ped);
    }

    if (this._peds.indexOf(ped) > -1) {
      this._peds.splice(this._peds.indexOf(ped), 1);
    }
  }

  protected async createPedInsideVehicleAsync(vehicle: number, pedType: number, modelHash: number | string, seat: number, isNetwork: boolean, bScriptHostPed: boolean): Promise<number> {
    let attempts: number = 0;

    Cfx.Client.RequestModel(modelHash);
    while (!Cfx.Client.HasModelLoaded(modelHash)) {
        if (attempts > 10) {
            return 0;
        }

        await Delay(100);
        attempts ++;
    }
    
    const createdPed: number = Cfx.Client.CreatePedInsideVehicle(vehicle, pedType, modelHash, seat, isNetwork, bScriptHostPed);
    if (createdPed) {
        this._peds.push(createdPed);
    }
    return createdPed;
  }

  protected async createPedAsync(pedType: number, modelHash: number, x: number, y: number, z: number, heading: number, isNetwork: boolean, bScriptHostPed: boolean): Promise<number> {
    let attempts: number = 0;

    Cfx.Client.RequestModel(modelHash);
    while (!Cfx.Client.HasModelLoaded(modelHash)) {
        if (attempts > 10) {
            return 0;
        }

        await Delay(100);
        attempts ++;
    }
    
    const createdPed: number = Cfx.Client.CreatePed(pedType, modelHash, x, y, z, heading, isNetwork, bScriptHostPed);
    if (createdPed) {
        this._peds.push(createdPed);
    }
    return createdPed;
  }

  protected async playAnimForPed(ped: number, animationDict: string, animationName: string, duration: number, flag: number = 0, blendInSpeed: number = 8.0, blendOutSpeed: number = 8.0): Promise<void> {
    let attempts: number = 0;
    
    Cfx.Client.RequestAnimDict(animationDict);
    while (!Cfx.Client.HasAnimDictLoaded(animationDict)) {
      if (attempts > 10) {
          return;
      }

      await Delay(100);
      attempts ++;
    }

    if (Cfx.Client.HasAnimDictLoaded(animationDict)) {
      Cfx.Client.TaskPlayAnim(
        ped,
        animationDict,
        animationName,
        blendInSpeed,
        blendOutSpeed,
        duration,
        flag,
        0,
        false,
        false,
        false
      );
    }
  }

  protected async setPedModelAsync(ped: number, modelHash: number): Promise<boolean> {
    let attempts: number = 0;

    Cfx.Client.RequestModel(modelHash);
    while (!Cfx.Client.HasModelLoaded(modelHash)) {
        if (attempts > 10) {
            return false;
        }

        await Delay(100);
        attempts ++;
    }
    
    Cfx.Client.SetPlayerModel(ped, modelHash);
    Cfx.Client.SetModelAsNoLongerNeeded(modelHash);

    return true;
  }

  private assignDefaultEntityListeners(): void {
    Cfx.Client.onNet('onResourceStop', (resourceName: string) => {
      if (resourceName === Cfx.Client.GetCurrentResourceName()) {
        this._vehicles.forEach((vehicle: number) => {
          this.removeVehicle(vehicle);
        });

        this._peds.forEach((ped: number) => {
          this.removePed(ped);
        });

        this._vehicles = [];
        this._peds = [];
      }
    });
  }

  @EventListener({ eventName: `${Cfx.Client.GetCurrentResourceName()}:refresh-virtual-world` })
  protected onRefreshPlayersInVirtualWorld(): void {
    const activePlayers: number[] = Cfx.Client.GetActivePlayers();

    activePlayers.forEach((activePlayer: number) => {
      const playerServerId: number = Cfx.Client.GetPlayerServerId(activePlayer);
      if (this.getPlayerInfo('virtualWorld') === this.getPlayerInfo('virtualWorld', playerServerId)) {
        Cfx.Client.NetworkConcealPlayer(activePlayer, false, false);
      } else {
        Cfx.Client.NetworkConcealPlayer(activePlayer, true, false);
      }
    });
  }
}