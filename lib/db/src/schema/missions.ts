import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  bigint,
  boolean,
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
import { gameTypeEnum, missionCadenceEnum } from "./enums";
import { usersTable } from "./users";

export const missionsTable = pgTable(
  "missions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    code: text("code").notNull(),
    titleKey: text("title_key").notNull(),
    descriptionKey: text("description_key").notNull(),
    cadence: missionCadenceEnum("cadence").notNull(),
    gameType: gameTypeEnum("game_type"),
    objective: jsonb("objective")
      .$type<Record<string, unknown>>()
      .notNull(),
    rewardCoins: bigint("reward_coins", { mode: "number" }).notNull(),
    enabled: boolean("enabled").notNull().default(true),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("missions_code_uq").on(table.code),
    index("missions_enabled_cadence_idx").on(table.enabled, table.cadence),
    check("missions_reward_nonnegative", sql`${table.rewardCoins} >= 0`),
    check(
      "missions_time_range_valid",
      sql`${table.endsAt} IS NULL OR ${table.startsAt} IS NULL OR ${table.endsAt} > ${table.startsAt}`,
    ),
  ],
);

export const insertMissionSchema = createInsertSchema(missionsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertMission = z.infer<typeof insertMissionSchema>;
export type Mission = typeof missionsTable.$inferSelect;
