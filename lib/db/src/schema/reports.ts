import { createInsertSchema } from "drizzle-zod";
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { reportStatusEnum } from "./enums";
import { gamesTable } from "./games";
import { roomsTable } from "./rooms";
import { usersTable } from "./users";

export const reportsTable = pgTable(
  "reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterUserId: uuid("reporter_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    targetUserId: uuid("target_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "restrict" }),
    roomId: uuid("room_id").references(() => roomsTable.id, {
      onDelete: "set null",
    }),
    gameId: uuid("game_id").references(() => gamesTable.id, {
      onDelete: "set null",
    }),
    category: varchar("category", { length: 40 }).notNull(),
    description: text("description"),
    status: reportStatusEnum("status").notNull().default("open"),
    reviewMetadata: jsonb("review_metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("reports_status_created_at_idx").on(table.status, table.createdAt),
    index("reports_target_created_at_idx").on(
      table.targetUserId,
      table.createdAt,
    ),
    index("reports_reporter_created_at_idx").on(
      table.reporterUserId,
      table.createdAt,
    ),
  ],
);

export const insertReportSchema = createInsertSchema(reportsTable).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reportsTable.$inferSelect;
