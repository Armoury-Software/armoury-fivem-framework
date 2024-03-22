import { SessionItem, ISessionItem } from "../../../models";

export class SessionAccountId extends SessionItem<number> implements ISessionItem<number> {
    public constructor() {
        super('accountId', 0);
    }
}
