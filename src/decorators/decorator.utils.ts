import { Provider } from "injection-js";
import { Commands } from "./command.decorator";
import { EventListeners } from "./event-listener.decorator";
import { Exports } from "./export.decorator";
import { KeyBindings } from "./key-binding.decorator";
import { UIListeners } from "./ui-listener.decorator";

const decoratedTargets = new WeakSet<object>();

export class DecoratorUtils {
    public static map(target: any, _prototype: any, providers: Object[]) {
        return [
            ...Reflect.getOwnMetadataKeys(_prototype)
                .map((key) => ({ key, target, value: Reflect.getOwnMetadata(key, _prototype) })),
            ...providers
                ? providers.map((provider) =>
                    Reflect.getMetadataKeys(provider)
                        .map((key) => ({
                            key,
                            target: provider,
                            value: Reflect.getMetadata(key, provider)
                        }))
                ).flat()
                : []
        ]
    }
}

export function Decorate<
    T extends { new(...args: any[]): any } & Provider
>(instance: T, _prototype: any, providers: Provider[], decorationType: DecorationType = DecorationType.SERVER) {
    if (decoratedTargets.has(instance)) {
        return;
    }

    const relevantProvidersForClass = Object.values(instance)
        .filter((provider) =>
            typeof provider === 'object'
            && provider !== null
            && !decoratedTargets.has(provider)
            && Reflect.getMetadataKeys(provider).some((key) => key.startsWith('arm_'))
        );

    decoratedTargets.add(instance);
    relevantProvidersForClass.forEach((provider) => decoratedTargets.add(provider));

    Commands(instance, _prototype, relevantProvidersForClass);
    EventListeners(instance, _prototype, relevantProvidersForClass);
    Exports(instance, _prototype, relevantProvidersForClass);
    KeyBindings(instance, _prototype, relevantProvidersForClass);

    if (decorationType === DecorationType.CLIENT) {
        UIListeners(instance, _prototype, relevantProvidersForClass);
    } 
}

export enum DecorationType {
    SERVER = 0,
    CLIENT
}
