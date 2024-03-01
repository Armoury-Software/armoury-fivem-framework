import { Provider } from "injection-js";
import { Commands } from "./command.decorator";
import { EventListeners } from "./event-listener.decorator";
import { Exports } from "./export.decorator";
import { KeyBindings } from "./key-binding.decorator";
import { UIListeners } from "./ui-listener.decorator";

export class DecoratorUtils {
    public static map(target: any, _prototype: any, providerMappings?: { value: any, provider: any }[]) {
        return [
            ...Reflect.getOwnMetadataKeys(_prototype)
                .map((key) => ({ key, target, value: Reflect.getOwnMetadata(key, _prototype) })),
            ...providerMappings
                ? providerMappings.map((providerMapping) =>
                    Reflect.getOwnMetadataKeys(providerMapping.provider.prototype)
                        .map((key) => ({
                            key,
                            target: providerMapping.value,
                            value: Reflect.getOwnMetadata(key, providerMapping.provider.prototype)
                        }))
                ).flat()
                : []
        ]
    }
}

export function Decorate<
    T extends { new(...args: any[]): any } & Provider
>(instance: T, _prototype: any, providers: Provider[], decorationType: DecorationType = DecorationType.SERVER) {
    const relevantProvidersForClass = Object.values(instance)
        .map((value: Provider) => ({
            provider: providers.find((provider) => value instanceof <any> provider),
            value
        }))
        .filter((value) => !!value.provider)
    ;

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
