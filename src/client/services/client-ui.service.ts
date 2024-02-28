import { Inject, Injectable } from "injection-js";
import { ClientTicksService } from "./client-ticks.service";
import { Observable, Subject } from "rxjs";
import { EventListener, UIListener } from "../../decorators";

@Injectable()
export class ClientUIService {
    private _onShow$: Subject<any> = new Subject();
    public get onShow$(): Observable<any> {
        return this._onShow$.asObservable();
    }

    private _onHide$: Subject<any> = new Subject();
    public get onHide$(): Observable<any> {
        return this._onHide$.asObservable();
    }

    private _visible: boolean = false;
    public get visible(): boolean {
        return this._visible;
    }

    private cooldownTimestamp: number = 0;

    public constructor(
        @Inject(ClientTicksService) private _ticksService: ClientTicksService,
    ) { }

    public show(ignoreCursorMode: boolean = false, ignoreFocus: boolean = false): void {
        if (!this._visible) {
            if (!ignoreCursorMode) {
                Cfx.Client.EnterCursorMode();
            }

            if (!ignoreFocus) {
                Cfx.Client.SetNuiFocus(true, true);
                Cfx.Client.SetNuiFocusKeepInput(false);
            }
        }
        
        this._visible = true;
    
        this._ticksService.addUnique({
            id: `${Cfx.Client.GetCurrentResourceName()}_UI`,
            function: () => {
                Cfx.Client.DisableControlAction(0, 1, this._visible);
                Cfx.Client.DisableControlAction(0, 2, this._visible);
                Cfx.Client.DisableControlAction(0, 142, this._visible);
                Cfx.Client.DisableControlAction(0, 18, this._visible);
                Cfx.Client.DisableControlAction(0, 322, this._visible);
                Cfx.Client.DisableControlAction(0, 106, this._visible);
                
                if (!this._visible) {
                    this._ticksService.remove(`${Cfx.Client.GetCurrentResourceName()}_UI`);
                    Cfx.Client.SetNuiFocus(false, false);
                }
            }
        });
    }

    public hide() {
        this.cooldownTimestamp = Date.now() + (1000 * 3);
        Cfx.Client.LeaveCursorMode();
        this._visible = false;
    
        Cfx.Client.SendNuiMessage(JSON.stringify({
            type: 'dismiss'
        }));
    }

    @EventListener({ eventName: `${Cfx.Client.GetCurrentResourceName()}:force-showui` })
    protected onForceShowUI(data: any): void {
        this.show(false, false);
        this._onShow$.next(data);
    }

    @EventListener({ eventName: `${Cfx.Client.GetCurrentResourceName()}:force-hideui` })
    protected onForceHideUI(data: any): void {
        this.hide();
        this._onHide$.next(data);
    }

    @UIListener({ eventName: 'dismiss' })
    public dismiss(): void {
        this.hide();
        Cfx.TriggerServerEvent(`${Cfx.Client.GetCurrentResourceName()}:on-force-hidden`);
        Cfx.emit(`${Cfx.Client.GetCurrentResourceName()}:on-force-hidden`);
    }

    public isOnCooldown() {
        return Date.now() < this.cooldownTimestamp;
    }
}