import { Provider, ReflectiveInjector } from 'injection-js';
import { ClientActionPointsService, ClientBlipsService, ClientCheckpointsService, ClientMarkersService, ClientPedsService, ClientSessionService, ClientTicksService, ClientUIService, ClientVehiclesService, ClientWaypointsService, ClientTranslateService, ClientHudService } from './services';

import { Decorate, DecorationType } from '../decorators/decorator.utils';

export const CLIENT_PROVIDERS = [
    ClientActionPointsService,
    ClientBlipsService,
    ClientCheckpointsService,
    ClientHudService,
    ClientMarkersService,
    ClientPedsService,
    ClientSessionService,
    ClientTicksService,
    ClientVehiclesService,
    ClientUIService,
    ClientWaypointsService,
];

export function Client_Init<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, ...providers: Provider[]): T {
    const mainInjector = ReflectiveInjector.resolveAndCreate(CLIENT_PROVIDERS);
    const injector: ReflectiveInjector
        = ReflectiveInjector.resolveAndCreate([...providers, _class], mainInjector);

    const instance = injector.get(_class);
    Decorate(instance, _class.prototype, [...CLIENT_PROVIDERS, ...providers], DecorationType.CLIENT);

    return instance;
}

export * from './services';
