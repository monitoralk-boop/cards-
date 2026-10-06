import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const adminUsersTable = pgTable("admin_users", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "restrict" }),
  role: varchar("role", { length: 32 }).notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertAdminUserSchema = createInsertSchema(adminUsersTable).omit({
  createdAt: true,
});

export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
export type AdminUser = typeof adminUsersTable.$inferSelect;
