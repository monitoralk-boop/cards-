import { createInsertSchema } from "drizzle-zod";
import {
  bigint,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { purchaseProviderEnum, purchaseStatusEnum } from "./enums";
import { usersTable } from "./users";

export const purchasesTable = pgTable(
  "purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    provider: purchaseProviderEnum("provider").notNull(),
    providerTransactionId: text("provider_transaction_id").notNull(),
    // Store a digest for deduplication; never persist the raw purchase token.
    purchaseTokenHash: text("purchase_token_hash"),
    productId: text("product_id").notNull(),
    coinsGranted: bigint("coins_granted", { mode: "number" }).notNull(),
    status: purchaseStatusEnum("status").notNull().default("pending"),
    verificationMetadata: jsonb("verification_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("purchases_provider_transaction_uq").on(
      table.provider,
      table.providerTransactionId,
    ),
    uniqueIndex("purchases_token_hash_uq").on(table.purchaseTokenHash),
    index("purchases_user_created_at_idx").on(table.userId, table.createdAt),
    index("purchases_status_created_at_idx").on(table.status, table.createdAt),
  ],
);

export const insertPurchaseSchema = createInsertSchema(purchasesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;
export type Purchase = typeof purchasesTable.$inferSelect;
