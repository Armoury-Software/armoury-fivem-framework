export function Export() {
    return function(target: any, propertyKey: string) {
        Reflect.defineMetadata(`export_${propertyKey}`, propertyKey, target);
    }
}

export function Exports(target: any, _prototype: any) {
    Reflect.getOwnMetadataKeys(_prototype)
        .filter((key) => key.startsWith('export_'))
        .forEach((key: string) => {
            const exportName = key.split('_').slice(1).join('_');
            Cfx.exports(exportName, target[exportName].bind(target));
        })
    ;
}
