import { DecoratorUtils } from "./decorator.utils";

export function EventListener(data?: { eventName?: string, direction?: EVENT_DIRECTIONS, type?: 'ui' | 'default' }) {
    return function (target: any, propertyKey: string) {
        const eventName: string = (DEFAULT_EVENTS[propertyKey] || data?.eventName)!;
        const direction: EVENT_DIRECTIONS = data?.direction || EVENT_DIRECTIONS.CLIENT_TO_SERVER;
        const type: 'ui' | 'default' = data?.type || 'default';

        Reflect.defineMetadata(`eventListener_${propertyKey}`, { eventName, direction, type }, target);
    };
}

export function EventListeners(target: any, _prototype: any, providerMappings?: { value: any, provider: any }[]) {
    DecoratorUtils.map(target, _prototype, providerMappings)
        .filter((mapping) => mapping.key.startsWith('eventListener_'))
        .forEach((mapping) => {
            const { eventName, direction, type }: { eventName: string, direction: EVENT_DIRECTIONS, type: 'ui' | 'default' }
                = mapping.value;
            const func = mapping.key.split('_').slice(1).join('_');

            if (type === 'ui') {
                Cfx.Client.RegisterNuiCallbackType(eventName);
                Cfx.Client.on('__cfx_nui:' + eventName, (data, cb) => {
                    mapping.target[func].call(mapping.target, data);
                    cb('ok');
                });
            } else {
                switch (direction) {
                    case EVENT_DIRECTIONS.CLIENT_TO_CLIENT: {
                        Cfx.Client.on(eventName, mapping.target[func].bind(mapping.target));
                        break;
                    }
                    default: {
                        Cfx.Server.onNet(eventName, mapping.target[func].bind(mapping.target));
                        break;
                    }
                }
            }
        });
}

export enum EVENT_DIRECTIONS {
    SERVER_TO_SERVER = 0,
    SERVER_TO_CLIENT,
    CLIENT_TO_SERVER,
    CLIENT_TO_CLIENT
}

// TODO: Refactor this, so resources can add to it
export const DEFAULT_EVENTS: { [key: string]: string } = {
    onAccountAuthenticate: 'authentication:account-success',
    onPlayerConnect: 'playerJoining',
    onPlayerDeath: 'armoury:onPlayerDeath',
    onPlayerAuthenticate: 'authentication:player-authenticated',
    onPlayerDisconnect: 'playerDropped',
    onResourceStop: 'onResourceStop',
    onContextMenuItemPressed: 'armoury-overlay:context-menu-item-pressed',
    onPlayerEnterVehicle: 'armoury:onPlayerEnterVehicle',
    onPlayerExitVehicle: 'armoury:onPlayerExitVehicle',
    onPlayerClientsidedCacheLoaded: 'armoury:player-resource-cache-loaded',
    onPlayerStartTowVehicle: 'armoury:onPlayerStartTowVehicle',
    onPlayerStopTowVehicle: 'armoury:onPlayerStopTowVehicle',
}
