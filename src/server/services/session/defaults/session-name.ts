import { SessionItem, ISessionItem } from "../../../models";

export class SessionName extends SessionItem<string> implements ISessionItem<string> {
    public constructor() {
        super('name', '');
    }
}
