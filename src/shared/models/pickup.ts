export interface Pickup {
  id: number;
  zoneId: number;
  position: [number, number, number];
  pickupHash: number;
  modelHash?: number;
  rotating: boolean;
  destroyOnCollect: boolean;
  rearmRadius: number;
  value: number;
}

export interface PickupOptions {
  rotating?: boolean;
  destroyOnCollect?: boolean;
  modelHash?: string | number;
  rearmRadius?: number;
  value?: number;
}
