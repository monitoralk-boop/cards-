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
import { gamesTable } from "./games";
import { usersTable } from "./users";

export const gameEventsTable = pgTable(
  "game_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => gamesTable.id, { onDelete: "cascade" }),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    actorUserId: uuid("actor_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    eventType: text("event_type").notNull(),
    // Server-only audit payload; it may contain information hidden from clients.
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("game_events_game_sequence_uq").on(table.gameId, table.sequence),
    index("game_events_game_created_at_idx").on(table.gameId, table.createdAt),
    check("game_events_sequence_positive", sql`${table.sequence} >= 1`),
  ],
);

export const insertGameEventSchema = createInsertSchema(gameEventsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertGameEvent = z.infer<typeof insertGameEventSchema>;
export type GameEvent = typeof gameEventsTable.$inferSelect;
