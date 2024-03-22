import { Inject, Injectable } from 'injection-js';
import { ClientTicksService } from './client-ticks.service';
import { ActionPoint } from '../models';
import { Command, EventListener } from '../../decorators';
import { calculateDistance } from '../../utils/utils';

// TODO: Lower chunk radius and make chunk-checker check adjacent chunks as well
@Injectable()
export class ClientActionPointsService {
    private chunkRadius: number = 80;
    
    private _actionPoints: { [posX: number]: { [posY: number]: ActionPoint[] } } = {};
    public get actionPoints() {
        return this._actionPoints;
    }
    
    private _cachedPlayerPosition: [number, number] = [NaN, NaN];
    public get cachedPlayerPosition(): [number, number] {
        return this._cachedPlayerPosition;
    }
    private _cachedPlayerRoundedPosition: [number, number] = [NaN, NaN];
    private _cachedIsPlayerInAnyVehicle: boolean = false;

    public constructor(
        @Inject(ClientTicksService) private _ticksService: ClientTicksService
    ) { }
    
    /** Creates one or multiple Action Points. Action points DO NOT include markers and/or blips.
     * They only contain the logic executed when a position is met.
    */
    public create(...actionPoints: ActionPoint[]): void {
        actionPoints.forEach((actionPoint) => {
            this.createActionPoint(actionPoint);
        });
    }
    
    protected createActionPoint(actionPoint: ActionPoint): void {
        const nearestX = this.roundToNearest(actionPoint.pos[0], this.chunkRadius);
        const nearestY = this.roundToNearest(actionPoint.pos[1], this.chunkRadius);
    
        if (!this._actionPoints[nearestX]) {
            this._actionPoints[nearestX] = {};
        }
        
        if (!this.actionPoints[nearestX][nearestY]) {
            this._actionPoints[nearestX][nearestY] = [];
        }
    
        this._actionPoints[nearestX][nearestY].push(actionPoint);
    }

    public remove(actionPoint: ActionPoint): void {
        if (this._actionPoints[this.roundToNearest(actionPoint.pos[0], this.chunkRadius)]?.[this.roundToNearest(actionPoint.pos[1], this.chunkRadius)]?.length) {
            this._actionPoints[this.roundToNearest(actionPoint.pos[0], this.chunkRadius)][this.roundToNearest(actionPoint.pos[1], this.chunkRadius)] =
            this._actionPoints[this.roundToNearest(actionPoint.pos[0], this.chunkRadius)][this.roundToNearest(actionPoint.pos[1], this.chunkRadius)].filter(
                (_actionPoint) => _actionPoint.id != actionPoint.id
            );
        }
    }
    
    public removeById(id: string): void {
        Object.keys(this._actionPoints).forEach((posXAsStr: string) => {
            const posX: number = Number(posXAsStr);
            Object.keys(this._actionPoints[posX]).forEach((posYAsStr: string) => {
                const posY: number = Number(posYAsStr);
                this._actionPoints[posX][posY] =
                    this._actionPoints[posX][posY].filter((_actionPoint) => _actionPoint.id != id)
            })
        });
    }

    public removeAll(): void {
        this._actionPoints = {};
        this._ticksService.remove(`${Cfx.Client.GetCurrentResourceName()}_actionpoints`);
    }
    
    public existsAtPosition(posX: number, posY: number, posZ: number): boolean {
        const roundedPosX = this.roundToNearest(posX, this.chunkRadius);
        const roundedPosY = this.roundToNearest(posY, this.chunkRadius);
    
        if (!this.actionPoints[roundedPosX] || !this.actionPoints[roundedPosX][roundedPosY]) {
            return false;
        }
    
        if (this.actionPoints[roundedPosX][roundedPosY].find(
            (actionPoint: ActionPoint) =>
                actionPoint.pos[0] == posX
                && actionPoint.pos[1] == posY
                && actionPoint.pos[2] == posZ
            )
        ) {
            return true;
        }
    
        return false;
    }

