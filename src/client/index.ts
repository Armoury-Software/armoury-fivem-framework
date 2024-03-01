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
    ClientTranslateService,
    ClientVehiclesService,
    ClientUIService,
    ClientWaypointsService,
];

export function Client_Init<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, providers: Provider[] = CLIENT_PROVIDERS, injector?: ReflectiveInjector): T {
    const instance = Client_Injector(_class, providers, injector).get(_class);
    Decorate(instance, _class.prototype, providers, DecorationType.CLIENT);

    return instance;
}

export function Client_Injector<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, providers: Provider[], injector?: ReflectiveInjector): ReflectiveInjector {
    if (!injector) {
        injector = ReflectiveInjector.resolveAndCreate([
            ...providers,
            _class
        ]);
    } else {
        injector = injector.resolveAndCreateChild([...providers, _class]);
    }

    return injector;
}

export * from './services';
