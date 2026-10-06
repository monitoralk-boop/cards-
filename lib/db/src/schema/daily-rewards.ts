import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  bigint,
  check,
  date,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const dailyRewardsTable = pgTable(
  "daily_rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    rewardDate: date("reward_date", { mode: "string" }).notNull(),
    cycleDay: integer("cycle_day").notNull(),
    coinAmount: bigint("coin_amount", { mode: "number" }).notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("daily_rewards_user_date_uq").on(table.userId, table.rewardDate),
    index("daily_rewards_claimed_at_idx").on(table.claimedAt),
    check("daily_rewards_cycle_day_valid", sql`${table.cycleDay} BETWEEN 1 AND 7`),
    check("daily_rewards_amount_positive", sql`${table.coinAmount} > 0`),
  ],
);

export const insertDailyRewardSchema = createInsertSchema(dailyRewardsTable).omit({
  id: true,
  claimedAt: true,
});

export type InsertDailyReward = z.infer<typeof insertDailyRewardSchema>;
export type DailyReward = typeof dailyRewardsTable.$inferSelect;
