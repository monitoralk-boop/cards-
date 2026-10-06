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
import { usersTable } from "./users";

export const friendsTable = pgTable(
  "friends",
  {
    // Store each friendship once, with the lower UUID in userAId.
    userAId: uuid("user_a_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    userBId: uuid("user_b_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("friends_pair_uq").on(table.userAId, table.userBId),
    index("friends_user_b_idx").on(table.userBId),
    check("friends_distinct_users", sql`${table.userAId} < ${table.userBId}`),
  ],
);

export const insertFriendSchema = createInsertSchema(friendsTable).omit({
  createdAt: true,
});

export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friendsTable.$inferSelect;
