import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { gameTypeEnum, roomStatusEnum } from "./enums";
import { usersTable } from "./users";

export const roomsTable = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomCode: varchar("room_code", { length: 6 }).notNull(),
    hostUserId: uuid("host_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    gameType: gameTypeEnum("game_type").notNull(),
    status: roomStatusEnum("status").notNull().default("waiting"),
    playerLimit: integer("player_limit").notNull(),
    entryFee: bigint("entry_fee", { mode: "number" }).notNull().default(0),
    isFriendly: boolean("is_friendly").notNull().default(true),
    // Contains versioned rule settings only; never contains hidden game state.
    settings: jsonb("settings")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    // Optional private-room credential is stored only as a server-side hash.
    passwordHash: text("password_hash"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("rooms_room_code_uq").on(table.roomCode),
    index("rooms_matchmaking_idx").on(
      table.gameType,
      table.status,
      table.isFriendly,
      table.entryFee,
      table.createdAt,
    ),
    index("rooms_host_status_idx").on(table.hostUserId, table.status),
    check("rooms_code_six_chars", sql`char_length(${table.roomCode}) = 6`),
    check("rooms_player_limit_valid", sql`${table.playerLimit} BETWEEN 2 AND 4`),
    check("rooms_entry_fee_nonnegative", sql`${table.entryFee} >= 0`),
    check(
      "rooms_friendly_no_entry_fee",
      sql`NOT ${table.isFriendly} OR ${table.entryFee} = 0`,
    ),
  ],
);

export const insertRoomSchema = createInsertSchema(roomsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
