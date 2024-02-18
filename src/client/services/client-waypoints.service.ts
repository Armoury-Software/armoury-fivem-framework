import { Inject, Injectable } from "injection-js";
import { ClientBlipsService } from "./client-blips.service";
import { COLOR_MAPPINGS } from "../constants/color.mappings";
import { ClientCheckpointsService } from "./client-checkpoints.service";

@Injectable()
export class ClientWaypointsService {
    private _waypoints: number[] = [];
    public get waypoints(): number[] {
        return this._waypoints;
    }

    public constructor(
        @Inject(ClientBlipsService) private _blipsService: ClientBlipsService,
        @Inject(ClientCheckpointsService) private _checkpointsService: ClientCheckpointsService
    ) { }

    /** Defines a custom, irreplaceable waypoint */
    protected createWaypoint(pos: number[], title?: string, color?: number, id?: number, routeColor?: number, diameter: number = 3.0): number {
        const currentResource: string = Cfx.Client.GetCurrentResourceName().replace('-', ' ');
        const defaultTitle: string = `${currentResource.slice(0, 1).toUpperCase()}${currentResource.slice(1)}`;

        const _waypoint: number = this._blipsService.create({
            id: id || 1,
            color: color || 69,
            title: title || defaultTitle,
            pos,
            longRange: true
        });
        this._checkpointsService.create(2, pos[0], pos[1], pos[2], null, null, null, diameter, COLOR_MAPPINGS[color ?? 0][0], COLOR_MAPPINGS[color ?? 0][1], COLOR_MAPPINGS[color ?? 0][2], 255, 0);

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
        this._checkpointsService.clearByPosition(Cfx.Client.GetBlipCoords(waypoint));

        Cfx.Client.SetBlipRoute(waypoint, false);
        Cfx.Client.RemoveBlip(waypoint);

        if (!ignoreSplice) {
            this._waypoints.splice(this._waypoints.indexOf(waypoint), 1);
        }
    }
}