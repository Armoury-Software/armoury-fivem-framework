// import { DEFAULT_DECORATORS } from './decorators.defaults';
// import { EVENT_DIRECTIONS } from './event.directions';
// 
// const eventListeners: Map<{ new (...args: any[]): any }, [string, string, EVENT_DIRECTIONS][]> = new Map<{ new (...args: any[]): any }, [string, string, EVENT_DIRECTIONS][]>();
// const exportRegisterers: Map<{ new (...args: any[]): any }, string[]> = new Map<{ new (...args: any[]): any }, string[]>();
// const commandRegisterers: Map<{ new (...args: any[]): any }, [string, any][]> = new Map<{ new (...args: any[]): any }, [string, any][]>();
// 
// export function FiveMController(options?: FiveMControllerOptions) {
//     return function(target: any) {
//         Object.defineProperty(target.prototype, 'translationFile', {
//             value: options?.translationFile,
//             enumerable: true,
//             configurable: true,
//         });
// 
//         if (eventListeners.has(target.constructor)) {
//             eventListeners.get(target.constructor)!.forEach(([func, eventName, direction]: [string, string, EVENT_DIRECTIONS]) => {
//               switch (direction) {
//                 case EVENT_DIRECTIONS.CLIENT_TO_CLIENT: {
//                   Cfx.Client.on(eventName, target.constructor[func].bind(target));
//                   break;
//                 }
//                 default: {
//                   Cfx.Server.onNet(eventName, target.constructor[func].bind(target));
//                   break;
//                 }
//               }
//             });
//           }
//   
//           if (exportRegisterers.has(target.constructor)) {
//             exportRegisterers.get(target.constructor)!.forEach((func: string) => {
//               Cfx.exports(func, target.prototype[func].bind(target));
//             });
//           }
//   
//           if (commandRegisterers.has(target.constructor)) {
//             commandRegisterers.get(target.constructor)!.forEach(([func, data]: [string, any]) => {
//               if (Cfx.Client.IsDuplicityVersion()) {
//                 Cfx.Server.RegisterCommand(
//                   `${data?.isKeyBinding ? '+' : ''}` + func.toLowerCase() + (data?.suffix || ''),
//                   (source: number, args: any[], _raw: boolean) => {
//                       if (data?.adminLevelRequired && Number(Cfx.exports['authentication'].getPlayerInfo(source, 'adminLevel')) < data?.adminLevelRequired) {
//                           // TODO: Add error chat message OR some kind of visual notice here
//                           return;
//                       }
//   
//                       target.prototype[func].call(target, source, args, _raw);
//                   },
//                   false
//                 );
//               } else {
//                 Cfx.Client.RegisterCommand(
//                   `${data?.isKeyBinding ? '+' : ''}` + func.toLowerCase() + (data?.suffix || ''),
//                   (source: number, args: any[], _raw: boolean) => {
//                       target.prototype[func].call(target, args, _raw);
//                   },
//                   false
//                 );
//               }
//             });
//           }
//     };
// }
// 
// /*export function FiveMController(options?: FiveMControllerOptions) {
//   return function _FiveMController<T extends {new(...args: any[]): {}}>(constr: T){
//     return class extends constr {
//       translationFile = options?.translationFile;
//       constructor(...args: any[]) {
//         super(...args);
// 
//         if (eventListeners.has(constr)) {
//           eventListeners.get(constr)!.forEach(([func, eventName, direction]: [string, string, EVENT_DIRECTIONS]) => {
//             switch (direction) {
//               case EVENT_DIRECTIONS.CLIENT_TO_CLIENT: {
//                 Cfx.Client.on(eventName, super[func].bind(this));
//                 break;
//               }
//               default: {
//                 Cfx.Server.onNet(eventName, super[func].bind(this));
//                 break;
//               }
//             }
//           });
//         }
// 
//         if (exportRegisterers.has(constr)) {
//           exportRegisterers.get(constr)!.forEach((func: string) => {
//             Cfx.exports(func, super[func].bind(this));
//           });
//         }
// 
//         if (commandRegisterers.has(constr)) {
//           commandRegisterers.get(constr)!.forEach(([func, data]: [string, any]) => {
//             if (Cfx.Client.IsDuplicityVersion()) {
//               Cfx.Server.RegisterCommand(
//                 `${data?.isKeyBinding ? '+' : ''}` + func.toLowerCase() + (data?.suffix || ''),
//                 (source: number, args: any[], _raw: boolean) => {
//                     if (data?.adminLevelRequired && Number(Cfx.exports['authentication'].getPlayerInfo(source, 'adminLevel')) < data?.adminLevelRequired) {
//                         // TODO: Add error chat message OR some kind of visual notice here
//                         return;
//                     }
// 
//                     super[func].call(this, source, args, _raw);
//                 },
//                 false
//               );
//             } else {
//               Cfx.Client.RegisterCommand(
//                 `${data?.isKeyBinding ? '+' : ''}` + func.toLowerCase() + (data?.suffix || ''),
//                 (source: number, args: any[], _raw: boolean) => {
//                     super[func].call(this, args, _raw);
//                 },
//                 false
//               );
//             }
//           });
//         }
//       }
//     }
//   }
// }*/
// 
// export function EventListener(data?: { eventName?: string, direction?: EVENT_DIRECTIONS }) {
//   return function (
//     _target: any,
//     propertyKey: string,
//     _descriptor: PropertyDescriptor
//   ) {
//     const eventName: string = (DEFAULT_DECORATORS[propertyKey] || data?.eventName)!;
//     const direction: EVENT_DIRECTIONS = data?.direction || EVENT_DIRECTIONS.CLIENT_TO_SERVER;
// 
//     if (eventName?.length) {
//       if (!eventListeners.has(_target.constructor)) {
//         eventListeners.set(_target.constructor, []);
//       }
// 
//       if (!eventListeners.get(_target.constructor)!.some(([func, _name, _dir]) => func === propertyKey)) {
//         eventListeners.get(_target.constructor)!.push([propertyKey, eventName, direction]);
//       }
//     } else {
//       console.error(`${propertyKey} is not recognized as a default event, thus this listener won't work. Please use the eventName property inside the data parameter.`);
//     }
//   };
// }
// 
// export function Export() {
//   return function (
//     _target: any,
//     propertyKey: string,
//     _descriptor: PropertyDescriptor
//   ) {
//     if (!exportRegisterers.has(_target.constructor)) {
//       exportRegisterers.set(_target.constructor, []);
//     }
// 
//     if (!exportRegisterers.get(_target.constructor)!.some((_propertyKey: string) => _propertyKey === propertyKey)) {
//       exportRegisterers.get(_target.constructor)!.push(propertyKey);
//     }
//   }
// }
// 
// export function Command(data?: { isKeyBinding?: boolean, adminLevelRequired?: number, suffix?: string }) {
//   return function (
//     _target: any,
//     propertyKey: string,
//     _descriptor: PropertyDescriptor
//   ) {
//     if (!commandRegisterers.has(_target.constructor)) {
//       commandRegisterers.set(_target.constructor, []);
//     }
// 
//     if (!commandRegisterers.get(_target.constructor)!.some(([_propertyKey, _data]: [string, number]) => _propertyKey === propertyKey)) {
//       commandRegisterers.get(_target.constructor)!.push([propertyKey, data || {}]);
//     }
//   }
// }
// 
// export interface FiveMControllerOptions {
//   translationFile: { [key: string]: { [key: string]: string } };
// }
// 

import { EVENT_DIRECTIONS } from "./event.directions";
import { DEFAULT_DECORATORS } from "./decorators.defaults";

export function EventListener(data?: { eventName?: string, direction?: EVENT_DIRECTIONS }) {
    return function(target: any, propertyKey: string) {
        const eventName: string = (DEFAULT_DECORATORS[propertyKey] || data?.eventName)!;
        const direction: EVENT_DIRECTIONS = data?.direction || EVENT_DIRECTIONS.CLIENT_TO_SERVER;

        Reflect.defineMetadata(`eventListener_${propertyKey}`, { eventName, direction }, target, propertyKey);
    };
}

export function Command(data?: { isKeyBinding?: boolean, adminLevelRequired?: number, suffix?: string }) {
    return function(target: any, propertyKey: string) {
        Reflect.defineMetadata(`command_${propertyKey}`, data, target/*, propertyKey*/);
    }
}

export function Export() {
    return function(target: any, propertyKey: string) {
        Reflect.defineMetadata(`export_${propertyKey}`, propertyKey, target, propertyKey);
    }
}

export function FiveMController(data?: any) {
    return function(target: any) {
        // Reflect.defineMetadata(`export_${propertyKey}`, propertyKey, target, propertyKey);
    }
}
