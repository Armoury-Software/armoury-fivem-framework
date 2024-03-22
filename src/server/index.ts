import { Provider, ReflectiveInjector } from 'injection-js';
import { SessionAccountId, SessionCash, SessionHoursPlayed, SessionId, SessionLanguage, SessionLastLocation, SessionName } from './services/session/defaults';
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

export function Server_Init<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, ...providers: Provider[]): T {
    const mainInjector = ReflectiveInjector.resolveAndCreate(SERVER_PROVIDERS);
    const injector: ReflectiveInjector
        = ReflectiveInjector.resolveAndCreate([...providers, _class], mainInjector);

    const instance = injector.get(_class);
    Decorate(instance, _class.prototype, [...SERVER_PROVIDERS, ...providers]);

    return instance;
}

export * from './services';
export * from './models';
