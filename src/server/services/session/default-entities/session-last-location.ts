import { SessionItem, ISessionItem } from "../../../models";

export class SessionLastLocation extends SessionItem<Array<number>> implements ISessionItem<Array<number>> {
    public constructor() {
        super('lastLocation', [], true);
    }

    public override compute(playerId: number, originalValue: Array<number>): Array<number> {
        return [
            ...Cfx.Server.GetEntityCoords(Cfx.Server.GetPlayerPed(playerId.toString())).slice(0, 4),
            originalValue[4] || 0
        ];
    }

    public override async load(_accountId: number, _characterId: number, bruteValue: any): Promise<Array<number>> {
        return <number[]> JSON.parse(bruteValue);
    }
}
