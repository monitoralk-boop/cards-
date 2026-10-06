// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

export * from "./enums";
export * from "./users";
export * from "./profiles";
export * from "./wallets";
export * from "./wallet-transactions";
export * from "./rooms";
export * from "./room-players";
export * from "./games";
export * from "./game-players";
export * from "./game-rounds";
export * from "./game-events";
export * from "./friends";
export * from "./friend-requests";
export * from "./daily-rewards";
export * from "./missions";
export * from "./mission-progress";
export * from "./purchases";
export * from "./ad-rewards";
export * from "./player-statistics";
export * from "./leaderboards";
export * from "./chat-messages";
export * from "./reports";
export * from "./bans";
export * from "./notifications";
export * from "./admin-users";
export * from "./admin-audit-logs";
export * from "./app-config";