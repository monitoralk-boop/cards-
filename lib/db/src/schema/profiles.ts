import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const profilesTable = pgTable(
  "profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    username: varchar("username", { length: 15 }).notNull(),
    usernameNormalized: varchar("username_normalized", { length: 15 }).notNull(),
    avatarKey: text("avatar_key"),
    countryCode: varchar("country_code", { length: 2 }),
    governorate: varchar("governorate", { length: 80 }),
    language: varchar("language", { length: 5 }).notNull().default("fr"),
    xp: integer("xp").notNull().default(0),
    level: integer("level").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("profiles_username_normalized_uq").on(table.usernameNormalized),
    index("profiles_xp_level_idx").on(table.xp, table.level),
    check(
      "profiles_username_length",
      sql`char_length(${table.username}) BETWEEN 3 AND 15`,
    ),
    check("profiles_xp_nonnegative", sql`${table.xp} >= 0`),
    check("profiles_level_positive", sql`${table.level} >= 1`),
  ],
);

export const insertProfileSchema = createInsertSchema(profilesTable).omit({
  createdAt: true,
  updatedAt: true,
});

export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profilesTable.$inferSelect;
