import { SessionItem, ISessionItem } from "../../../models";

export class SessionCash extends SessionItem<number> implements ISessionItem<number> {
    public constructor() {
        super('cash', 0, true);
    }
}
