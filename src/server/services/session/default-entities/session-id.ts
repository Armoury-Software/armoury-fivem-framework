import { SessionItem, ISessionItem } from "../../../models";

export class SessionId extends SessionItem<number> implements ISessionItem<number> {
    public constructor() {
        super('id', 0);
    }
}
