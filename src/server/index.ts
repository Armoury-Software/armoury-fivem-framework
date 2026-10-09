import { MikroORM } from '@mikro-orm/core';
import { Provider, ReflectiveInjector } from 'injection-js';

import { Character, SessionAccountId, SessionCash, SessionHoursPlayed, SessionId, SessionLanguage, SessionLastLocation, SessionName } from './services/session/default-entities';
import { Decorate } from '../decorators/decorator.utils';

export const SERVER_PROVIDERS = [
    {
        provide: 'sessionItems',
        useValue: new SessionId(),
        multi: true,
    },
    {
        provide: 'sessionItems',
        useValue: new SessionAccountId(),
        multi: true,
    },
    {
        provide: 'sessionItems',
        useValue: new SessionName(),
        multi: true,
    },
    {
        provide: 'sessionItems',
        useValue: new SessionCash(),
        multi: true,
    },
    {
        provide: 'sessionItems',
        useValue: new SessionHoursPlayed(),
        multi: true,
    },
    {
        provide: 'sessionItems',
        useValue: new SessionLastLocation(),
        multi: true,
    },
    {
        provide: 'sessionItems',
        useValue: new SessionLanguage(),
        multi: true,
    },
];

export async function Server_Init<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, ...providers: Provider[]): Promise<T> {
    const database = Cfx.Server.GetConvar('mysql_connection_string', '').split(';')
            .find((item) => item.startsWith('database='))
            ?.split('=').slice(-1)[0];

    const test = await MikroORM.init({
        baseDir: __dirname + '/../..',
        entities: [Character],
        // entitiesTs: ['./src/**/*.entity.ts'],
        dbName: database,
        discovery: { disableDynamicFileAccess: true }
    });

    console.log('mikro-orm is', test);

    const mainInjector = ReflectiveInjector.resolveAndCreate(SERVER_PROVIDERS);
    const injector: ReflectiveInjector
        = ReflectiveInjector.resolveAndCreate([...providers, _class], mainInjector);

    const instance = injector.get(_class);
    Decorate(instance, _class.prototype, [...SERVER_PROVIDERS, ...providers]);

    return instance;
}

export * from './services';
export * from './models';
