import { DecoratorUtils } from "./decorator.utils";

export function KeyBinding(data: { command?: string, description: string, defaultMapper: KeyBindingType, key: string }) {
    return function (target: any, propertyKey: string) {
        Reflect.defineMetadata(
            `arm_keybinding_${propertyKey}`, {
            command: data.command,
            description: data.description,
            defaultMapper: data.defaultMapper,
            key: data.key
        },
            target
        );
    }
}

export function KeyBindings(target: any, _prototype: any, providers?: Object[]) {
    DecoratorUtils.map(target, _prototype, providers ?? [])
        .filter((mapping) => mapping.key.startsWith('arm_keybinding_'))
        .forEach((mapping) => {
            const keybindingName = mapping.key.split('_').slice(2).join('_');
            const command = mapping.value?.command || keybindingName;

            if (!command) {
                console.error(`Could not find any relevant command for key binding ${keybindingName}`);
                return;
            }

            Cfx.Client.RegisterKeyMapping(
                `+${command.toLowerCase()}`,
                mapping.value?.description,
                mapping.value?.defaultMapper,
                mapping.value?.key
            );
        });
}

export type KeyBindingType =
    'digitalbutton_axis' | 'game_controlled' | 'joystick_axis' | 'joystick_axis_negative'
    | 'joystick_axis_positive' | 'joystick_button' | 'joystick_iaxis' | 'joystick_pov'
    | 'joystick_pov_axis' | 'keyboard' | 'mkb_axis' | 'mouse_absoluteaxis' | 'mouse_button'
    | 'mouse_buttonany' | 'mouse_centeredaxis' | 'mouse_relativeaxis' | 'mouse_scaledaxis'
    | 'mouse_normalized' | 'mouse_wheel' | 'pad_analogbutton' | 'pad_axis' | 'pad_debugbutton'
    | 'pad_digitalbutton' | 'pad_digitalbuttonany' | 'touchpad_absolute_axis' | 'touchpad_centered_axis'
    ;
