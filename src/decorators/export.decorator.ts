import { DecoratorUtils } from "./decorator.utils";

export function Export() {
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata(`arm_export_${propertyKey}`, propertyKey, target);
    }
}

export function Exports(target: any, _prototype: any, providers?: Object[]) {
    DecoratorUtils.map(target, _prototype, providers ?? [])
        .filter((mapping) => mapping.key.startsWith('arm_export_'))
        .forEach((mapping) => {
            const exportName = mapping.key.split('_').slice(2).join('_');
            Cfx.exports(exportName, mapping.target[exportName].bind(mapping.target));
        });
}
