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
import { adRewardStatusEnum } from "./enums";
import { usersTable } from "./users";

export const adRewardsTable = pgTable(
  "ad_rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    provider: text("provider").notNull(),
    providerTransactionId: text("provider_transaction_id").notNull(),
    rewardCoins: bigint("reward_coins", { mode: "number" }).notNull(),
    status: adRewardStatusEnum("status").notNull().default("pending"),
    verificationMetadata: jsonb("verification_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("ad_rewards_provider_transaction_uq").on(
      table.provider,
      table.providerTransactionId,
    ),
    index("ad_rewards_user_created_at_idx").on(table.userId, table.createdAt),
    check("ad_rewards_amount_positive", sql`${table.rewardCoins} > 0`),
  ],
);

export const insertAdRewardSchema = createInsertSchema(adRewardsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertAdReward = z.infer<typeof insertAdRewardSchema>;
export type AdReward = typeof adRewardsTable.$inferSelect;
