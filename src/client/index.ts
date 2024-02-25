import { ReflectiveInjector } from 'injection-js';
import { ClientActionPointsService, ClientBlipsService, ClientCheckpointsService, ClientMarkersService, ClientPedsService, ClientSessionService, ClientTicksService, ClientVehiclesService, ClientWaypointsService } from './services';

import { Commands } from '../decorators/command.decorator';
import { EventListeners } from '../decorators/event-listener.decorator';
import { Exports } from '../decorators/export.decorator';
import { KeyBindings } from '../decorators/key-binding.decorator';

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

    Commands(instance, _class.prototype);
    EventListeners(instance, _class.prototype);
    Exports(instance, _class.prototype);
    KeyBindings(instance, _class.prototype);
    return instance;
}

export * from './client.base';
export * from './client-entities';
export * from './client-action-points';
export * from './client-hud.controller';
export * from './client.controller';
export * from './services';
// export * from './client-ui.controller';
