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
  tier: text("tier").notNull().default("free"),
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
  technicalReasons: json("technical_reasons").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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
  type: text("type").notNull(), // 'course', 'article'
  contentUrl: text("content_url").notNull(),
  imageUrl: text("image_url").notNull(),
  tier: text("tier").notNull(), // 'free', 'premium'
  level: text("level").notNull(), // 'beginner', 'intermediate', 'advanced'
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
