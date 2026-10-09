export class LocationUtils {
    public static distance(fromX: number, fromY: number, fromZ: number, toX: number, toY: number, toZ: number) {    
        return Math.hypot(toX - fromX, toY - fromY, toZ - fromZ);
    }
}
