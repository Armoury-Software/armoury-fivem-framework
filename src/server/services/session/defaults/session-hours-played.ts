import { SessionItem, ISessionItem } from "../../../models";

export class SessionHoursPlayed extends SessionItem<number> implements ISessionItem<number> {
    public constructor() {
        super('hoursPlayed', 0, true);
    }

    public override compute(playerId: number, originalValue: number): number {
        const lastUpdate: number = Cfx.Server.GetConvarInt(`${playerId}_PI_hoursPlayed_lastUpdate`, new Date().getTime());

        return Number(originalValue) + Math.floor(
            (Math.abs(lastUpdate - new Date().getTime()) /
                (1000 * 60)) %
            60
        ) * 0.017;
    }
}
