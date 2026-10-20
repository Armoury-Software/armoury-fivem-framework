import { Resource, ResourceRef, Session } from '@armoury/fivem-framework-common';
import { Injectable } from 'injection-js';

@Injectable()
export class SessionService {

  public constructor(
    @Resource('armoury') private readonly armouryResource: ResourceRef,
  ) {}

  public getNumPlayersConnected(): number {
    return this.armouryResource.instance.getNumPlayersConnected();
  }

  public getAllPlayerIds(): number[] {
    return this.armouryResource.instance.getAllPlayerIds();
  }

  public getAllPlayerPrincipals(): number[] {
    return this.armouryResource.instance.getAllPlayerPrincipals();
  }

  public isPlayerConnected(playerId: number): boolean {
    return this.armouryResource.instance.isPlayerConnected(playerId);
  }

  public getSessionByPlayerId(playerId: number): Session {
    return Session.from(
      this.armouryResource.instance.getSessionByPlayerId(playerId)
    );
  }

  public getSessionByPrincipal(principal: number): Session {
    return Session.from(
      this.armouryResource.instance.getSessionByPrincipal(principal)
    );
  }

  public setPlayerPrincipal(playerId: number, principal: number): void {
    this.armouryResource.instance.setPlayerPrincipal(playerId, principal);
  }

}
