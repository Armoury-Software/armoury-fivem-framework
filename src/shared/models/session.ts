import { SessionClaimType } from './session-claim';

export interface Session {
  /**
   * The session ID, which always matches the server ID of a
   * player.
   */
  readonly id: number;

  /**
   * The platform identifier for this player. Most often, this
   * will be the FiveM identifier for a player.
   */
  readonly platformId: string;

  /**
   * The name this player has most recently used when logging in.
   * NEVER trust this value - it can change with every reconnect.
   */
  readonly lastKnownName: string;

  /**
   * The principal of a session. Most often, this will be the
   * account ID of that player.
   */
  principal?: number;
}

export class Session {
  
  public constructor(
    public readonly id: number,
    public readonly platformId: string,
    public readonly lastKnownName: string,
    public principal?: number,
  ) { }

  /**
   * Gets the public state of a player.
   * 
   * @param stateItemName the name of the state item to update.
   * @returns the value from the state, or null if not found.
   */
  public getState<T>(stateItemName: string): T | null {
    return (Cfx.Player(this.id).state[`session:${stateItemName}:value`] as T) ?? null;
  }

  /**
   * Updates the state of a player.
   * 
   * **`⚠️ Warning:`** If your intention is to save data which should NOT be accessible to the
   * client, please use `setServerClaim` instead.
   * 
   * ---
   * 
   * In a client script, this will always be the replicated value set by the server.
   * In a server script, this will update the state for that player.
   * 
   * @param stateItemName the name of the state item to update.
   * @param value the value to set to the state.
   * @param replicate whether to replicate this value. This will always be false in a client script.
   * @returns the value which has been set.
   */
  public setState<T extends Primitive>(stateItemName: string, value: T, replicate?: boolean): T | null {
    Cfx.Player(this.id).state.set(`session:${stateItemName}:value`, value, replicate ?? Cfx.Server.IsDuplicityVersion());
    return value;
  }

  /**
   * Gets the state of the player, where the state is data NOT accessible to the client.
   * 
   * @param claimName the name of the claim/state item to get.
   * @returns the value from the state, or null if not found.
   */
  public getServerClaimValue<T>(claimName: string): T | null {
    if (!Cfx.Server.IsDuplicityVersion()) {
      console.error('Claims are not currently available in client scripts.');
      return null;
    }

    const claimValue = Cfx.Player(this.id).state[`session:${claimName}:value`];
    if (claimValue == null) {
      return null;
    }

    const kind = Cfx.Player(this.id).state[`session:${claimName}:kind`] ?? SessionClaimType.Direct;

    if (kind === SessionClaimType.Proxied) {
      const proxiedValue = this.getProxiedServerClaimValue<T>(claimName);
      Cfx.Player(this.id).state.set(`session:${claimName}:value`, proxiedValue, false);
      return proxiedValue;
    }

    return this.getState<T>(claimName);
  }

  /**
   * Gets proxied state of a player. This is usually state which doesn't hold
   * primitive data types (for example, an `item`).
   * 
   * @param claim the claim object to proxy for.
   * @returns the value from the proxied state, or null if not found or impossible.
   */
  private getProxiedServerClaimValue<T>(claimName: string): T | null {
    if (!Cfx.Server.IsDuplicityVersion()) {
      console.error('Proxied claims are not currently available in client scripts.');
      return null;
    }

    const resource = Cfx.GlobalState[`session:${claimName}:proxy`];
    if (!resource) {
      console.error(
        `There was no proxied claim registered for claim with name ${claimName}, `
        + 'returning null.'
      );

      return null;
    }

    return (
      (globalThis.exports[resource] as { getProxiedClaimValue<T>(claimName: string, sessionId: number): T | null })
        ?.getProxiedClaimValue<T>(claimName, this.id) as T
    ) ?? null;
  }

  /**
   * Updates the state of the player, but doesn't replicate the value to the client.
   * Useful when you want to have data NOT accessible to the client, on the server.
   * 
   * @param claimName the name of the claim/state item to update.
   * @returns the updated value, or null if not found or impossible to update.
   */
  public setServerClaim<T extends Primitive>(claimName: string, value: T): T | null {
    if (!Cfx.Server.IsDuplicityVersion()) {
      console.error('Claims are not currently available in client scripts.');
      return null;
    }

    const proxy = Cfx.GlobalState[`session:${claimName}:proxy`];
    if (proxy != null) {
      console.error(
        `Attempting to set value of server claim ${claimName}, but there's a proxy registered `
        + 'for it. Returning null, and doing nothing.'
      );
      return null;
    }

    this.setState(claimName, value, false);
    return value;
  }

  public static from(session: Session): Session {
    if ((session as object) instanceof Session) {
      return session;
    }

    return new Session(
      session.id,
      session.platformId,
      session.lastKnownName,
      session.principal
    );
  }

}

type Primitive = string | number | boolean | bigint | symbol | null | undefined;
