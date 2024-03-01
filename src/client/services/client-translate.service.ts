import { Inject, Injectable } from "injection-js";
import { ClientSessionService } from "./client-session.service";

@Injectable()
export class ClientTranslateService {
    private _language: string | null = null;
    public get language(): string {
        if (!this._language) {
            this._language = <string> this._session.getPlayerInfo('language');
        }

        return this._language;
    }

    public constructor(
        @Inject('translations') private readonly _translations: { [key: string]: { [key: string]: string } },
        @Inject(ClientSessionService) private readonly _session: ClientSessionService,
    ) { }

    public instant(key: string): string {
        return this._translations[this.language]?.[key] || key;
    }
}
