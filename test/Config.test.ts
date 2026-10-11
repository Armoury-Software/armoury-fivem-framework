import 'reflect-metadata';
import { Injectable, ReflectiveInjector } from 'injection-js';
import { Config, createConfigProviders, parseConfigValue } from '../src/common/config.decorator';
import { Resource, ResourceRef, createResourceProviders } from '../src/common/resource.decorator';
import { bootstrapWithProviders, DecorationType } from '../src/common';

const spawnMetadata = `{
    position = { x = 247.83297729492188, y = -343.20001220703125, z = 44.4615478515625 },
    rotation = { x = 0.0, y = 0.0, z = 158.7401580810547 }
}`;

class ExistingDependency {
    public readonly value = 42;
}

class ConfiguredService {
    public constructor(
        public readonly spawnPosition: unknown,
        public readonly dependency: ExistingDependency,
    ) {}
}

class ResourceInjectedService {
    public constructor(
        public readonly spawnManager: unknown,
        public readonly dependency: ExistingDependency,
    ) {}
}

class DatabaseProvider {}

@Injectable()
class BootstrapEntry {
    public constructor(public readonly database: DatabaseProvider) {}
}

@Injectable()
class EmptyBootstrapEntry {}

Reflect.defineMetadata('design:paramtypes', [Object, ExistingDependency], ConfiguredService);
Config('spawn')(ConfiguredService, undefined, 0);
Reflect.defineMetadata('design:paramtypes', [Object, ExistingDependency], ResourceInjectedService);
Resource('spawnmanager')(ResourceInjectedService, undefined, 0);

describe('Config', () => {
    it('parses Lua table metadata into nested JavaScript objects', () => {
        expect(parseConfigValue(spawnMetadata, 'spawn')).toEqual({
            position: {
                x: 247.83297729492188,
                y: -343.20001220703125,
                z: 44.4615478515625,
            },
            rotation: {
                x: 0,
                y: 0,
                z: 158.7401580810547,
            },
        });
    });

    it('injects config without replacing normal constructor injection', () => {
        const lookups: string[] = [];
        const configProviders = createConfigProviders([ConfiguredService], (key) => {
            lookups.push(key);
            if (key === 'spawn_extra') {
                return JSON.stringify(parseConfigValue(spawnMetadata, 'spawn'));
            }
            if (key === 'spawn') {
                return 'config';
            }
            return undefined;
        });
        const injector = ReflectiveInjector.resolveAndCreate([
            ExistingDependency,
            ...configProviders,
            ConfiguredService,
        ]);
        const service = injector.get(ConfiguredService);

        expect(service.spawnPosition).toEqual(parseConfigValue(spawnMetadata, 'spawn'));
        expect(service.dependency).toBeInstanceOf(ExistingDependency);
        expect(service.dependency.value).toBe(42);
        expect(lookups).toEqual(['spawn_extra']);
    });

    it('falls back to the base key for scalar metadata', () => {
        const lookups: string[] = [];
        const configProviders = createConfigProviders([ConfiguredService], (key) => {
            lookups.push(key);
            return key === 'spawn' ? 'enabled' : undefined;
        });
        const injector = ReflectiveInjector.resolveAndCreate([
            ExistingDependency,
            ...configProviders,
            ConfiguredService,
        ]);
        const service = injector.get(ConfiguredService);

        expect(service.spawnPosition).toBe('enabled');
        expect(lookups).toEqual(['spawn_extra', 'spawn']);
    });

    it('injects another resource exports object alongside regular dependencies', () => {
        let spawnManagerExports = { setAutoSpawn: jest.fn() };
        const resourceLookups: string[] = [];
        const resourceProviders = createResourceProviders([ResourceInjectedService], (resourceName) => {
            resourceLookups.push(resourceName);
            expect(resourceName).toBe('spawnmanager');
            return spawnManagerExports;
        });
        const injector = ReflectiveInjector.resolveAndCreate([
            ExistingDependency,
            ...resourceProviders,
            ResourceInjectedService,
        ]);
        const service = injector.get(ResourceInjectedService);

        expect(service.spawnManager).toBeInstanceOf(ResourceRef);
        expect(resourceLookups).toEqual([]);
        expect((service.spawnManager as ResourceRef).instance).toBe(spawnManagerExports);

        const nextSpawnManagerExports = { setAutoSpawn: jest.fn() };
        spawnManagerExports = nextSpawnManagerExports;

        expect((service.spawnManager as ResourceRef).instance).toBe(nextSpawnManagerExports);
        expect(resourceLookups).toEqual(['spawnmanager', 'spawnmanager']);
        expect(service.dependency).toBeInstanceOf(ExistingDependency);
        expect(service.dependency.value).toBe(42);
    });

    it('keeps a configured provider when its class is also eagerly resolved', async () => {
        const configuredDatabase = { source: 'custom-provider' };
        const entry = await bootstrapWithProviders(
            BootstrapEntry,
            [DatabaseProvider],
            {
                providers: [{ provide: DatabaseProvider, useValue: configuredDatabase }],
                eager: [DatabaseProvider],
            },
            DecorationType.CLIENT,
            () => undefined,
            () => undefined,
        );

        expect(entry.database).toBe(configuredDatabase);
    });

    it('eagerly creates a default provider when no override exists', async () => {
        const defaultDatabase = { source: 'default-provider' };
        const defaultFactory = jest.fn(() => defaultDatabase);

        await bootstrapWithProviders(
            EmptyBootstrapEntry,
            [],
            {
                providers: [],
            },
            DecorationType.CLIENT,
            () => undefined,
            () => undefined,
            [{
                provide: DatabaseProvider,
                useFactory: defaultFactory,
                deps: [],
            }],
        );

        expect(defaultFactory).toHaveBeenCalledTimes(1);
    });

    it('eagerly resolves the consumer provider instead of the default provider', async () => {
        const defaultFactory = jest.fn(() => ({ source: 'default-provider' }));
        const consumerFactory = jest.fn(() => ({ source: 'consumer-provider' }));

        await bootstrapWithProviders(
            EmptyBootstrapEntry,
            [],
            {
                providers: [{
                    provide: DatabaseProvider,
                    useFactory: consumerFactory,
                    deps: [],
                }],
            },
            DecorationType.CLIENT,
            () => undefined,
            () => undefined,
            [{
                provide: DatabaseProvider,
                useFactory: defaultFactory,
                deps: [],
            }],
        );

        expect(defaultFactory).not.toHaveBeenCalled();
        expect(consumerFactory).toHaveBeenCalledTimes(1);
    });
});