    @EventListener({ eventName: 'armoury:thread-triggerer' })
    protected onThreadTriggered(optimizationType: string): void {
        if (optimizationType === 'chunk-checker') {
            this._cachedPlayerPosition = <[number, number]>Cfx.Client.GetEntityCoords(Cfx.Client.PlayerPedId(), true);
            const [nearestX, nearestY] = [this.roundToNearest(this._cachedPlayerPosition[0], this.chunkRadius), this.roundToNearest(this._cachedPlayerPosition[1], this.chunkRadius)];
        
            if (this._cachedPlayerRoundedPosition[0] == nearestX && this._cachedPlayerRoundedPosition[1] == nearestY) {
                return;
            }
        
            this._cachedPlayerRoundedPosition = [nearestX, nearestY];
            this._cachedIsPlayerInAnyVehicle = Cfx.Client.IsPedInAnyVehicle(Cfx.Client.PlayerPedId(), false);
        
            if (
                this._actionPoints
                    [this._cachedPlayerRoundedPosition[0]]
                    ?.[this._cachedPlayerRoundedPosition[1]]?.length
            ) {
                this._ticksService.addUnique({
                    id: `${Cfx.Client.GetCurrentResourceName()}_actionpoints`,
                    function: (() => {
                        for (let i = 0; i < this._actionPoints[this._cachedPlayerRoundedPosition[0]]?.[this._cachedPlayerRoundedPosition[1]]?.length; i++) {
                            const _actionPoint = this._actionPoints[this._cachedPlayerRoundedPosition[0]]?.[this._cachedPlayerRoundedPosition[1]][i];
                        
                            if (calculateDistance([_actionPoint.pos[0], _actionPoint.pos[1], _actionPoint.pos[2], this._cachedPlayerPosition[0], this._cachedPlayerPosition[1], _actionPoint.pos[2]]) <= (_actionPoint.range || 1.0) + (this._cachedIsPlayerInAnyVehicle && !_actionPoint.onfootOnly ? 5 : 0)) {
                                const actionPassed: boolean = (!_actionPoint.onceIf || _actionPoint.onceIf()) && (!_actionPoint.onfootOnly || !Cfx.Client.IsPedInAnyVehicle(Cfx.Client.PlayerPedId(), false)) && (!_actionPoint.inVehicleOnly || Cfx.Client.IsPedInAnyVehicle(Cfx.Client.PlayerPedId(), false));
                                if (actionPassed) {
                                    _actionPoint.action();
                                }
                            
                                if ((_actionPoint.once || _actionPoint.onceIf) && actionPassed) {
                                    this._actionPoints[this._cachedPlayerRoundedPosition[0]]?.[this._cachedPlayerRoundedPosition[1]].splice(i, 1);
                                    i--;
                                }
                            }
                        }
                    })
                });
            } else {
                this._ticksService.remove(`${Cfx.Client.GetCurrentResourceName()}_actionpoints`);
            }
        }
    }
    
    @Command({ suffix: `_${Cfx.Client.GetCurrentResourceName()}` })
    public debug_ActionPoints(): void {
        let totalActionPoints = 0;
        const currentAreaActionPoints = this.actionPoints[this.roundToNearest(this._cachedPlayerPosition[0], this.chunkRadius)]?.[this.roundToNearest(this._cachedPlayerPosition[1], this.chunkRadius)]?.length || 0;
    
        Object.keys(this.actionPoints).forEach((posXAsStr: string) => {
            const posX: number = Number(posXAsStr);
            Object.keys(this.actionPoints[posX]).forEach((posYAsStr: string) => {
                const posY = Number(posYAsStr);
                totalActionPoints += this.actionPoints[posX][posY].length;
            });
        });
    
        console.log(`Total action points: ${totalActionPoints}. Action points in this area: ${currentAreaActionPoints}`);
    }
    
    private roundToNearest(num: number, multiple: number): number {
        return Math.round(num / multiple) * multiple;
    }
}
