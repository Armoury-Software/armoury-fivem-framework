import { Injectable, Provider } from 'injection-js';
import { MySqlTable } from 'drizzle-orm/mysql-core';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { createPool } from 'mysql2/promise';

@Injectable()
export class Database {

  private _rootResource?: string;
  private _db?: MySql2Database;

  private readonly _tables = new Map<string, MySqlTable>();

  public constructor() {
    console.log(`[DB:] Database service initialized! (this resource: ${Cfx.Server.GetCurrentResourceName()})`);
  }

  public registerTable<T extends MySqlTable>(
    identifier: string,
    table: T
  ): T {
    if (this._tables.has(identifier)) {
      throw new Error(`Table '${identifier}' is already registered.`);
    }

    this._tables.set(identifier, table);

    return table;
  }

  public getTable<T extends MySqlTable>(
    identifier: string
  ): T {
    const table = this._tables.get(identifier);

    if (!table) {
      throw new Error(`Table '${identifier}' is not registered.`);
    }

    return table as T;
  }

  public getClient(): MySql2Database {
    if (!this._db) {
      throw new Error('Database is not yet initialized');
    }

    return this._db;
  }

  public setClient(db: MySql2Database, rootResource: string): void {
    if (this._db) {
      throw new Error('Database client is already set.');
    }

    this._db = db;
    this._rootResource = rootResource;
  }

  public isRoot(): boolean {
    return Cfx.Server.GetCurrentResourceName() === this._rootResource;
  }

  public static forRoot(): Provider {
    return ({
      provide: Database,
      useFactory: () => {
        const rootResource = Cfx.Server.GetCurrentResourceName();

        const settings = Cfx.Server.GetConvar('mysql_connection_string', '')
          .split(';')
          .filter(Boolean)
          .reduce<Record<string, string>>((settings, entry) => {
            const index = entry.indexOf('=');

            if (index !== -1) {
              settings[entry.slice(0, index)] = entry.slice(index + 1);
            }

            return settings;
          }, {});

        const pool = createPool({
          host: settings.host || 'localhost',
          port: !isNaN(Number(settings.port)) ? Number(settings.port) : 3306,
          user: settings.user || 'root',
          password: settings.password,
          database: settings.database || 'test',
        });

        console.log(`[DB:] Creating Drizzle instance... (rootResource: ${rootResource})`);
        const drizzl = drizzle({ client: pool });
        console.log(`[DB:] Drizzle instance created! (rootResource: ${rootResource})`);

        const db = new Database();
        db.setClient(drizzl, Cfx.Server.GetCurrentResourceName());

        return db;
      },
      deps: [],
    });
  }

  public static forChild(): Provider {
    return ({
      provide: Database,
      useFactory: () => {
        const db = new Database();
        // TODO: Set client based on main resource here
        // db.setClient(drizzl, Cfx.Server.GetCurrentResourceName());

        return db;
      },
      deps: [],
    });
  }

}
