import { ReflectiveInjector } from 'injection-js';
import { ClientActionPointsService, ClientBlipsService, ClientCheckpointsService, ClientMarkersService, ClientPedsService, ClientSessionService, ClientTicksService, ClientUIService, ClientVehiclesService, ClientWaypointsService } from './services';

import { Commands } from '../decorators/command.decorator';
import { EventListeners } from '../decorators/event-listener.decorator';
import { Exports } from '../decorators/export.decorator';
import { KeyBindings } from '../decorators/key-binding.decorator';
import { UIListeners } from '../decorators/ui-listener.decorator';

const providers = [
    ClientActionPointsService,
    ClientBlipsService,
    ClientCheckpointsService,
    ClientMarkersService,
    ClientPedsService,
    ClientSessionService,
    ClientTicksService,
    ClientVehiclesService,
    ClientWaypointsService,
    ClientUIService,
];

export function Client_Init(_class: any, injector?: ReflectiveInjector) {
    if (!injector) {
        injector = ReflectiveInjector.resolveAndCreate([
            ...providers,
            _class
        ]);
    } else {
        injector = injector.resolveAndCreateChild([...providers, _class]);
    }

    const instance = injector.get(_class);

    const relevantProvidersForClass = Object.values(instance)
        .map((value: any) => ({
            provider: providers.find((provider) => value instanceof provider),
            value
        }))
        .filter((value) => !!value.provider)
    ;

    Commands(instance, _class.prototype, relevantProvidersForClass);
    EventListeners(instance, _class.prototype, relevantProvidersForClass);
    Exports(instance, _class.prototype, relevantProvidersForClass);
    KeyBindings(instance, _class.prototype, relevantProvidersForClass);
    UIListeners(instance, _class.prototype, relevantProvidersForClass);

    return instance;
}

export * from './services';
