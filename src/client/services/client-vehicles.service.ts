import { Injectable } from "injection-js";
import { Delay } from "../../utils/utils";

@Injectable()
export class ClientVehiclesService {
    private _vehicles: number[] = [];
    public get vehicles(): number[] {
        return this._vehicles;
    }

    // TODO: Use $onInit
    public constructor() {
        Cfx.Client.onNet('onResourceStop', (resourceName: string) => {
            if (resourceName === Cfx.Client.GetCurrentResourceName()) {
                this._vehicles.forEach((vehicle: number) => {
                    this.remove(vehicle);
                });

                this._vehicles = [];
            }
        });
    }

    /** Wrapper of FiveM's native CreateVehicle - includes requesting the model */
    public async createAsync(modelHash: string | number, x: number, y: number, z: number, heading: number, isNetwork: boolean, netMissionEntity: boolean, putPlayerInVehicle: boolean = false): Promise<number> {
        let attempts: number = 0;

        Cfx.Client.RequestModel(modelHash);
        while (!Cfx.Client.HasModelLoaded(modelHash)) {
            if (attempts > 10) {
                return 0;
            }

            await Delay(100);
            attempts++;
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

    public remove(vehicle: number) {
        if (Cfx.Client.DoesEntityExist(vehicle)) {
            Cfx.Client.DeleteEntity(vehicle);
        }

        if (this._vehicles.indexOf(vehicle) > -1) {
            this._vehicles.splice(this._vehicles.indexOf(vehicle), 1);
        }
    }
}