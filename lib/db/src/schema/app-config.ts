import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const appConfigTable = pgTable(
  "app_config",
  {
    key: text("key").primaryKey(),
    value: jsonb("value").$type<Record<string, unknown>>().notNull(),
    version: integer("version").notNull().default(1),
    updatedByUserId: uuid("updated_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
    }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("app_config_updated_at_idx").on(table.updatedAt),
    check("app_config_version_positive", sql`${table.version} >= 1`),
  ],
);

export const insertAppConfigSchema = createInsertSchema(appConfigTable).omit({
  updatedAt: true,
});

export type InsertAppConfig = z.infer<typeof insertAppConfigSchema>;
export type AppConfig = typeof appConfigTable.$inferSelect;
