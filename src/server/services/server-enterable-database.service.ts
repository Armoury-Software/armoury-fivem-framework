import { Injectable } from "injection-js";
import { ServerResourceDatabase } from "./server-resource-database.service";
import { isPlayerInRangeOfPoint } from "../../utils/utils";

@Injectable()
export class ServerEnterableDatabase<
    T extends { id: number, entranceX: number, entranceY: number, entranceZ: number, exitX: number, exitY: number, exitZ: number }
> extends ServerResourceDatabase<T> {
    public getClosestToPlayer(player: number): T | null {
        return this.getClosestExitToPlayer(player) || this.getClosestEntranceToPlayer(player);
    }

    public getClosestEntranceToPlayer(source: number): T | null {
        // TODO: Replace here to actually get the closest, not the first one in the range
        const playerPosition: number[] = Cfx.Server.GetEntityCoords(Cfx.Server.GetPlayerPed(source.toString()));
        const entity: T | undefined = this.entities.find((_entity: T) => isPlayerInRangeOfPoint(playerPosition[0], playerPosition[1], playerPosition[2], _entity.entranceX, _entity.entranceY, _entity.entranceZ, 3.0));

        return entity || null;
    }

    public getClosestExitToPlayer(source: number): T | null {
        const virtualWorld: number = Math.max(0, Number(Cfx.exports['authentication'].getPlayerInfo(source, 'virtualWorld')));
        const entity: T | undefined = this.getEntityByDBId(virtualWorld);
        const playerPosition: number[] = Cfx.Server.GetEntityCoords(Cfx.Server.GetPlayerPed(source.toString()));

        // TODO: Replace here to actually get the closest, not the first one in the range
        if (entity && isPlayerInRangeOfPoint(playerPosition[0], playerPosition[1], playerPosition[2], entity.exitX, entity.exitY, entity.exitZ, 3.0)) {
            return entity;
        }

        return null;
    }
}
