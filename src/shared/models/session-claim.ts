export interface SessionDirectClaim<TVal = unknown> {
  $kind: SessionClaimType.Direct;
  cachedValue: TVal;
}

export interface SessionProxiedClaim {
  $kind: SessionClaimType.Proxied;
  resource: string;
}

export type SessionClaim<TVal = unknown> =
  | SessionDirectClaim<TVal>
  | SessionProxiedClaim;

export enum SessionClaimType {
  Direct = 0, Proxied
}
