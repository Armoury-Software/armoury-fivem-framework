/// <reference path = "../ambient.declarations.d.ts" />

import 'reflect-metadata';
import { BootstrapOptions, bootstrapWithProviders } from '@armoury/fivem-framework-common';
import { Provider } from 'injection-js';

import { Database } from './database/database';
import { ServerSessionService } from './services';

export const SERVER_LAZY_PROVIDERS: Provider[] = [
];

export const SERVER_EAGER_PROVIDERS: Provider[] = [
  Database.forChild(),
  ServerSessionService,
];

export async function bootstrap<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, options: BootstrapOptions = {}): Promise<InstanceType<T>> {
  return bootstrapWithProviders(
    _class,
    SERVER_LAZY_PROVIDERS,
    options,
    undefined,
    (key, index) => Cfx.Server.GetResourceMetadata(Cfx.Server.GetCurrentResourceName(), key, index),
    (resourceName) => Cfx.exports[resourceName],
		SERVER_EAGER_PROVIDERS,
  );
}

export * from './database';
export * from './services';
export * from './models';
export * from '@armoury/fivem-framework-common';
