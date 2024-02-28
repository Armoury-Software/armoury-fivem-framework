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
