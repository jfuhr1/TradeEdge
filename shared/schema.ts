import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, json, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Payment status enum
export const paymentStatusEnum = pgEnum('payment_status_enum', [
  'succeeded',
  'pending',
  'failed',
  'refunded',
  'canceled'
]);

// Discount Reason enumeration
export const discountReasons = [
  "friends_family",
  "team_member",
  "podcast_promotion",
  "early_adopter",
  "special_event",
  "loyalty_reward",
  "referral",
  "other"
] as const;

// Coupon model for site-wide discounts
export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercentage: integer("discount_percentage").notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  description: text("description"),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  maxUses: integer("max_uses"),
  currentUses: integer("current_uses").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").notNull(), // Admin user ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// User discount model for admin-assigned discounts
export const userDiscounts = pgTable("user_discounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  discountPercentage: integer("discount_percentage").notNull(),
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }),
  reason: text("reason").notNull(), // One of discountReasons
  notes: text("notes"),
  validFrom: timestamp("valid_from").notNull().defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: integer("created_by").notNull(), // Admin user ID
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Coupon usage tracking
export const couponUsage = pgTable("coupon_usage", {
  id: serial("id").primaryKey(),
  couponId: integer("coupon_id").notNull(),
  userId: integer("user_id").notNull(),
  usedAt: timestamp("used_at").notNull().defaultNow(),
  orderAmount: decimal("order_amount", { precision: 10, scale: 2 }).notNull(),
  discountApplied: decimal("discount_applied", { precision: 10, scale: 2 }).notNull(),
});

// User model with membership tier
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  tier: text("tier").notNull().default("free"), // 'free', 'paid', 'premium', 'mentorship', 'employee'
  initialTier: text("initial_tier"), // Tier at signup
  tierChanges: json("tier_changes").default([]), // Array of tier change history objects {date, from, to, type}
  lastTierChangeDate: timestamp("last_tier_change_date"), // Date of the most recent tier change
  lastTierChangeReason: text("last_tier_change_reason"), // Reason for last tier change (upgrade, downgrade, etc.)
  profilePicture: text("profile_picture"),
  completedLessons: json("completed_lessons").default([]),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"), 
  lastBillingDate: timestamp("last_billing_date"),
  lastBillingAmount: decimal("last_billing_amount", { precision: 10, scale: 2 }),
  nextBillingDate: timestamp("next_billing_date"),
  nextBillingAmount: decimal("next_billing_amount", { precision: 10, scale: 2 }),
  totalLifetimeSpend: decimal("total_lifetime_spend", { precision: 10, scale: 2 }).default("0"),
  appliedCouponId: integer("applied_coupon_id"), // Reference to coupon used during signup
  activeDiscountId: integer("active_discount_id"), // Reference to active user discount
  isAdmin: boolean("is_admin").default(false),
  adminRoles: json("admin_roles").default([]), // Array of roles: ['super_admin', 'content_admin', 'alerts_admin', 'education_admin', 'coaching_admin']
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
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
  
  // New fields for target reasoning
  target1Reasoning: text("target1_reasoning"),
  target2Reasoning: text("target2_reasoning"),
  target3Reasoning: text("target3_reasoning"),
  
  stopLoss: doublePrecision("stop_loss"),
  sector: text("sector"),
  industry: text("industry"),
  
  // Main narrative and risk assessment
  narrative: text("narrative"), // Overall investment thesis
  risks: text("risks"), // Potential risks or concerns
  
  // Chart images - separate fields for daily and weekly charts
  dailyChartImageUrl: text("daily_chart_image_url"),
  weeklyChartImageUrl: text("weekly_chart_image_url"),
  mainChartType: text("main_chart_type").default("daily"), // "daily" or "weekly" - which chart to show as main
  
  // Technical and fundamental analysis
  technicalReasons: json("technical_reasons").notNull(),
  fundamentalReasons: json("fundamental_reasons").default([]),
  
  // Tags for categorization
  tags: json("tags").default([]), // Array of string tags
  
  // Confluences - key supporting factors
  confluences: json("confluences").default([]), // Array of confluence factors
  
  riskRating: integer("risk_rating"), // 1-5 scale
  timeFrame: text("time_frame"), // short, medium, long term
  potentialReturns: json("potential_returns").default([]), // array of {target, percentage} objects
  requiredTier: text("required_tier").default("free"), // The minimum membership tier required to see this alert
  status: text("status").notNull().default("active"), // active, closed, cancelled
  maxPrice: doublePrecision("max_price"), // To track the highest price reached
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
  tier: text("tier").notNull(), // 'free', 'paid', 'premium'
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

