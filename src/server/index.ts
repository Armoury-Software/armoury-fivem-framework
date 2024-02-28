import { ReflectiveInjector } from 'injection-js';

import { ServerVirtualWorldsService, ServerEnterableDatabase, ServerResourceDatabase } from './services';

import { Commands } from '../decorators/command.decorator';
import { EventListeners } from '../decorators/event-listener.decorator';
import { Exports } from '../decorators/export.decorator';
import { KeyBindings } from '../decorators/key-binding.decorator';

const providers = [
    ServerVirtualWorldsService,
    ServerResourceDatabase,
    ServerEnterableDatabase,
];

export function Server_Init(_class: any, injector?: ReflectiveInjector) {
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

    return instance;
}

export * from './services';
