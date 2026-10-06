import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { connectionStatusEnum } from "./enums";
import { gamesTable } from "./games";
import { usersTable } from "./users";

export const gamePlayersTable = pgTable(
  "game_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    seat: integer("seat").notNull(),
    teamKey: text("team_key"),
    score: integer("score").notNull().default(0),
    connectionStatus: connectionStatusEnum("connection_status")
      .notNull()
      .default("connected"),
    stats: jsonb("stats").$type<Record<string, unknown>>().notNull().default({}),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    abandonedAt: timestamp("abandoned_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("game_players_game_user_uq").on(table.gameId, table.userId),
    uniqueIndex("game_players_game_seat_uq").on(table.gameId, table.seat),
    index("game_players_user_joined_at_idx").on(table.userId, table.joinedAt),
    check("game_players_seat_nonnegative", sql`${table.seat} >= 0`),
  ],
);

export const insertGamePlayerSchema = createInsertSchema(gamePlayersTable).omit({
  id: true,
  joinedAt: true,
});

export type InsertGamePlayer = z.infer<typeof insertGamePlayerSchema>;
export type GamePlayer = typeof gamePlayersTable.$inferSelect;
