import { pgEnum } from "drizzle-orm/pg-core";

export const accountStatusEnum = pgEnum("account_status", [
  "active",
  "suspended",
  "deleted",
]);

export const gameTypeEnum = pgEnum("game_type", ["chkobba", "rami"]);

export const roomStatusEnum = pgEnum("room_status", [
  "waiting",
  "ready",
  "in_progress",
  "finished",
  "cancelled",
  "expired",
]);

export const gameStatusEnum = pgEnum("game_status", [
  "active",
  "completed",
  "abandoned",
]);

export const connectionStatusEnum = pgEnum("connection_status", [
  "connected",
  "disconnected",
  "abandoned",
]);

export const walletTransactionTypeEnum = pgEnum("wallet_transaction_type", [
  "welcome_bonus",
  "daily_reward",
  "mission_reward",
  "game_entry",
  "game_win",
  "game_refund",
  "rewarded_ad",
  "purchase",
  "referral",
  "admin_adjustment",
  "cosmetic_purchase",
]);

export const friendRequestStatusEnum = pgEnum("friend_request_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

export const missionCadenceEnum = pgEnum("mission_cadence", [
  "daily",
  "weekly",
]);

export const purchaseProviderEnum = pgEnum("purchase_provider", [
  "google_play",
  "apple",
]);

export const purchaseStatusEnum = pgEnum("purchase_status", [
  "pending",
  "verified",
  "rejected",
  "refunded",
  "cancelled",
]);

export const adRewardStatusEnum = pgEnum("ad_reward_status", [
  "pending",
  "verified",
  "rejected",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "open",
  "reviewing",
  "resolved",
  "dismissed",
]);

export const leaderboardPeriodEnum = pgEnum("leaderboard_period", [
  "all_time",
  "weekly",
]);

export const leaderboardCategoryEnum = pgEnum("leaderboard_category", [
  "wins",
  "chkobba_wins",
  "rami_wins",
  "xp",
  "games_played",
]);
