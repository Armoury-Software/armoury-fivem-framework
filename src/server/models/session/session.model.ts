import { ICharacter } from "../../../shared";

export interface ISession extends Partial<ICharacter> {
    [key: string]: any;
}
