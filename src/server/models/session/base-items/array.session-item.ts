import { ISessionItem, SessionItem } from "../session-item.model";

export abstract class ArraySessionItem<T> extends SessionItem<Array<T>> implements ISessionItem<Array<T>> {
    public constructor(
        name: string,
        value: Array<T>,
        critical: boolean = false,
        public readonly tableName: string,
        public readonly syncedProperties: ISqlProperty[],
    ) {
        super(name, value, critical);

        if (!this.syncedProperties.length) {
            this.syncedProperties.push({ name: 'value', type: 'varchar(256)' });
        }

        this.syncedProperties = [
            ...DEFAULT_PROPERTIES,
            ...syncedProperties
        ];

        this.setup();
    }

    public async load(accountId: number, characterId: number): Promise<Array<T>> {
        return await Cfx.exports['oxmysql'].query_async(
            `SELECT * FROM ${this.tableName} WHERE id=? AND accountId=?`,
            [characterId, accountId]
        );
    }

    public async save(accountId: number, characterId: number, value: Array<T>): Promise<void> {
        const columns = this.syncedProperties.map((prop) => prop.name).join(',');
        const keys = value.map(() => `(${new Array(columns.length).fill(0).map(() => '?').join(', ')})`).join(', ');
        const values = new Array(value.length).fill(0).map((_, valueIndex) => this.syncedProperties.map(
            (prop) => {
                if (prop.name === 'accountId') {
                    return accountId;
                }

                if (prop.name === 'characterId') {
                    return characterId;
                }

                return value[valueIndex][prop.name];
            }))
            .flat()
            ;

        await Cfx.exports['oxmysql'].query_async(
            `DELETE FROM \`${this.tableName}\` WHERE accountId = ? AND characterId = ?`,
            [accountId, characterId]
        );

        await Cfx.exports['oxmysql'].insert_async(
            `INSERT INTO \`${this.tableName}\` (${columns}) VALUES ${keys}`,
            values
        );
    }

    private async setup(): Promise<void> {
        const database = Cfx.Server.GetConvar('mysql_connection_string', '').split(';')
            .find((item) => item.startsWith('database='))
            ?.split('=').slice(-1)[0];

        const result = await Cfx.exports['oxmysql'].single_async(
            `SELECT EXISTS (
                SELECT 1
                FROM information_schema.tables 
                WHERE table_schema = '${database}' 
                AND table_name = '${this.tableName}'
            ) AS table_exists;`
        );

        if (!result.table_exists) {
            // TODO: Create table
        } else {
            // TODO: Do migrations
        }
    }
}

const DEFAULT_PROPERTIES = [
    { name: 'accountId', type: 'int(11)' },
    { name: 'characterId', type: 'int(11)' },
];

export interface ISqlProperty {
    name: string;
    type: string;
}
