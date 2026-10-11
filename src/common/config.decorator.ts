import { Inject, InjectionToken, Provider } from 'injection-js';
import { Expression, TableConstructorExpression, parse as parseLua } from 'luaparse';

interface ConfigBinding {
    token: InjectionToken<unknown>;
    key: string;
    index: number;
}

const CONFIG_PARAMETERS_METADATA = 'arm_config_parameters';

export type ConfigValueReader = (key: string, index: number) => string | null | undefined;

export function Config<T = unknown>(key: string, index = 0): ParameterDecorator {
    if (!key.trim()) {
        throw new Error('Config metadata key must not be empty.');
    }

    if (!Number.isInteger(index) || index < 0) {
        throw new Error('Config metadata index must be a non-negative integer.');
    }

    const token = new InjectionToken<T>(`Config(${key}, ${index})`);
    const inject = Inject(token);

    return (target, propertyKey, parameterIndex) => {
        if (propertyKey !== undefined) {
            throw new Error('Config can only decorate constructor parameters.');
        }

        inject(target, propertyKey, parameterIndex);

        const bindings: ConfigBinding[] = Reflect.getOwnMetadata(CONFIG_PARAMETERS_METADATA, target) ?? [];
        const binding = { token, key, index } as ConfigBinding;
        Reflect.defineMetadata(CONFIG_PARAMETERS_METADATA, [...bindings, binding], target);
    };
}

export function createConfigProviders(targets: Function[], readValue: ConfigValueReader): Provider[] {
    const bindings = new Map<InjectionToken<unknown>, ConfigBinding>();

    for (const target of targets) {
        let constructor: Function | null = target;
        while (constructor && constructor !== Function.prototype) {
            const constructorBindings: ConfigBinding[] = Reflect.getOwnMetadata(CONFIG_PARAMETERS_METADATA, constructor) ?? [];
            constructorBindings.forEach((binding) => bindings.set(binding.token, binding));
            constructor = Object.getPrototypeOf(constructor);
        }
    }

    return [...bindings.values()].map(({ token, key, index }) => ({
        provide: token,
        useFactory: () => {
            const metadataKeys = key.endsWith('_extra') ? [key] : [`${key}_extra`, key];
            let value: string | null | undefined;

            for (const metadataKey of metadataKeys) {
                value = readValue(metadataKey, index);
                if (value !== null && value !== undefined) {
                    break;
                }
            }

            if (value === null || value === undefined) {
                throw new Error(`Missing resource metadata '${metadataKeys.join("' or '")}' at index ${index}.`);
            }

            return parseConfigValue(value, key);
        },
    }));
}

export function parseConfigValue(value: string, metadataKey: string): unknown {
    let expression = value.trim();
    const metadataCallPrefix = new RegExp(`^${escapeRegExp(metadataKey)}\\s+`);
    expression = expression.replace(metadataCallPrefix, '');

    if (expression.startsWith('{') || expression.startsWith('[')) {
        try {
            return JSON.parse(expression);
        } catch {
            // Resource manifest tables use Lua syntax rather than JSON.
        }
    } else if (!expression.startsWith('return')) {
        return value;
    }

    const chunk = parseLua(expression.startsWith('return') ? expression : `return ${expression}`, {
        luaVersion: '5.3',
    });
    const statement = chunk.body[0];
    if (chunk.body.length !== 1 || statement.type !== 'ReturnStatement' || statement.arguments.length !== 1) {
        throw new Error(`Resource metadata '${metadataKey}' must contain a single table value.`);
    }

    return convertLuaExpression(statement.arguments[0], metadataKey);
}

function convertLuaExpression(expression: Expression, metadataKey: string): unknown {
    switch (expression.type) {
        case 'TableConstructorExpression':
            return convertLuaTable(expression, metadataKey);
        case 'StringLiteral':
        case 'NumericLiteral':
        case 'BooleanLiteral':
        case 'NilLiteral':
            return expression.value;
        case 'UnaryExpression':
            if (expression.operator === '-' && expression.argument.type === 'NumericLiteral') {
                return -expression.argument.value;
            }
            break;
    }

    throw new Error(`Resource metadata '${metadataKey}' contains an unsupported Lua expression.`);
}

function convertLuaTable(table: TableConstructorExpression, metadataKey: string): unknown[] | Record<string, unknown> {
    if (table.fields.every((field) => field.type === 'TableValue')) {
        return table.fields.map((field) => convertLuaExpression(field.value, metadataKey));
    }

    const result: Record<string, unknown> = {};
    let nextArrayIndex = 1;

    for (const field of table.fields) {
        let key: string;
        let value: Expression;

        if (field.type === 'TableKeyString') {
            key = field.key.name;
            value = field.value;
        } else if (field.type === 'TableKey') {
            const parsedKey = convertLuaExpression(field.key, metadataKey);
            if (typeof parsedKey !== 'string' && typeof parsedKey !== 'number') {
                throw new Error(`Resource metadata '${metadataKey}' has an unsupported table key.`);
            }
            key = String(parsedKey);
            value = field.value;
        } else {
            key = String(nextArrayIndex++);
            value = field.value;
        }

        Object.defineProperty(result, key, {
            value: convertLuaExpression(value, metadataKey),
            enumerable: true,
            configurable: true,
            writable: true,
        });
    }

    return result;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}