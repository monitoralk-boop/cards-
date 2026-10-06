import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  bigint,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { walletTransactionTypeEnum } from "./enums";
import { usersTable } from "./users";

export const walletTransactionsTable = pgTable(
  "wallet_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    type: walletTransactionTypeEnum("type").notNull(),
    // Signed integer coins; every ledger row records the exact balance transition.
    amount: bigint("amount", { mode: "number" }).notNull(),
    balanceBefore: bigint("balance_before", { mode: "number" }).notNull(),
    balanceAfter: bigint("balance_after", { mode: "number" }).notNull(),
    referenceId: text("reference_id"),
    idempotencyKey: text("idempotency_key").notNull(),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("wallet_transactions_idempotency_key_uq").on(table.idempotencyKey),
    index("wallet_transactions_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    index("wallet_transactions_reference_id_idx").on(table.referenceId),
    check(
      "wallet_transactions_balance_transition",
      sql`${table.balanceBefore} + ${table.amount} = ${table.balanceAfter}`,
    ),
    check("wallet_transactions_balance_after_nonnegative", sql`${table.balanceAfter} >= 0`),
    check("wallet_transactions_amount_nonzero", sql`${table.amount} <> 0`),
  ],
);

export const insertWalletTransactionSchema = createInsertSchema(
  walletTransactionsTable,
).omit({
  id: true,
  createdAt: true,
});

export type InsertWalletTransaction = z.infer<
  typeof insertWalletTransactionSchema
>;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
