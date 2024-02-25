// TODO: adminLevelRequired is not supposed to be here. Move it to @armoury/fivem-gamemode
export function Command(data?: { adminLevelRequired?: number, suffix?: string }) {
    return function(target: any, propertyKey: string) {
        Reflect.defineMetadata(`command_${propertyKey}`, data, target);
    }
}

export function Commands(target: any, _prototype: any) {
    Reflect.getOwnMetadataKeys(_prototype)
        .filter((key) => key.startsWith('command_'))
        .forEach((key: string) => {
            const data = Reflect.getOwnMetadata(key, _prototype);
            const rawCommandName = key.split('_').slice(1).join('_');
            const keybinding = Reflect.getOwnMetadata('keybinding_' + rawCommandName, _prototype);
            const commandName = `${keybinding ? '+' : ''}` + rawCommandName.toLowerCase() + (data?.suffix || '');

            if (!Cfx.Client.IsDuplicityVersion()) {
                Cfx.Client.RegisterCommand(
                    commandName,
                    (source: number, args: any[], _raw: boolean) => {
                        target[rawCommandName].apply(target, args);
                    },
                    false
                );
            } else {
                Cfx.Server.RegisterCommand(
                    commandName,
                    (source: number, args: any[], _raw: boolean) => {
                        // TODO: This conditional is not generic enough. This conditional should actually check a function given through an injection token.
                        if (data?.adminLevelRequired && Number(Cfx.exports['authentication'].getPlayerInfo(source, 'adminLevel')) < data?.adminLevelRequired) {
                            // TODO: Add error chat message OR some kind of visual notice here
                            return;
                        }
                        target[rawCommandName].apply(target, [source, ...args]);
                    },
                    false
                );
            }
        })
    ;
}
