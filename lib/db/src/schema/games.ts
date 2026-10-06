import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  bigint,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { gameStatusEnum, gameTypeEnum } from "./enums";
import { roomsTable } from "./rooms";
import { usersTable } from "./users";

export const gamesTable = pgTable(
  "games",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => roomsTable.id, { onDelete: "restrict" }),
    gameType: gameTypeEnum("game_type").notNull(),
    status: gameStatusEnum("status").notNull().default("active"),
    currentPlayerId: uuid("current_player_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    currentRound: integer("current_round").notNull().default(1),
    stateVersion: bigint("state_version", { mode: "number" }).notNull().default(0),
    // Server-only: includes private hands, deck order, and authoritative state.
    serverState: jsonb("server_state")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    // Public projection is still serialized per recipient before it is sent.
    publicState: jsonb("public_state")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    turnDeadline: timestamp("turn_deadline", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("games_room_created_at_idx").on(table.roomId, table.createdAt),
    index("games_status_deadline_idx").on(table.status, table.turnDeadline),
    check("games_round_positive", sql`${table.currentRound} >= 1`),
    check("games_state_version_nonnegative", sql`${table.stateVersion} >= 0`),
  ],
);

export const insertGameSchema = createInsertSchema(gamesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof gamesTable.$inferSelect;
