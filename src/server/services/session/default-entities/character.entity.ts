import { Entity, PrimaryKey, Property } from '@mikro-orm/core';

@Entity()
export class Character {
    @PrimaryKey()
    public id!: bigint;

    @Property()
    public accountId!: bigint;

    @Property()
    public name!: string;
}
