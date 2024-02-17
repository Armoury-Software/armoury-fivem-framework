export class ServerBase {
    public constructor() {
        this.assignServerBaseListeners();
    }

    // TODO: Remove this. We have created a brand new cool decorator for this
    protected RegisterAdminCommand(commandName: string, adminLevelRequired: number, handlerFunction: Function, restricted: boolean) {
        Cfx.Server.RegisterCommand(
            commandName,
            (source: number, args: any[], _raw: boolean) => {
                if (Number(Cfx.exports['authentication'].getPlayerInfo(source, 'adminLevel')) < adminLevelRequired) {
                    // TODO: Add error chat message OR some kind of visual notice here
                    return;
                }

                handlerFunction(source, args, _raw);
            },
            restricted
        );
    }

    private assignServerBaseListeners(): void {
        Cfx.Server.onNet(`${Cfx.Server.GetCurrentResourceName()}:set-client-routing-bucket`, (source: number, routingBucket: number) => {
            if (this.routingBucketCondition(source, routingBucket)) {
                Cfx.Server.SetEntityRoutingBucket(source, routingBucket);
            }
        });
    }

    protected setRoutingBucket(playerId: number, routingBucket: number): void {
        Cfx.Server.SetEntityRoutingBucket(Cfx.Server.GetPlayerPed(playerId.toString()), routingBucket);
        Cfx.Server.TriggerClientEvent(`${Cfx.Server.GetCurrentResourceName()}:set-routing-bucket`, playerId, routingBucket);
    }

    protected routingBucketCondition: (source: number, routingBucket: number) => boolean = (source: number, routingBucket: number) => true;
}