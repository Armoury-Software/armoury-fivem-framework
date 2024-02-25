import { ReflectiveInjector } from 'injection-js';

import { Commands } from '../decorators/command.decorator';
import { EventListeners } from '../decorators/event-listener.decorator';
import { Exports } from '../decorators/export.decorator';
import { KeyBindings } from '../decorators/key-binding.decorator';

export function Server_Init(_class: any) {
    const instance = ReflectiveInjector.resolveAndCreate([
        _class
    ]).get(_class);

    Commands(instance, _class.prototype);
    EventListeners(instance, _class.prototype);
    Exports(instance, _class.prototype);
    KeyBindings(instance, _class.prototype);
    return instance;
}

export * from './server-db-dependent.controller';
export * from './server.controller';
export * from './server.entities';
export * from './server.base';