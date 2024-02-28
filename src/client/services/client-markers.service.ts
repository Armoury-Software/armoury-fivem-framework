import { Inject, Injectable } from "injection-js";
import { Marker, MarkerMonitored } from "../../models";
import { ClientActionPointsService } from "./client-action-points.service";
import { Delay } from "../../utils/utils";

@Injectable()
export class ClientMarkersService {
    private _markers: MarkerMonitored[] = [];
    public get markers(): Marker[] {
        return this._markers;
    }

    public constructor(
        @Inject(ClientActionPointsService) private _actionPoints: ClientActionPointsService
    ) { }

    /** Defines permanent markers. Handles draw-per-tick automatically. */
    public create(...markers: Marker[]): void {
        const _markers: MarkerMonitored[] = markers.map((marker: Marker) => <Marker>({ ...marker, instance: null }));
        this._markers.push(..._markers);

        this._actionPoints.create(
            ...markers.map((marker) => ({
                id: `${Cfx.Client.GetCurrentResourceName()}_marker_${marker.pos[0]}_${marker.pos[1]}`,
                pos: marker.pos,
                range: marker.renderDistance,
                action: async () => {
                    if (marker.textureDict && !Cfx.Client.HasStreamedTextureDictLoaded(marker.textureDict)) {
                        Cfx.Client.RequestStreamedTextureDict(marker.textureDict, true);
                        
                        while (!Cfx.Client.HasStreamedTextureDictLoaded(marker.textureDict)) {
                            await Delay(100);
                        }
                    }

                    Cfx.Client.DrawMarker(
                        marker.marker, 
                        marker.pos[0], marker.pos[1], marker.pos[2], 
                        0.0, 0.0, 0.0,
                        marker.rotation?.[0] || 0.0, marker.rotation?.[1] || 0.0, marker.rotation?.[2] || 0.0,
                        marker.scale, marker.scale, marker.scale,
                        marker.rgba[0], marker.rgba[1], marker.rgba[2], marker.rgba[3],
                        false, true, 2, false,
                        (marker.textureDict || null)!,
                        (marker.textureName || null)!,
                        false
                    );
                    
                    if (marker.underlyingCircle) {
                        Cfx.Client.DrawMarker(
                            marker.underlyingCircle.marker,
                            marker.pos[0], marker.pos[1], marker.pos[2] - 0.9,
                            0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
                            marker.underlyingCircle.scale, marker.underlyingCircle.scale, marker.underlyingCircle.scale,
                            marker.underlyingCircle.rgba?.[0] || marker.rgba[0],
                            marker.underlyingCircle.rgba?.[1] || marker.rgba[1],
                            marker.underlyingCircle.rgba?.[2] || marker.rgba[2],
                            marker.underlyingCircle.rgba?.[3] || marker.rgba[3],
                            false, true, 2, false, null!, null!, false
                        );
                    }
                }
            }))
        );
    }

    public clearAll(): void {
        this.markers.forEach((_marker) => {
            this._actionPoints.removeById(`${Cfx.Client.GetCurrentResourceName()}_marker_${_marker.pos[0]}_${_marker.pos[1]}`);
        });

        this._markers = [];
    }
}
