export interface BaseZone {
  id: number;
}

export interface SphereZone extends BaseZone {
  type: 'sphere';
  center: [number, number, number];
  radius: number;
}

export interface BoxZone extends BaseZone {
  type: 'box';
  center: [number, number, number];
  size: [number, number, number];
  heading: number;
}

export interface PolygonZone extends BaseZone {
  type: 'polygon';
  points: { x: number; y: number }[];
  minZ: number;
  maxZ: number;
}

export type Zone = SphereZone | BoxZone | PolygonZone;

export interface ZoneSnapshot<T> {
  cellX: number;
  cellY: number;
  zones: T[];
  // Nine cells in x-major order; entries index into zones to avoid duplicating geometry.
  cells: number[][];
}
