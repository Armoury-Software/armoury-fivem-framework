import { Cfx } from "..";
import { isJSON } from "../utils/utils";

export class ClientBase {
    private tickInstance: number | null = null;
    private tickFunctions: { id: string, function: Function }[] = [];

    protected routingBucket: number = 0;

    public constructor() {
        this.assignBaseListeners();
    }

    /** ATTENTION! The ID of a tick function needs to be UNIQUE! */
    protected addToTick(...functions: { id: string, function: Function }[]): void {
        functions.forEach(
            (func: { id: string, function: Function }) => {
                if (this.tickFunctions.findIndex((_func: { id: string, function: Function }) => _func.id === func.id) !== -1) {
                    console.error(`[ClientBase]: A tick function with the id ${func.id} already exists in the stack! The newly added tick function will not be executed.`);
                }
            }
        );

        this.tickFunctions.push(...functions);
        this.removeTickDuplicates();
        this.refreshTicks();
    }

    protected addToTickUnique(...functions: { id: string, function: Function }[]): void {
        functions.forEach((func: { id: string, function: Function }) => {
            this.removeFromTick(func.id);
        })

        this.addToTick(...functions);
    }

    /** Removes tick function with the provided id. */
    protected removeFromTick(id: string): void {
        this.tickFunctions = this.tickFunctions.filter((func: { id: string, function: Function }) => func.id != id);
    }

    private refreshTicks(): void {
        if (this.tickInstance) {
            Cfx.Client.clearTick(this.tickInstance);
            this.tickInstance = null;
        }

        if (this.tickFunctions.length > 0) {
            this.tickInstance = Cfx.Client.setTick(() => {
                if (!this.tickFunctions.length) {
                    Cfx.Client.clearTick(this.tickInstance!);
                    this.tickInstance = null;
                    return;
                }

                this.tickFunctions.forEach((tick: { id: string, function: Function }) => {
                    tick.function();
                });
            });
        }
    }

    private removeTickDuplicates(): void {
        this.tickFunctions = this.tickFunctions.filter(
            (func: { id: string, function: Function }) =>
                this.tickFunctions.findIndex((_func: { id: string, function: Function }) => _func.id == func.id) == this.tickFunctions.indexOf(func)
        );
    }

    private assignBaseListeners(): void {
        Cfx.Client.onNet(`${Cfx.Client.GetCurrentResourceName()}:set-routing-bucket`, (routingBucket: number) => {
            this.routingBucket = routingBucket;
        });
    }

    protected setEntityRoutingBucket(routingBucket: number): void {
        Cfx.Client.TriggerServerEvent(`${Cfx.Client.GetCurrentResourceName()}:set-client-routing-bucket`, routingBucket);
        this.routingBucket = routingBucket;
    }

    protected getPlayerInfo(stat: string, playerId?: number): string | number | number[] | string[] | Object {
        let value: string | number | number[] | string[] = Cfx.Client.GetConvar(`${playerId || Cfx.Client.GetPlayerServerId(Cfx.Client.PlayerId())}_PI_${stat}`, '-1');

        if (isJSON(value.toString())) {
            value = JSON.parse(value.toString(), function(_k, v) { return (typeof v === "object" || isNaN(v)) ? v : Number(v); });
        }

        return value;
    }
}