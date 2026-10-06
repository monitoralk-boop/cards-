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
import { gamesTable } from "./games";

export const gameRoundsTable = pgTable(
  "game_rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesTable.id, { onDelete: "cascade" }),
    roundNumber: integer("round_number").notNull(),
    state: jsonb("state").$type<Record<string, unknown>>().notNull().default({}),
    result: jsonb("result").$type<Record<string, unknown>>(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("game_rounds_game_round_uq").on(table.gameId, table.roundNumber),
    index("game_rounds_started_at_idx").on(table.startedAt),
    check("game_rounds_round_positive", sql`${table.roundNumber} >= 1`),
  ],
);

export const insertGameRoundSchema = createInsertSchema(gameRoundsTable).omit({
  id: true,
  startedAt: true,
});

export type InsertGameRound = z.infer<typeof insertGameRoundSchema>;
export type GameRound = typeof gameRoundsTable.$inferSelect;
