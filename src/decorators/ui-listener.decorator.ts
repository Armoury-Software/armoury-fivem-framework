import { DecoratorUtils } from "./decorator.utils";

export function UIListener(data?: { eventName?: string }) {
    return function (target: any, propertyKey: string) {
        const eventName: string = data?.eventName || propertyKey;

        Reflect.defineMetadata(`uiListener_${propertyKey}`, { eventName }, target);
    };
}

export function UIListeners(target: any, _prototype: any, providerMappings?: { value: any, provider: any }[]) {
    DecoratorUtils.map(target, _prototype, providerMappings)
        .filter((mapping) => mapping.key.startsWith('uiListener_'))
        .forEach((mapping) => {
            const { eventName }: { eventName: string } = mapping.value;
            const func = mapping.key.split('_').slice(1).join('_');

            Cfx.Client.RegisterNuiCallbackType(eventName);
            Cfx.Client.on('__cfx_nui:' + eventName, (data, cb) => {
                mapping.target[func].call(mapping.target, data);
                cb('ok');
            });
        });
}
