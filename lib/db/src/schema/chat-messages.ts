import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { gamesTable } from "./games";
import { roomsTable } from "./rooms";
import { usersTable } from "./users";

export const chatMessagesTable = pgTable(
  "chat_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => roomsTable.id, { onDelete: "cascade" }),
    gameId: uuid("game_id").references(() => gamesTable.id, {
      onDelete: "set null",
    }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    messageType: varchar("message_type", { length: 16 }).notNull(),
    body: text("body").notNull(),
    moderation: jsonb("moderation")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    index("chat_messages_room_created_at_idx").on(table.roomId, table.createdAt),
    index("chat_messages_sender_created_at_idx").on(
      table.senderUserId,
      table.createdAt,
    ),
    check("chat_messages_type_valid", sql`${table.messageType} IN ('quick', 'emoji', 'text')`),
    check("chat_messages_body_length", sql`char_length(${table.body}) BETWEEN 1 AND 500`),
  ],
);

export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({
  id: true,
  createdAt: true,
  deletedAt: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
