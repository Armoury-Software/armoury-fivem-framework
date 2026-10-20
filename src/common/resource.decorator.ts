import { Inject, InjectionToken, Provider } from 'injection-js';

interface ResourceBinding {
    token: InjectionToken<unknown>;
    resourceName: string;
}

const RESOURCE_PARAMETERS_METADATA = 'arm_resource_parameters';

export type ResourceExportsReader = (resourceName: string) => unknown;
type ResourceExport = <T = any>(...args: any[]) => any;

export class ResourceRef<T = Record<string, ResourceExport>> {
    public constructor(
        public readonly resourceName: string,
        private readonly readExports: ResourceExportsReader,
    ) {}

    public get instance(): T {
        const resourceExports = this.readExports(this.resourceName);
        if (resourceExports === null || resourceExports === undefined) {
            throw new Error(`Resource '${this.resourceName}' is not available or exposes no exports.`);
        }

        return resourceExports as T;
    }
}

export function Resource<T = Record<string, ResourceExport>>(resourceName: string): ParameterDecorator {
    if (!resourceName.trim()) {
        throw new Error('Resource name must not be empty.');
    }

    const token = new InjectionToken<ResourceRef<T>>(`Resource(${resourceName})`) as InjectionToken<unknown>;
    const inject = Inject(token);

    return (target, propertyKey, parameterIndex) => {
        if (propertyKey !== undefined) {
            throw new Error('Resource can only decorate constructor parameters.');
        }

        inject(target, propertyKey, parameterIndex);

        const bindings: ResourceBinding[] = Reflect.getOwnMetadata(RESOURCE_PARAMETERS_METADATA, target) ?? [];
        Reflect.defineMetadata(RESOURCE_PARAMETERS_METADATA, [...bindings, { token, resourceName }], target);
    };
}

export function createResourceProviders(targets: Function[], readExports: ResourceExportsReader): Provider[] {
    const bindings = new Map<InjectionToken<unknown>, ResourceBinding>();

    for (const target of targets) {
        let constructor: Function | null = target;
        while (constructor && constructor !== Function.prototype) {
            const constructorBindings: ResourceBinding[] = Reflect.getOwnMetadata(RESOURCE_PARAMETERS_METADATA, constructor) ?? [];
            constructorBindings.forEach((binding) => bindings.set(binding.token, binding));
            constructor = Object.getPrototypeOf(constructor);
        }
    }

    return [...bindings.values()].map(({ token, resourceName }) => ({
        provide: token,
        useFactory: () => new ResourceRef(resourceName, readExports),
    }));
}