import { Injectable } from "injection-js";
import { isJSON } from "../../utils";

@Injectable()
export class ClientSessionService {
    public getPlayerInfo(stat: string, playerId?: number): string | number | number[] | string[] | Object {
        let value: string | number | number[] | string[] = Cfx.Client.GetConvar(`${playerId || Cfx.Client.GetPlayerServerId(Cfx.Client.PlayerId())}_PI_${stat}`, '-1');

        if (isJSON(value.toString())) {
            value = JSON.parse(value.toString(), function(_k, v) { return (typeof v === "object" || isNaN(v)) ? v : Number(v); });
        }

        return value;
    }
}
