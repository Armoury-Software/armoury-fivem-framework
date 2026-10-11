/// <reference path = "../ambient.declarations.d.ts" />

import 'reflect-metadata';
import { InjectionToken, Provider, ReflectiveInjector } from 'injection-js';

export * from '../shared';
export * from '../decorators';
export { Decorate, DecorationType } from '../decorators/decorator.utils';
export * from '../utils';
export * from '../utils/utils';
export { Config } from './config.decorator';
export { Resource, ResourceRef } from './resource.decorator';

import { Decorate, DecorationType } from '../decorators/decorator.utils';
import { ConfigValueReader, createConfigProviders } from './config.decorator';
import { createResourceProviders, ResourceExportsReader } from './resource.decorator';

export type AppInitializer = () => void | Promise<void>;

export const APP_INITIALIZER = new InjectionToken<AppInitializer[]>('APP_INITIALIZER');

export interface BootstrapOptions {
	providers?: Provider[];
	eager?: Array<{ new(...args: any[]): any }>;
}

function flattenProviders(providers: Provider[]): Provider[] {
	const flattened: Provider[] = [];
	for (const provider of providers) {
		if (Array.isArray(provider)) {
			flattened.push(...flattenProviders(provider));
		} else {
			flattened.push(provider);
		}
	}
	return flattened;
}

function getProviderToken(provider: Provider): unknown {
	if (typeof provider === 'function') {
		return provider;
	}

	if (provider && typeof provider === 'object' && 'provide' in provider) {
		return provider.provide;
	}

	return undefined;
}

function getProviderTokens(providers: Provider[]): unknown[] {
	return flattenProviders(providers)
		.map(getProviderToken)
		.filter((token) => token !== undefined);
}

function getProviderClasses(providers: Provider[]): Function[] {
	const classes: Function[] = [];
	for (const provider of providers) {
		if (Array.isArray(provider)) {
			classes.push(...getProviderClasses(provider));
			continue;
		}

		if (typeof provider === 'function') {
			classes.push(provider);
			continue;
		}

		if (provider && typeof provider === 'object' && 'useClass' in provider) {
			classes.push(provider.useClass);
		}
	}

	return classes;
}

function hasProviderForToken(providers: Provider[], token: unknown): boolean {
	for (const provider of providers) {
		if (Array.isArray(provider)) {
			if (hasProviderForToken(provider, token)) {
				return true;
			}
			continue;
		}

		if (provider === token || (provider && typeof provider === 'object' && 'provide' in provider && provider.provide === token)) {
			return true;
		}
	}

	return false;
}

export async function bootstrapWithProviders<
	T extends { new(...args: any[]): any } & Provider
>(
	entryPoint: T,
	parentProviders: Provider[],
	options: BootstrapOptions = {},
	decorationType: DecorationType = DecorationType.SERVER,
	readConfigValue: ConfigValueReader,
	readResourceExports: ResourceExportsReader,
	defaultEagerProviders: Provider[] = [],
): Promise<InstanceType<T>> {
	const eagerProviders = options.eager ?? [];
	const optionProviders = options.providers ?? [];
	const platformDefaultProviders = flattenProviders(defaultEagerProviders);
	const activeDefaultEagerProviders = platformDefaultProviders.filter((defaultProvider) => {
		const token = getProviderToken(defaultProvider);
		return token === undefined || !hasProviderForToken([...parentProviders, ...optionProviders], token);
	});
	const eagerRegistrations = eagerProviders.filter((eagerProvider) =>
		!hasProviderForToken([...parentProviders, ...optionProviders], eagerProvider)
	);
	const providers = [...activeDefaultEagerProviders, ...optionProviders, ...eagerRegistrations];
	const eagerTokens = [...new Set([...getProviderTokens(platformDefaultProviders), ...eagerProviders])];
	const configTargets = [entryPoint, ...getProviderClasses(parentProviders), ...getProviderClasses(providers)];
	const configProviders = createConfigProviders(configTargets, readConfigValue);
	const resourceProviders = createResourceProviders(configTargets, readResourceExports);
	const parentInjector = ReflectiveInjector.resolveAndCreate(parentProviders);
	const injector = ReflectiveInjector.resolveAndCreate([...configProviders, ...resourceProviders, ...providers, entryPoint], parentInjector);
	const instance = injector.get(entryPoint) as InstanceType<T>;

	Decorate(instance, entryPoint.prototype, [...parentProviders, ...providers], decorationType);
	eagerTokens.forEach((token) => injector.get(token));

	const initializers = injector.get(APP_INITIALIZER, []);
	await Promise.all(initializers.map((initializer) => initializer()));

	return instance;
}