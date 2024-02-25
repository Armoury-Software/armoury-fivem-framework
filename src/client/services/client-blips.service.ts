import { Injectable } from "injection-js";
import { Blip, BlipMonitored } from "../../models";

@Injectable()
export class ClientBlipsService {
    protected _blips: BlipMonitored[] = [];
    public get blips(): Blip[] {
        return this._blips;
    }

    // TODO: Why is createMultiple() not calling create()?
    public createMultiple(...blips: Blip[]): void {
        const _blips: BlipMonitored[] = blips.map((blip: Blip) => <BlipMonitored>({ ...blip, instance: null }));

        this._blips.push(..._blips);
        this.refresh();
    }

    public create(blip: Blip): number {
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

    public clear(blipId: number): void {
        this._blips = this._blips.filter((_blip) => _blip.instance !== blipId);

        if (Cfx.Client.DoesBlipExist(blipId)) {
            Cfx.Client.RemoveBlip(blipId);
        }
    }

    public clearAll(): void {
        this._blips.forEach((blip: BlipMonitored) => {
            Cfx.Client.RemoveBlip(blip.instance!);
        });

        this._blips = [];
    }

    private refresh(): void {
        this.blips.forEach((blip: BlipMonitored) => {
            if (!blip.instance) {
                blip.instance = this.create(blip);
            }
        });
    }

    // @EventListener({ eventName: `${Cfx.Client.GetCurrentResourceName()}:refresh-virtual-world` })
    // protected onRefreshPlayersInVirtualWorld(): void {
    //     const activePlayers: number[] = Cfx.Client.GetActivePlayers();
    //
    //     activePlayers.forEach((activePlayer: number) => {
    //         const playerServerId: number = Cfx.Client.GetPlayerServerId(activePlayer);
    //         if (this.getPlayerInfo('virtualWorld') === this.getPlayerInfo('virtualWorld', playerServerId)) {
    //             Cfx.Client.NetworkConcealPlayer(activePlayer, false, false);
    //         } else {
    //             Cfx.Client.NetworkConcealPlayer(activePlayer, true, false);
    //         }
    //     });
    // }
}
