import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { friendRequestStatusEnum } from "./enums";
import { usersTable } from "./users";

export const friendRequestsTable = pgTable(
  "friend_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requesterUserId: uuid("requester_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    recipientUserId: uuid("recipient_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    status: friendRequestStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("friend_requests_pending_pair_uq")
      .on(table.requesterUserId, table.recipientUserId)
      .where(sql`${table.status} = 'pending'`),
    index("friend_requests_recipient_status_idx").on(
      table.recipientUserId,
      table.status,
      table.createdAt,
    ),
    check(
      "friend_requests_distinct_users",
      sql`${table.requesterUserId} <> ${table.recipientUserId}`,
    ),
  ],
);

export const insertFriendRequestSchema = createInsertSchema(
  friendRequestsTable,
).omit({
  id: true,
  createdAt: true,
  respondedAt: true,
});

export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type FriendRequest = typeof friendRequestsTable.$inferSelect;
