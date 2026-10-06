import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { connectionStatusEnum } from "./enums";
import { roomsTable } from "./rooms";
import { usersTable } from "./users";

export const roomPlayersTable = pgTable(
  "room_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => roomsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    seat: integer("seat").notNull(),
    isReady: boolean("is_ready").notNull().default(false),
    connectionStatus: connectionStatusEnum("connection_status")
      .notNull()
      .default("connected"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    leftAt: timestamp("left_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("room_players_room_user_uq").on(table.roomId, table.userId),
    uniqueIndex("room_players_room_seat_uq").on(table.roomId, table.seat),
    index("room_players_user_status_idx").on(table.userId, table.connectionStatus),
    check("room_players_seat_nonnegative", sql`${table.seat} >= 0`),
  ],
);

export const insertRoomPlayerSchema = createInsertSchema(roomPlayersTable).omit({
  id: true,
  joinedAt: true,
});

export type InsertRoomPlayer = z.infer<typeof insertRoomPlayerSchema>;
export type RoomPlayer = typeof roomPlayersTable.$inferSelect;
