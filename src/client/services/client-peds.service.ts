import { Injectable } from "injection-js";
import { Delay } from "../../utils/utils";

@Injectable()
export class ClientPedsService {
    private _peds: number[] = [];
    public get peds(): number[] {
        return this._peds;
    }

    // TODO: Use $onInit
    public constructor() {
        Cfx.Client.onNet('onResourceStop', (resourceName: string) => {
            if (resourceName === Cfx.Client.GetCurrentResourceName()) {
                this._peds.forEach((ped: number) => {
                    this.remove(ped);
                });

                this._peds = [];
            }
        });
    }

    public remove(ped: number) {
        if (Cfx.Client.DoesEntityExist(ped)) {
            Cfx.Client.DeleteEntity(ped);
        }

        if (this._peds.indexOf(ped) > -1) {
            this._peds.splice(this._peds.indexOf(ped), 1);
        }
    }

    public async createInsideVehicleAsync(vehicle: number, pedType: number, modelHash: number | string, seat: number, isNetwork: boolean, bScriptHostPed: boolean): Promise<number> {
        let attempts: number = 0;

        Cfx.Client.RequestModel(modelHash);
        while (!Cfx.Client.HasModelLoaded(modelHash)) {
            if (attempts > 10) {
                return 0;
            }

            await Delay(100);
            attempts++;
        }

        const createdPed: number = Cfx.Client.CreatePedInsideVehicle(vehicle, pedType, modelHash, seat, isNetwork, bScriptHostPed);
        if (createdPed) {
            this._peds.push(createdPed);
        }
        return createdPed;
    }

    public async createAsync(pedType: number, modelHash: number, x: number, y: number, z: number, heading: number, isNetwork: boolean, bScriptHostPed: boolean): Promise<number> {
        let attempts: number = 0;

        Cfx.Client.RequestModel(modelHash);
        while (!Cfx.Client.HasModelLoaded(modelHash)) {
            if (attempts > 10) {
                return 0;
            }

            await Delay(100);
            attempts++;
        }

        const createdPed: number = Cfx.Client.CreatePed(pedType, modelHash, x, y, z, heading, isNetwork, bScriptHostPed);
        if (createdPed) {
            this._peds.push(createdPed);
        }
        return createdPed;
    }

    public async playAnim(ped: number, animationDict: string, animationName: string, duration: number, flag: number = 0, blendInSpeed: number = 8.0, blendOutSpeed: number = 8.0): Promise<void> {
        let attempts: number = 0;

        Cfx.Client.RequestAnimDict(animationDict);
        while (!Cfx.Client.HasAnimDictLoaded(animationDict)) {
            if (attempts > 10) {
                return;
            }

            await Delay(100);
            attempts++;
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

    public async setModelAsync(ped: number, modelHash: number): Promise<boolean> {
        let attempts: number = 0;

        Cfx.Client.RequestModel(modelHash);
        while (!Cfx.Client.HasModelLoaded(modelHash)) {
            if (attempts > 10) {
                return false;
            }

            await Delay(100);
            attempts++;
        }

        Cfx.Client.SetPlayerModel(ped, modelHash);
        Cfx.Client.SetModelAsNoLongerNeeded(modelHash);

        return true;
    }
}