// Group coaching sessions
export const groupCoachingSessions = pgTable("group_coaching_sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  coach: text("coach").notNull(),
  date: timestamp("date").notNull(),
  time: text("time").notNull(), // e.g., "7:00 PM - 8:30 PM ET"
  participants: integer("participants").notNull().default(0),
  maxParticipants: integer("max_participants").notNull(),
  price: doublePrecision("price").notNull(),
  description: text("description"),
  zoomLink: text("zoom_link"),
  status: text("status").notNull().default("scheduled"), // 'scheduled', 'completed', 'cancelled'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGroupCoachingSessionSchema = createInsertSchema(groupCoachingSessions).omit({
  id: true,
  createdAt: true,
});

// Group session registrations
export const groupSessionRegistrations = pgTable("group_session_registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: integer("session_id").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentIntentId: text("payment_intent_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Payment transactions - minimal record keeping for analytics
export const paymentTransactions = pgTable("payment_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stripeCustomerId: text("stripe_customer_id").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("usd"),
  paymentStatus: paymentStatusEnum("payment_status").notNull(),
  paymentType: text("payment_type").notNull(), // 'subscription', 'coaching', 'group_session', 'one_time'
  planTier: text("plan_tier"), // 'paid', 'premium', 'mentorship'
  couponId: integer("coupon_id"),
  discountId: integer("discount_id"),
  description: text("description"),
  billingPeriodStart: timestamp("billing_period_start"),
  billingPeriodEnd: timestamp("billing_period_end"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
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

// Insert schemas for discount-related models
export const insertCouponSchema = createInsertSchema(coupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  currentUses: true,
});

export const insertUserDiscountSchema = createInsertSchema(userDiscounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCouponUsageSchema = createInsertSchema(couponUsage).omit({
  id: true,
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = z.infer<typeof insertStockAlertSchema>;

export type PortfolioItem = typeof portfolioItems.$inferSelect;

export type Coupon = typeof coupons.$inferSelect;
export type InsertCoupon = z.infer<typeof insertCouponSchema>;

export type UserDiscount = typeof userDiscounts.$inferSelect;
export type InsertUserDiscount = z.infer<typeof insertUserDiscountSchema>;

export type CouponUsage = typeof couponUsage.$inferSelect;
export type InsertCouponUsage = z.infer<typeof insertCouponUsageSchema>;
export type InsertPortfolioItem = z.infer<typeof insertPortfolioItemSchema>;

export type EducationContent = typeof educationContent.$inferSelect;
export type InsertEducationContent = z.infer<typeof insertEducationContentSchema>;

export type CoachingSession = typeof coachingSessions.$inferSelect;
export type InsertCoachingSession = z.infer<typeof insertCoachingSessionSchema>;

export type GroupCoachingSession = typeof groupCoachingSessions.$inferSelect;
export type InsertGroupCoachingSession = z.infer<typeof insertGroupCoachingSessionSchema>;

export type GroupSessionRegistration = typeof groupSessionRegistrations.$inferSelect;

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
  
  // Target Alerts
  target1: json("target1").notNull().default({
    web: true,
    email: false,
    sms: false
  }),
  target2: json("target2").notNull().default({
    web: true,
    email: false,
    sms: false
  }),
  target3: json("target3").notNull().default({
    web: true,
    email: false,
    sms: false
  }),
  customTarget: json("custom_target").notNull().default({
    percent: null,
    web: false,
    email: false,
    sms: false
  }),
  
  // Buy Zone Alerts
  buyZoneLow: json("buy_zone_low").notNull().default({
    web: true,
    email: false,
    sms: false
  }),
  buyZoneHigh: json("buy_zone_high").notNull().default({
    web: true,
    email: false,
    sms: false
  }),
  buyLimit: json("buy_limit").notNull().default({
    price: null,
    web: false,
    email: false,
    sms: false
  }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAlertPreferenceSchema = createInsertSchema(alertPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Achievement badges schema - predefined badges that users can earn
export const achievementBadges = pgTable("achievement_badges", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'portfolio', 'education', 'alerts', etc.
  imageUrl: text("image_url").notNull(),
  level: integer("level").notNull().default(1), // For multi-level badges
  requiredCount: integer("required_count").notNull(), // Count needed to unlock
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAchievementBadgeSchema = createInsertSchema(achievementBadges).omit({
  id: true,
  createdAt: true,
});

// User achievement progress to track progress toward badges
export const userAchievementProgress = pgTable("user_achievement_progress", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  currentCount: integer("current_count").notNull().default(0),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserAchievementProgressSchema = createInsertSchema(userAchievementProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Success cards for social media sharing
export const successCards = pgTable("success_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  stockAlertId: integer("stock_alert_id").notNull(),
  percentGained: doublePrecision("percent_gained").notNull(),
  daysToTarget: integer("days_to_target").notNull(),
  targetHit: integer("target_hit").notNull(), // 1, 2, or 3
  dateCreated: timestamp("date_created").notNull().defaultNow(),
  imageUrl: text("image_url"),
  shared: boolean("shared").notNull().default(false),
  sharedPlatform: text("shared_platform"),
});

export const insertSuccessCardSchema = createInsertSchema(successCards).omit({
  id: true,
  dateCreated: true,
});

export type AlertPreference = typeof alertPreferences.$inferSelect;
export type InsertAlertPreference = z.infer<typeof insertAlertPreferenceSchema>;

export type AchievementBadge = typeof achievementBadges.$inferSelect;
export type InsertAchievementBadge = z.infer<typeof insertAchievementBadgeSchema>;

export type UserAchievementProgress = typeof userAchievementProgress.$inferSelect;
export type InsertUserAchievementProgress = z.infer<typeof insertUserAchievementProgressSchema>;

export type SuccessCard = typeof successCards.$inferSelect;
export type InsertSuccessCard = z.infer<typeof insertSuccessCardSchema>;

// User Notifications
export const userNotifications = pgTable("user_notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  category: text("category").notNull(), // 'stock_alert', 'target_approach', 'education', 'article'
  title: text("title").notNull(),
  message: text("message").notNull(),
  linkUrl: text("link_url").notNull(), // URL to navigate to when clicked
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  relatedId: integer("related_id"), // ID of the related item (stock_alert_id, education_id, etc.)
  icon: text("icon"), // Icon name or URL
  important: boolean("important").notNull().default(false),
});

export const insertUserNotificationSchema = createInsertSchema(userNotifications).omit({
  id: true,
  createdAt: true
});

export type UserNotification = typeof userNotifications.$inferSelect;
export type InsertUserNotification = z.infer<typeof insertUserNotificationSchema>;

// Payment Transaction schema and types
export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});

export type PaymentTransaction = typeof paymentTransactions.$inferSelect;
export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;

// Admin Permission Model
export const adminPermissions = pgTable("admin_permissions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  
  // Permission areas
  canManageUsers: boolean("can_manage_users").notNull().default(false),
  canManageAdmins: boolean("can_manage_admins").notNull().default(false),
  
  // Alert permissions
  canCreateAlerts: boolean("can_create_alerts").notNull().default(false),
  canEditAlerts: boolean("can_edit_alerts").notNull().default(false),
  canDeleteAlerts: boolean("can_delete_alerts").notNull().default(false),
  
  // Content permissions
  canCreateEducation: boolean("can_create_education").notNull().default(false),
  canEditEducation: boolean("can_edit_education").notNull().default(false),
  canDeleteEducation: boolean("can_delete_education").notNull().default(false),
  
  // Article permissions
  canCreateArticles: boolean("can_create_articles").notNull().default(false),
  canEditArticles: boolean("can_edit_articles").notNull().default(false),
  canDeleteArticles: boolean("can_delete_articles").notNull().default(false),
  
  // Coaching permissions
  canManageCoaching: boolean("can_manage_coaching").notNull().default(false),
  canManageGroupSessions: boolean("can_manage_group_sessions").notNull().default(false),
  canScheduleSessions: boolean("can_schedule_sessions").notNull().default(false),
  canViewSessionDetails: boolean("can_view_session_details").notNull().default(false),
  
  // Analytics permissions
  canViewAnalytics: boolean("can_view_analytics").notNull().default(false),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminPermissionSchema = createInsertSchema(adminPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AdminPermission = typeof adminPermissions.$inferSelect;
export type InsertAdminPermission = z.infer<typeof insertAdminPermissionSchema>;
