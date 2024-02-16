import EventEmitter from 'events';
import { ClientController } from './client.controller';
import { IClientWithUIController } from './interfaces/client-ui.interface'; 
import { Cfx } from '..';

export class ClientWithUIController extends ClientController implements IClientWithUIController {
    private uiDisplay: boolean = false;
    private uiDisplayCooldownTimestamp: number = 0;

    public constructor() {
        super();

        this.addDefaultListeners();
    }

    protected onIncomingUIMessageEvent: EventEmitter = new EventEmitter();

    protected isUIShowing(): boolean {
        return this.uiDisplay;
    }

    protected isUIOnCooldown(): boolean {
        return Date.now() < this.uiDisplayCooldownTimestamp;
    }

    protected showUI(ignoreCursorMode: boolean = false, ignoreFocus: boolean = false): void {
        if (!this.isUIShowing()) {
            if (!ignoreCursorMode) {
                Cfx.Client.EnterCursorMode();
            }

            if (!ignoreFocus) {
                Cfx.Client.SetNuiFocus(true, true);
                Cfx.Client.SetNuiFocusKeepInput(false);
            }
        }
        this.uiDisplay = true;
    
        this.addToTickUnique({
            id: `${Cfx.Client.GetCurrentResourceName()}_UI`,
            function: () => {
                Cfx.Client.DisableControlAction(0, 1, this.uiDisplay);
                Cfx.Client.DisableControlAction(0, 2, this.uiDisplay);
                Cfx.Client.DisableControlAction(0, 142, this.uiDisplay);
                Cfx.Client.DisableControlAction(0, 18, this.uiDisplay);
                Cfx.Client.DisableControlAction(0, 322, this.uiDisplay);
                Cfx.Client.DisableControlAction(0, 106, this.uiDisplay);
                
                if (!this.uiDisplay) {
                    this.removeFromTick(`${Cfx.Client.GetCurrentResourceName()}_UI`);
                    Cfx.Client.SetNuiFocus(false, false);
                }
            }
        });
    }
    
    protected hideUI(): void {
        this.uiDisplayCooldownTimestamp = Date.now() + (1000 * 3);
        Cfx.Client.LeaveCursorMode();
        this.uiDisplay = false;
    
        Cfx.Client.SendNuiMessage(JSON.stringify({
            type: 'dismiss'
        }));
    }

    protected addUIListener(name: string): void {
        Cfx.Client.RegisterNuiCallbackType(name);

        Cfx.Client.on(`__cfx_nui:${name}`, (data: any, callback: Function) => {
            this.onIncomingUIMessageEvent.emit(name, data);
            callback('ok');
        });

        this.onIncomingUIMessageEvent.on(name, (eventData) => { this.onIncomingUIMessage.call(this, name, eventData); });
    }

    /** Remember that you NEED to use addUIListener in order to be able to listen for events */
    protected onIncomingUIMessage(eventName: string, eventData: any): void { }

    public onForceShowUI(data: any, ignoreCursorMode: boolean = false, ignoreFocus: boolean = false): void {
        this.showUI(ignoreCursorMode, ignoreFocus);
    }

    public onForceHideUI(): void {
        this.hideUI();
    }

    private addDefaultListeners(): void {
        Cfx.Client.RegisterNuiCallbackType('dismiss');

        Cfx.Client.on(`__cfx_nui:dismiss`, (data: any, callback: Function) => {
            this.onForceHideUI();
            Cfx.Client.TriggerServerEvent(`${Cfx.Client.GetCurrentResourceName()}:on-force-hidden`);
            Cfx.Client.emit(`${Cfx.Client.GetCurrentResourceName()}:on-force-hidden`);
            callback('ok');
        });

        Cfx.Client.onNet(`${Cfx.Client.GetCurrentResourceName()}:force-showui`, (data: any) => {
            this.onForceShowUI(data);
        });

        Cfx.Client.onNet(`${Cfx.Client.GetCurrentResourceName()}:force-hideui`, () => {
            this.onForceHideUI();
        });
    }
}