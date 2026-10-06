import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { gameTypeEnum } from "./enums";
import { usersTable } from "./users";

export const playerStatisticsTable = pgTable(
  "player_statistics",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    gameType: gameTypeEnum("game_type").notNull(),
    gamesPlayed: integer("games_played").notNull().default(0),
    wins: integer("wins").notNull().default(0),
    losses: integer("losses").notNull().default(0),
    // Game-specific counters (e.g. Chkobbas) are maintained by the server.
    details: jsonb("details").$type<Record<string, number>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("player_statistics_user_game_uq").on(table.userId, table.gameType),
    index("player_statistics_game_wins_idx").on(
      table.gameType,
      table.wins,
      table.gamesPlayed,
    ),
    check("player_statistics_games_nonnegative", sql`${table.gamesPlayed} >= 0`),
    check("player_statistics_wins_nonnegative", sql`${table.wins} >= 0`),
    check("player_statistics_losses_nonnegative", sql`${table.losses} >= 0`),
  ],
);

export const insertPlayerStatisticsSchema = createInsertSchema(
  playerStatisticsTable,
).omit({
  id: true,
  updatedAt: true,
});

export type InsertPlayerStatistics = z.infer<
  typeof insertPlayerStatisticsSchema
>;
export type PlayerStatistics = typeof playerStatisticsTable.$inferSelect;
