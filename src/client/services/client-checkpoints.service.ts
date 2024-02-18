import { Injectable } from "injection-js";

@Injectable()
export class ClientCheckpointsService {
    private _checkpoints: Map<number, number[]> = new Map();
    public get checkpoints(): Map<number, number[]> {
        return this._checkpoints;
    }

    public create(
        type: number,
        posX1: number,
        posY1: number,
        posZ1: number,
        posX2: number | null,
        posY2: number | null,
        posZ2: number | null,
        diameter: number,
        red: number,
        green: number,
        blue: number,
        alpha: number,
        reserved: number
    ): number {
        const checkpoint = Cfx.Client.CreateCheckpoint(type, posX1, posY1, posZ1, posX2!, posY2!, posZ2!, diameter, red, green, blue, alpha, reserved);
        this._checkpoints.set(checkpoint, [posX1, posY1, posZ1, posX2!, posY2!, posZ2!]);

        return checkpoint;
    }

    public clear(checkpoint: number): void {
        Cfx.Client.DeleteCheckpoint(checkpoint);
        if (this._checkpoints.has(checkpoint)) {
            this._checkpoints.delete(checkpoint);
        }
    }

    public clearByPosition(pos: number[]): void {
        const checkpoint: number | undefined = Array.from(this._checkpoints.keys()).find(
            (_checkpoint: number) =>
                Math.floor(this._checkpoints.get(_checkpoint)![0]) === Math.floor(pos[0])
                && Math.floor(this._checkpoints.get(_checkpoint)![1]) === Math.floor(pos[1])
                && Math.floor(this._checkpoints.get(_checkpoint)![2]) === Math.floor(pos[2])
        );

        if (checkpoint) {
            this.clear(checkpoint);
        }
    }
}