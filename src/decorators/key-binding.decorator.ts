export function KeyBinding(data: { command?: string, description: string, defaultMapper: KeyBindingType, key: string }) {
    return function(target: any, propertyKey: string) {
        Reflect.defineMetadata(
            `keybinding_${propertyKey}`, {
                command: data.command,
                description: data.description,
                defaultMapper: data.defaultMapper,
                key: data.key },
            target
        );
    }
}

export function KeyBindings(target: any, _prototype: any) {
    Reflect.getOwnMetadataKeys(_prototype)
        .filter((key) => key.startsWith('keybinding_'))
        .forEach((key: string) => {
            const keybindingName = key.split('_').slice(1).join('_');
            const data = Reflect.getOwnMetadata(key, _prototype);
            const command = data.command || keybindingName;

            if (!command) {
                console.error(`Could not find any relevant command for key binding ${keybindingName}`);
                return;
            }

            Cfx.Client.RegisterKeyMapping(`+${command.toLowerCase()}`, data.description, data.defaultMapper, data.key);
        })
    ;
}

export type KeyBindingType =
    'digitalbutton_axis' | 'game_controlled' | 'joystick_axis' | 'joystick_axis_negative'
    | 'joystick_axis_positive' | 'joystick_button' | 'joystick_iaxis' | 'joystick_pov'
    | 'joystick_pov_axis' | 'keyboard' | 'mkb_axis' | 'mouse_absoluteaxis' | 'mouse_button'
    | 'mouse_buttonany' | 'mouse_centeredaxis' | 'mouse_relativeaxis' | 'mouse_scaledaxis'
    | 'mouse_normalized' | 'mouse_wheel' | 'pad_analogbutton' | 'pad_axis' | 'pad_debugbutton'
    | 'pad_digitalbutton' | 'pad_digitalbuttonany' | 'touchpad_absolute_axis' | 'touchpad_centered_axis'
;
