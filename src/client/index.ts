import { ReflectiveInjector } from 'injection-js';
import { ClientActionPointsService, ClientBlipsService, ClientCheckpointsService, ClientMarkersService, ClientPedsService, ClientSessionService, ClientTicksService, ClientVehiclesService, ClientWaypointsService } from './services';

export function Client_Init(_class: any) {
    const instance = ReflectiveInjector.resolveAndCreate([
        ClientActionPointsService,
        ClientBlipsService,
        ClientCheckpointsService,
        ClientMarkersService,
        ClientPedsService,
        ClientSessionService,
        ClientTicksService,
        ClientVehiclesService,
        ClientWaypointsService,
        _class
    ]).get(_class);

    Commands_Client(instance, _class.prototype);
    return instance;
}

function Commands_Client(target: any, _prototype: any) {
    Reflect.getOwnMetadataKeys(_prototype)
        .filter((key) => key.startsWith('command_'))
        .forEach((key: string) => {
            const data = Reflect.getOwnMetadata(key, _prototype);
            const commandName = `${data?.isKeyBinding ? '+' : ''}` + key.split('_').slice(-1)[0].toLowerCase() + (data?.suffix || '');

            Cfx.Client.RegisterCommand(
                commandName,
                (source: number, args: any[], _raw: boolean) => {
                    target[commandName].call(target, args, _raw);
                },
                false
            );
        })
    ;
}

export * from './client.base';
export * from './client-entities';
export * from './client-action-points';
export * from './client-hud.controller';
export * from './client.controller';
export * from './services';
// export * from './client-ui.controller';
