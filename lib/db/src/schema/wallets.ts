import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { bigint, check, pgTable, timestamp, uuid } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const walletsTable = pgTable(
  "wallets",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    // New wallets start at zero. Welcome coins are granted by a configurable,
    // idempotent server transaction rather than a hard-coded database default.
    balance: bigint("balance", { mode: "number" }).notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [check("wallets_balance_nonnegative", sql`${table.balance} >= 0`)],
);

export const insertWalletSchema = createInsertSchema(walletsTable).omit({
  updatedAt: true,
});

export type InsertWallet = z.infer<typeof insertWalletSchema>;
export type Wallet = typeof walletsTable.$inferSelect;
