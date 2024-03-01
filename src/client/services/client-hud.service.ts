import { Injectable } from "injection-js";

@Injectable()
export class ClientHudService {
    public addToFeed(feedItemLength: number = 8000, ...texts: string[]): void {
        texts.forEach((text: string, index: number) => {
            setTimeout(
                () => {
                    Cfx.Client.BeginTextCommandThefeedPost('STRING');
                    Cfx.Client.AddTextComponentSubstringPlayerName(text);
                    Cfx.Client.EndTextCommandThefeedPostTicker(false, true);
                },
                index * feedItemLength
            );
        });
    }
}