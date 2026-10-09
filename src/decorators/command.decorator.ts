import { DecoratorUtils } from "./decorator.utils";

// TODO: adminLevelRequired is not supposed to be here. Move it to @armoury/fivem-gamemode
export function Command(data?: { adminLevelRequired?: number, suffix?: string }) {
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata(`arm_command_${propertyKey}`, data, target);
    }
}

export function Commands(target: any, _prototype: any, providers?: Object[]) {
    DecoratorUtils.map(target, _prototype, providers ?? [])
        .filter((mapping) => mapping.key.startsWith('arm_command_'))
        .forEach((mapping) => {
            const rawCommandName = mapping.key.split('_').slice(2).join('_');
            const keybinding = Reflect.getOwnMetadata('keybinding_' + rawCommandName, _prototype);
            const commandName = `${keybinding ? '+' : ''}` + rawCommandName.toLowerCase() + (mapping.value?.suffix || '');

            if (!Cfx.Client.IsDuplicityVersion()) {
                Cfx.Client.RegisterCommand(
                    commandName,
                    (_source: number, args: any[], _raw: boolean) => {
                        mapping.target[rawCommandName].apply(mapping.target, args);
                    },
                    false
                );
            } else {
                Cfx.Server.RegisterCommand(
                    commandName,
                    (source: number, args: any[], _raw: boolean) => {
                        // TODO: This conditional is not generic enough. This conditional should actually check a function given through an injection token.
                        if (mapping.value?.adminLevelRequired && Number(Cfx.exports['authentication'].getPlayerInfo(source, 'adminLevel')) < mapping.value?.adminLevelRequired) {
                            // TODO: Add error chat message OR some kind of visual notice here
                            return;
                        }
                        mapping.target[rawCommandName].apply(mapping.target, [source, ...args]);
                    },
                    false
                );
            }
        });
}
