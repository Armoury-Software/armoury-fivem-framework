import { Inject, Injectable } from "injection-js";
import { EventListener } from "../../decorators";

@Injectable()
export class ServerTranslateService {
    private playersMappedToLanguages: Map<number, string> = new Map();

    public constructor(
        @Inject('translations') private readonly _translations: { [key: string]: { [key: string]: string } }
    ) { }

    public instant(forPlayer: number, key: string): string {
        const language: string = this.getLanguage(forPlayer);

        return this._translations[language]?.[key] || key;
    }

    @EventListener()
    public onPlayerDisconnect(): void {
        const player = Cfx.source;
        if (this.playersMappedToLanguages.has(player)) {
            this.playersMappedToLanguages.delete(player);
        }
    }

    public getLanguage(forPlayer: number): string {
        if (this.playersMappedToLanguages.has(forPlayer)) {
            return this.playersMappedToLanguages.get(forPlayer)!;
        }

        const language = Cfx.exports['authentication'].getPlayerInfo(forPlayer, 'language');
        this.playersMappedToLanguages.set(forPlayer, language);

        return language;
    }
}
