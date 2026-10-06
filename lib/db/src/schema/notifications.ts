import { createInsertSchema } from "drizzle-zod";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    titleKey: text("title_key").notNull(),
    bodyKey: text("body_key"),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    index("notifications_user_created_at_idx").on(table.userId, table.createdAt),
    index("notifications_user_unread_idx").on(table.userId, table.readAt),
  ],
);

export const insertNotificationSchema = createInsertSchema(
  notificationsTable,
).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notificationsTable.$inferSelect;
