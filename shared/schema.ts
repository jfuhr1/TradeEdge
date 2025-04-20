import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model with membership tier
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  tier: text("tier").notNull().default("free"), // 'free', 'standard', 'executive', 'vip', 'all-in'
  profilePicture: text("profile_picture"),
  completedLessons: json("completed_lessons").default([]),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
  tier: true,
});

// Stock Alert Model
export const stockAlerts = pgTable("stock_alerts", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull(),
  companyName: text("company_name").notNull(),
  currentPrice: doublePrecision("current_price").notNull(),
  buyZoneMin: doublePrecision("buy_zone_min").notNull(),
  buyZoneMax: doublePrecision("buy_zone_max").notNull(),
  target1: doublePrecision("target1").notNull(),
  target2: doublePrecision("target2").notNull(),
  target3: doublePrecision("target3").notNull(),
  stopLoss: doublePrecision("stop_loss"),
  sector: text("sector"),
  industry: text("industry"),
  narrative: text("narrative"),
  chartImageUrl: text("chart_image_url"),
  technicalReasons: json("technical_reasons").notNull(),
  fundamentalReasons: json("fundamental_reasons").default([]),
  riskRating: integer("risk_rating"), // 1-5 scale
  timeFrame: text("time_frame"), // short, medium, long term
  potentialReturns: json("potential_returns").default([]), // array of {target, percentage} objects
  status: text("status").notNull().default("active"), // active, closed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertStockAlertSchema = createInsertSchema(stockAlerts).omit({
  id: true,
  createdAt: true,
});

// User Portfolio Model
export const portfolioItems = pgTable("portfolio_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockAlertId: integer("stock_alert_id").notNull(),
  boughtPrice: doublePrecision("bought_price").notNull(),
  quantity: doublePrecision("quantity").notNull(),
  notifyTarget1: boolean("notify_target1").notNull().default(true),
  notifyTarget2: boolean("notify_target2").notNull().default(true),
  notifyTarget3: boolean("notify_target3").notNull().default(true),
  customTargetPercent: doublePrecision("custom_target_percent"),
  sold: boolean("sold").notNull().default(false),
  soldPrice: doublePrecision("sold_price"),
  soldAt: timestamp("sold_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPortfolioItemSchema = createInsertSchema(portfolioItems).omit({
  id: true,
  sold: true,
  soldPrice: true,
  soldAt: true,
  createdAt: true,
});

// Education Content Model
export const educationContent = pgTable("education_content", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // 'course', 'article', 'video'
  contentUrl: text("content_url").notNull(),
  imageUrl: text("image_url").notNull(),
  tier: text("tier").notNull(), // 'free', 'standard', 'executive', 'vip', 'all-in'
  level: text("level").notNull(), // 'beginner', 'intermediate', 'advanced'
  category: text("category").notNull(), // e.g., 'technical-analysis', 'fundamentals', 'risk-management'
  duration: integer("duration"), // in minutes for video content
  glossaryTerms: json("glossary_terms").default([]), // array of {term, definition} objects
  videoBookmarks: json("video_bookmarks").default([]), // array of {time, label} objects for video content
  tags: json("tags").default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEducationContentSchema = createInsertSchema(educationContent).omit({
  id: true,
  createdAt: true,
});

// Coaching Sessions Model
export const coachingSessions = pgTable("coaching_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // 30 or 60 minutes
  topic: text("topic").notNull(), // e.g., 'portfolio-review', 'technical-analysis', 'risk-management'
  notes: text("notes"),
  price: doublePrecision("price").notNull(), // in USD
  paymentStatus: text("payment_status").notNull().default("pending"), // 'pending', 'paid', 'refunded'
  paymentIntentId: text("payment_intent_id"),
  zoomLink: text("zoom_link"),
  calendarEventId: text("calendar_event_id"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'completed', 'cancelled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCoachingSessionSchema = createInsertSchema(coachingSessions).omit({
  id: true,
  createdAt: true,
});

// Technical Reason Options
export const technicalReasons = pgTable("technical_reasons", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export const insertTechnicalReasonSchema = createInsertSchema(technicalReasons).omit({
  id: true,
});

// User Education Progress
export const educationProgress = pgTable("education_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  contentId: integer("content_id").notNull(),
  completed: boolean("completed").notNull().default(false),
  percentComplete: integer("percent_complete").notNull().default(0),
  lastAccessedAt: timestamp("last_accessed_at").notNull().defaultNow(),
  bookmarks: json("bookmarks").default([]), // Array of timestamps or section IDs
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertEducationProgressSchema = createInsertSchema(educationProgress).omit({
  id: true,
  createdAt: true,
});

// User Achievements/Badges
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeName: text("badge_name").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url"),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;

export type PortfolioItem = typeof portfolioItems.$inferSelect;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;

export type EducationContent = typeof educationContent.$inferSelect;
export type InsertEducationContent = z.infer<typeof insertEducationContentSchema>;

export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;

export type TechnicalReason = typeof technicalReasons.$inferSelect;
export type InsertTechnicalReason = z.infer<typeof insertTechnicalReasonSchema>;

export type EducationProgress = typeof educationProgress.$inferSelect;
export type InsertEducationProgress = z.infer<typeof insertEducationProgressSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Alert Preferences Model
export const alertPreferences = pgTable("alert_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockAlertId: integer("stock_alert_id").notNull(),
  targetOne: boolean("target_one").notNull().default(true),
  targetTwo: boolean("target_two").notNull().default(true),
  targetThree: boolean("target_three").notNull().default(true),
  percentChange: integer("percent_change").default(10), // Default 10% change alerts
  customTargetPrice: doublePrecision("custom_target_price"),
  daysHold: integer("days_hold"), // Alert after X days of holding
  emailEnabled: boolean("email_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  textEnabled: boolean("text_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAlertPreferenceSchema = createInsertSchema(alertPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AlertPreference = typeof alertPreferences.$inferSelect;
export type InsertAlertPreference = z.infer<typeof insertAlertPreferenceSchema>;
