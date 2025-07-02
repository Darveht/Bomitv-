import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionTier: varchar("subscription_tier").default("free"), // free, monthly, annual
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const series = pgTable("series", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  posterUrl: varchar("poster_url", { length: 500 }),
  coverUrl: varchar("cover_url", { length: 500 }),
  genre: varchar("genre", { length: 100 }),
  country: varchar("country", { length: 100 }),
  language: varchar("language", { length: 50 }),
  year: integer("year"),
  rating: decimal("rating", { precision: 3, scale: 1 }),
  totalEpisodes: integer("total_episodes"),
  status: varchar("status", { length: 50 }).default("ongoing"), // ongoing, completed
  subscriptionRequired: varchar("subscription_required").default("free"), // free, vip
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const episodes = pgTable("episodes", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id").references(() => series.id),
  episodeNumber: integer("episode_number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  thumbnailUrl: varchar("thumbnail_url", { length: 500 }),
  videoUrl: varchar("video_url", { length: 500 }),
  duration: integer("duration"), // in minutes
  subscriptionRequired: varchar("subscription_required").default("free"),
  releasedAt: timestamp("released_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const watchHistory = pgTable("watch_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  episodeId: integer("episode_id").references(() => episodes.id),
  seriesId: integer("series_id").references(() => series.id),
  watchedAt: timestamp("watched_at").defaultNow(),
  progressPercentage: integer("progress_percentage").default(0),
  completed: boolean("completed").default(false),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id),
  seriesId: integer("series_id").references(() => series.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const seriesRelations = relations(series, ({ many }) => ({
  episodes: many(episodes),
  watchHistory: many(watchHistory),
  favorites: many(favorites),
}));

export const episodesRelations = relations(episodes, ({ one, many }) => ({
  series: one(series, {
    fields: [episodes.seriesId],
    references: [series.id],
  }),
  watchHistory: many(watchHistory),
}));

export const usersRelations = relations(users, ({ many }) => ({
  watchHistory: many(watchHistory),
  favorites: many(favorites),
}));

export const watchHistoryRelations = relations(watchHistory, ({ one }) => ({
  user: one(users, {
    fields: [watchHistory.userId],
    references: [users.id],
  }),
  episode: one(episodes, {
    fields: [watchHistory.episodeId],
    references: [episodes.id],
  }),
  series: one(series, {
    fields: [watchHistory.seriesId],
    references: [series.id],
  }),
}));

export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  series: one(series, {
    fields: [favorites.seriesId],
    references: [series.id],
  }),
}));

// Insert schemas
export const insertSeriesSchema = createInsertSchema(series).omit({
  id: true,
  createdAt: true,
});

export const insertEpisodeSchema = createInsertSchema(episodes).omit({
  id: true,
  createdAt: true,
});

export const insertWatchHistorySchema = createInsertSchema(watchHistory).omit({
  id: true,
  watchedAt: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Series = typeof series.$inferSelect;
export type InsertSeries = z.infer<typeof insertSeriesSchema>;
export type Episode = typeof episodes.$inferSelect;
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type WatchHistory = typeof watchHistory.$inferSelect;
export type InsertWatchHistory = z.infer<typeof insertWatchHistorySchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
