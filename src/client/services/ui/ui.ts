import { Resource, ResourceRef } from '@armoury/fivem-framework-common';

import { Injectable } from 'injection-js';

@Injectable()
export class UI {

  private static armouryRef: ResourceRef;
  
  public constructor(
    @Resource('armoury') armouryRef: ResourceRef,
  ) {
    UI.armouryRef = armouryRef;
  }

  public static sendMessage(message: UIMessage): void {
    if (!isUIMessage(message)) {
      console.error(
        'Couldn\'t send UI message: Message doesn\'t respect a valid format.',
        'Message:', message
      );
      return;
    }

    this.armouryRef.instance.sendUIMessage(message);
  }

}

type UIMessage = {
  type: string;
  [key: string]: unknown;
};

function isUIMessage(value: unknown): value is UIMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    "type" in value &&
    typeof value.type === "string"
  );
}
