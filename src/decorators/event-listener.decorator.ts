export function EventListener(data?: { eventName?: string, direction?: EVENT_DIRECTIONS }) {
    return function(target: any, propertyKey: string) {
        const eventName: string = (DEFAULT_EVENTS[propertyKey] || data?.eventName)!;
        const direction: EVENT_DIRECTIONS = data?.direction || EVENT_DIRECTIONS.CLIENT_TO_SERVER;

        Reflect.defineMetadata(`eventListener_${propertyKey}`, { eventName, direction }, target);
    };
}

export function EventListeners(target: any, _prototype: any) {
    Reflect.getOwnMetadataKeys(_prototype)
    .filter((key) => key.startsWith('eventListener_'))
    .forEach((key: string) => {
        const { eventName, direction }: { eventName: string, direction: EVENT_DIRECTIONS } = Reflect.getOwnMetadata(key, _prototype);
        const func = key.split('_').slice(1).join('_');

        switch (direction) {
            case EVENT_DIRECTIONS.CLIENT_TO_CLIENT: {
                Cfx.Client.on(eventName, target[func].bind(target));
                break;
            }
            default: {
                Cfx.Server.onNet(eventName, target[func].bind(target));
                break;
            }
        }
    })
    ;
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
