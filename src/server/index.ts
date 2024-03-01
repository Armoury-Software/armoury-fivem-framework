import { Provider, ReflectiveInjector } from 'injection-js';
import { ServerEnterableDatabase, ServerResourceDatabase, ServerTranslateService, ServerVirtualWorldsService } from './services';
import { Decorate } from '../decorators/decorator.utils';

export const SERVER_PROVIDERS = [
    ServerVirtualWorldsService,
    ServerResourceDatabase,
    ServerEnterableDatabase,
    ServerTranslateService,
];

export function Server_Init<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, providers: Provider[] = [], injector?: ReflectiveInjector): T {
    const computedProviders = [
        ...providers ?? [],
        ...SERVER_PROVIDERS
    ];
    const instance = Server_Injector(_class, computedProviders, injector).get(_class);
    Decorate(instance, _class.prototype, computedProviders);

    return instance;
}

export function Server_Injector<
    T extends { new(...args: any[]): any } & Provider
>(_class: T, providers: Provider[], injector?: ReflectiveInjector): ReflectiveInjector {
    if (!injector) {
        console.log('no child injector provided.', providers);
        injector = ReflectiveInjector.resolveAndCreate([
            ...providers,
            _class
        ]);
    } else {
        console.log('a child injector was provided.');
        injector = injector.resolveAndCreateChild([/*...providers, */...SERVER_PROVIDERS, _class]);
    }

    return injector;
}

export * from './services';
