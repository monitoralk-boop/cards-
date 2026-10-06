import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
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
import { missionsTable } from "./missions";
import { usersTable } from "./users";

export const missionProgressTable = pgTable(
  "mission_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    missionId: uuid("mission_id")
      .notNull()
      .references(() => missionsTable.id, { onDelete: "restrict" }),
    periodStart: date("period_start", { mode: "string" }).notNull(),
    progress: integer("progress").notNull().default(0),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("mission_progress_user_mission_period_uq").on(
      table.userId,
      table.missionId,
      table.periodStart,
    ),
    index("mission_progress_user_claimed_idx").on(
      table.userId,
      table.claimedAt,
    ),
    check("mission_progress_nonnegative", sql`${table.progress} >= 0`),
  ],
);

export const insertMissionProgressSchema = createInsertSchema(
  missionProgressTable,
).omit({
  id: true,
  updatedAt: true,
});

export type InsertMissionProgress = z.infer<
  typeof insertMissionProgressSchema
>;
export type MissionProgress = typeof missionProgressTable.$inferSelect;
