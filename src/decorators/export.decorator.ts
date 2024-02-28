import { DecoratorUtils } from "./decorator.utils";

export function Export() {
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata(`export_${propertyKey}`, propertyKey, target);
    }
}

export function Exports(target: any, _prototype: any, providerMappings?: { value: any, provider: any }[]) {
    DecoratorUtils.map(target, _prototype, providerMappings)
        .filter((mapping) => mapping.key.startsWith('export_'))
        .forEach((mapping) => {
            const exportName = mapping.key.split('_').slice(1).join('_');
            Cfx.exports(exportName, mapping.target[exportName].bind(mapping.target));
        });
}
