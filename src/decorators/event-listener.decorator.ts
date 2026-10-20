import { DecoratorUtils } from "./decorator.utils";

export function EventListener(data?: { eventName?: string, direction?: EVENT_DIRECTIONS, type?: 'ui' | 'default' }) {
    return function (target: any, propertyKey: string) {
        const eventName: string = (DEFAULT_EVENTS[propertyKey] || data?.eventName)!;
        const direction: EVENT_DIRECTIONS = data?.direction || EVENT_DIRECTIONS.CLIENT_TO_SERVER;
        const type: 'ui' | 'default' = data?.type || 'default';

        Reflect.defineMetadata(`arm_eventListener_${propertyKey}`, { eventName, direction, type }, target);
    };
}

export function EventListeners(target: any, _prototype: any, providers?: Object[]) {
    DecoratorUtils.map(target, _prototype, providers ?? [])
        .filter((mapping) => mapping.key.startsWith('arm_eventListener_'))
        .forEach((mapping) => {
            const { eventName, direction, type }: { eventName: string, direction: EVENT_DIRECTIONS, type: 'ui' | 'default' }
                = mapping.value;
            const func = mapping.key.split('_').slice(2).join('_');

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

    /** Blips */
    onBlipCreate: 'armoury:safe:blip:created',
    onBlipCreateUnsafe: 'armoury:unsafe:blip:created',

    /** Session */
    onPlayerSessionCreated: 'armoury:session-created',
    onPlayerSessionUpdated: 'armoury:session-updated',
    onPlayerSessionDestroyed: 'armoury:session-destroyed',

    /** Accounts */
    onAccountCreated: 'armoury:account-created',
    onAccountAuthenticated: 'armoury:account-authenticated',

    /** Connection */
    onPlayerConnect: 'playerJoining',
    onPlayerDisconnect: 'playerDropped',

    /** Vehicle */
    onPlayerEnterVehicle: 'armoury:onPlayerEnterVehicle',
    onPlayerExitVehicle: 'armoury:onPlayerExitVehicle',
    onPlayerStartTowVehicle: 'armoury:onPlayerStartTowVehicle',
    onPlayerStopTowVehicle: 'armoury:onPlayerStopTowVehicle',

    /** Zone */
    onPlayerEnterZone: 'armoury:safe:zone:enter',
    onPlayerEnterZoneUnsafe: 'armoury:unsafe:zone:enter',
    onPlayerExitZone: 'armoury:safe:zone:exit',
    onPlayerExitZoneUnsafe: 'armoury:unsafe:zone:exit',

    /** Pickup */
    onPickupCollect: 'armoury:safe:pickup:collect',
    onPickupCollectUnsafe: 'armoury:unsafe:pickup:collect',
    onPickupLeave: 'armoury:safe:pickup:leave',
    onPickupLeaveUnsafe: 'armoury:unsafe:pickup:leave',

    /** Native */
    onResourceStop: 'onResourceStop',
    onServerResourceStart: 'onServerResourceStart',
    onServerResourceStop: 'onServerResourceStop',

    /** Other */
    onAccountAuthenticate: 'authentication:account-success',
    onPlayerDeath: 'armoury:onPlayerDeath',
    onPlayerAuthenticate: 'authentication:player-authenticated',
    onPlayerLogout: 'armoury:player-logout',
    onContextMenuItemPressed: 'armoury-overlay:context-menu-item-pressed',
    onPlayerClientsidedCacheLoaded: 'armoury:player-resource-cache-loaded',

}
