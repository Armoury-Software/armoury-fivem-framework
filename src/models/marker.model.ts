import { Blip } from "./blip.model";

export interface Marker {
    marker: number;
    pos: number[];
    scale: number;
    rgba: number[];
    renderDistance: number;
    underlyingCircle?: MarkerCircle;
    blip?: Blip;
    rotation?: number[];
    textureDict?: string;
    textureName?: string;
    fadeInDisabled?: boolean;
}

export interface MarkerMonitored extends Marker {
    instance?: number | null;
}

export interface MarkerCircle {
    marker: number;
    scale: number;
    rgba?: number[];
}
