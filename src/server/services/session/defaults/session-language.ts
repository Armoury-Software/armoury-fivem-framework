import { SessionItem, ISessionItem } from "../../../models";

export class SessionLanguage extends SessionItem<string> implements ISessionItem<string> {
    public constructor() {
        super('language', 'en');
    }
}
