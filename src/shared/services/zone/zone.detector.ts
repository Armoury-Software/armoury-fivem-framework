import { BoxZone, PolygonZone, SphereZone, Zone } from '../../models/zone';

export class ZoneDetector {
  public static contains(zone: Zone, x: number, y: number, z: number): boolean {
    switch (zone.type) {
      case 'sphere':
        return this.containsSphere(zone, x, y, z);

      case 'box':
        return this.containsBox(zone, x, y, z);

      case 'polygon':
        return this.containsPolygon(zone, x, y, z);
    }
  }

  private static containsSphere(zone: SphereZone, x: number, y: number, z: number): boolean {
    const dx = x - zone.center[0];
    const dy = y - zone.center[1];
    const dz = z - zone.center[2];

    return dx * dx + dy * dy + dz * dz <= zone.radius * zone.radius;
  }

  private static containsBox(zone: BoxZone, x: number, y: number, z: number): boolean {
    const dx = x - zone.center[0];
    const dy = y - zone.center[1];

    const angle = (zone.heading * Math.PI) / 180;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;

    return (
      Math.abs(localX) <= zone.size[0] / 2 &&
      Math.abs(localY) <= zone.size[1] / 2 &&
      Math.abs(z - zone.center[2]) <= zone.size[2] / 2
    );
  }

  private static containsPolygon(zone: PolygonZone, x: number, y: number, z: number): boolean {
    if (z < zone.minZ || z > zone.maxZ) return false;

    let inside = false;
    const points = zone.points;

    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const a = points[i];
      const b = points[j];

      const intersects = a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x;

      if (intersects) inside = !inside;
    }

    return inside;
  }
}
