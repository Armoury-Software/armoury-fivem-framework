import { Injectable } from "injection-js";
import { EventListener } from "../../decorators";

@Injectable()
export class ServerVirtualWorldsService {
    // Probable performance issue? Maybe calling the export so many times when changing the virtual world is too costly?
    private _virtualWorldsWithPlayers: Map<number, number[]> = new Map();
    /** This only counts virtual worlds related to the resource! If another resource changes the virtual world of the player, this resource won't know it! */
    public get virtualWorldsWithPlayers(): Map<number, number[]> {
        return this._virtualWorldsWithPlayers;
    }

    @EventListener({ eventName: 'playerEnteredScope' })
    public onPlayerEnteredScope(data: { for: number; player: number }): void {
        Cfx.Server.TriggerClientEvent(`${Cfx.Server.GetCurrentResourceName()}:refresh-virtual-world`, data.for);
    }

    public setPlayerVirtualWorld(playerId: number, virtualWorld: number): void {
        const currentPlayerVirtualWorld: number = this.getPlayerVirtualWorld(playerId);

        if (!isNaN(currentPlayerVirtualWorld)) {
            this._virtualWorldsWithPlayers.set(
                currentPlayerVirtualWorld,
                (this._virtualWorldsWithPlayers.has(currentPlayerVirtualWorld) ? this._virtualWorldsWithPlayers.get(currentPlayerVirtualWorld) : [])!.filter((_playerId: number) => _playerId !== playerId)
            );
        }

        const newPlayersInVirtualWorld: number[] = [
            ...(this._virtualWorldsWithPlayers.has(virtualWorld) ? this._virtualWorldsWithPlayers.get(virtualWorld) : [])!,
            playerId
        ];

        this._virtualWorldsWithPlayers.set(
            virtualWorld,
            newPlayersInVirtualWorld
        );

        Cfx.exports['authentication'].setPlayerInfo(playerId, 'virtualWorld', virtualWorld);
    }

    public getPlayerVirtualWorld(playerId: number): number {
        return Math.max(0, Number(Cfx.exports['authentication'].getPlayerInfo(playerId, 'virtualWorld')));
    }

    public removeClientsideVehicles(): void {
        Cfx.Server.TriggerClientEvent(`${Cfx.Server.GetCurrentResourceName()}:ARM_remove-vehicles`, -1);
    }
}