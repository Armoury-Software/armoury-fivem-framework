import { PickupOptions, Resource, ResourceRef } from '@armoury/fivem-framework-common';
import { Injectable } from 'injection-js';

@Injectable()
export class PickupService {

  public constructor(
    @Resource('armoury') private readonly armouryResource: ResourceRef,
  ) {}

  public create(position: [number, number, number], pickupHash: string | number, options: PickupOptions = {}): number {
    return this.armouryResource.instance.create(position, pickupHash, options);
  }

  public remove(id: number): void {
    return this.armouryResource.instance.remove(id);
  }

}
