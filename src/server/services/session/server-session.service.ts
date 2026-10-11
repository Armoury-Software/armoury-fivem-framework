import { Injectable } from 'injection-js';

import { Database } from '../../database/database';
import { AccountsTable } from '../../database/schemas/accounts.table';

@Injectable()
export class ServerSessionService {
  
  public constructor(
    private readonly _database: Database,
  ) {
    if (_database.isRoot()) {
      this._database.registerTable(
        'accounts',
        AccountsTable
      );

      console.log('[ServerSessionService] Registered accounts table in the database.');
    } else {
      console.log('[ServerSessionService] Not the root resource, skipping table registration.');
    }
  }

}
