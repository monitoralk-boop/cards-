import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const bansTable = pgTable(
  "bans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    issuedByUserId: uuid("issued_by_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    index("bans_user_created_at_idx").on(table.userId, table.createdAt),
    index("bans_expiration_idx").on(table.expiresAt),
    check(
      "bans_expiration_after_creation",
      sql`${table.expiresAt} IS NULL OR ${table.expiresAt} > ${table.createdAt}`,
    ),
  ],
);

export const insertBanSchema = createInsertSchema(bansTable).omit({
  id: true,
  createdAt: true,
  revokedAt: true,
});

export type InsertBan = z.infer<typeof insertBanSchema>;
export type Ban = typeof bansTable.$inferSelect;
