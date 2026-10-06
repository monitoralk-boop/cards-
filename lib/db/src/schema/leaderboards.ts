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
import { leaderboardCategoryEnum, leaderboardPeriodEnum } from "./enums";
import { usersTable } from "./users";

export const leaderboardsTable = pgTable(
  "leaderboards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    category: leaderboardCategoryEnum("category").notNull(),
    period: leaderboardPeriodEnum("period").notNull(),
    periodStart: date("period_start", { mode: "string" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    score: bigint("score", { mode: "number" }).notNull(),
    rank: integer("rank"),
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("leaderboards_all_time_user_uq")
      .on(table.category, table.userId)
      .where(sql`${table.period} = 'all_time'`),
    uniqueIndex("leaderboards_weekly_user_start_uq")
      .on(table.category, table.userId, table.periodStart)
      .where(sql`${table.period} = 'weekly'`),
    index("leaderboards_ranked_idx").on(
      table.category,
      table.period,
      table.periodStart,
      table.rank,
    ),
    check("leaderboards_rank_positive", sql`${table.rank} IS NULL OR ${table.rank} >= 1`),
    check(
      "leaderboards_period_start_consistent",
      sql`(${table.period} = 'all_time' AND ${table.periodStart} IS NULL) OR (${table.period} = 'weekly' AND ${table.periodStart} IS NOT NULL)`,
    ),
  ],
);

export const insertLeaderboardSchema = createInsertSchema(leaderboardsTable).omit({
  id: true,
  calculatedAt: true,
});

export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type Leaderboard = typeof leaderboardsTable.$inferSelect;
