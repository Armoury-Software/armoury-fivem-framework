/// <reference path = "../ambient.declarations.d.ts" />

import 'reflect-metadata';
import { Provider } from 'injection-js';
import { ClientActionPointsService, ClientBlipsService, ClientCheckpointsService, ClientMarkersService, ClientPedsService, ClientSessionService, ClientTicksService, ClientUIService, ClientVehiclesService, ClientWaypointsService, ClientTranslateService, ClientHudService } from './services';

import { BootstrapOptions, bootstrapWithProviders, DecorationType } from '@armoury/fivem-framework-common';

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

export async function bootstrap<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, options: BootstrapOptions = {}): Promise<InstanceType<T>> {
    return bootstrapWithProviders(
        _class,
        CLIENT_PROVIDERS,
        options,
        DecorationType.CLIENT,
        (key, index) => Cfx.Client.GetResourceMetadata(Cfx.Client.GetCurrentResourceName(), key, index),
		(resourceName) => Cfx.exports[resourceName],
    );
}

export * from './services';
export * from '@armoury/fivem-framework-common';
