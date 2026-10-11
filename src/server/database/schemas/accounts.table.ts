import { mysqlTable, int, varchar } from 'drizzle-orm/mysql-core';

export const AccountsTable = mysqlTable('accounts', {
  id: int('id').primaryKey().autoincrement(),
  platformId: varchar('platformId', { length: 64 }).notNull(),
  lastKnownName: varchar('lastKnownName', { length: 255 }).notNull(),
});
