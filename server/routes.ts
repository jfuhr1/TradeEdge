import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { 
  insertStockAlertSchema, 
  insertPortfolioItemSchema, 
  insertCoachingSessionSchema,
  insertAlertPreferenceSchema,
  insertSuccessCardSchema,
  insertUserNotificationSchema,
  insertCouponSchema,
  insertUserDiscountSchema,
  insertCouponUsageSchema,
  discountReasons
} from "@shared/schema";

// Create mock stock alerts array to avoid reference errors after server restarts
global.MOCK_STOCK_ALERTS = [];

const scryptAsync = promisify(scrypt);

// Function to create sample notifications for demo purposes
async function createSampleNotifications() {
  const demoUserId = 1; // Default user ID
  
  // Check if we already have notifications
  const existingNotifications = await storage.getUserNotifications(demoUserId);
  if (existingNotifications.length > 0) {
    return; // Skip if we already have notifications
  }
  
  // Create sample notifications
  await storage.createNotification({
    userId: demoUserId,
    category: 'stock_alert',
    title: 'New Stock Alert: NVDA',
    message: 'A new alert for NVIDIA has been added with target price of $995.',
    linkUrl: '/stock-detail/6',
    read: false,
    relatedId: 6,
    icon: 'trending-up',
    important: true
  });
  
  await storage.createNotification({
    userId: demoUserId,
    category: 'target_approach',
    title: 'MSFT approaching Target 1',
    message: 'Microsoft is within 5% of reaching Target 1 ($430).',
    linkUrl: '/stock-detail/3',
    read: true,
    relatedId: 3,
    icon: 'target',
    important: false
  });
  
  await storage.createNotification({
    userId: demoUserId,
    category: 'education',
    title: 'New Educational Content',
    message: 'Check out our new video: "Understanding Price Action"',
    linkUrl: '/education',
    read: false,
    relatedId: null,
    icon: 'book-open',
    important: false
  });
  
  await storage.createNotification({
    userId: demoUserId,
    category: 'article',
    title: 'Market Analysis',
    message: 'Weekly market overview and sector analysis is now available.',
    linkUrl: '/success-center',
    read: false,
    relatedId: null,
    icon: 'newspaper',
    important: false
  });
  
  await storage.createNotification({
    userId: demoUserId,
    category: 'stock_alert',
    title: 'META has reached Target 1',
    message: 'Meta Platforms has hit Target 1 ($490). Consider adjusting stop loss.',
    linkUrl: '/stock-detail/7',
    read: true,
    relatedId: 7,
    icon: 'check-circle',
    important: true
  });
}

// Function to create admin user
async function createAdminUser() {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByUsername("PortfolioConsultant");
    
    if (existingUser) {
      console.log("Admin user already exists.");
      
      // Update user to admin if not already
      if (!existingUser.isAdmin) {
        await storage.updateUser(existingUser.id, {
          isAdmin: true,
          adminRoles: ["super_admin"]
        });
        console.log("User updated to admin successfully");
      }
      
      // Check if admin permissions exist
      const existingPermissions = await storage.getAdminPermissions(existingUser.id);
      
      if (!existingPermissions) {
        // Create admin permissions with full access
        await storage.createAdminPermissions({
          userId: existingUser.id,
          canManageUsers: true,
          canManageAdmins: true,
          canCreateAlerts: true,
          canEditAlerts: true,
          canDeleteAlerts: true,
          canCreateEducation: true,
          canEditEducation: true,
          canDeleteEducation: true,
          canCreateArticles: true,
          canEditArticles: true,
          canDeleteArticles: true,
          canManageCoaching: true,
          canManageGroupSessions: true,
          canScheduleSessions: true,
          canViewSessionDetails: true,
          canViewAnalytics: true
        });
        console.log("Admin permissions created successfully");
      }
      
      return existingUser;
    } else {
      // Create new admin user
      console.log("Creating new admin user...");
      
      // Hash password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync("Jordan26!", salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      const newUser = await storage.createUser({
        username: "PortfolioConsultant",
        email: "josh.fuhr@bisontrading.co",
        firstName: "Josh",
        lastName: "Fuhr",
        password: hashedPassword,
        tier: "premium",
        isAdmin: true,
        adminRoles: ["super_admin"]
      });
      
      console.log("New admin user created successfully");
      
      // Create admin permissions
      await storage.createAdminPermissions({
        userId: newUser.id,
        canManageUsers: true,
        canManageAdmins: true,
        canCreateAlerts: true,
        canEditAlerts: true,
        canDeleteAlerts: true,
        canCreateEducation: true,
        canEditEducation: true,
        canDeleteEducation: true,
        canCreateArticles: true,
        canEditArticles: true,
        canDeleteArticles: true,
        canManageCoaching: true,
        canManageGroupSessions: true,
        canScheduleSessions: true,
        canViewSessionDetails: true,
        canViewAnalytics: true
      });
      
      console.log("Admin permissions created successfully");
      
      return newUser;
    }
  } catch (error) {
    console.error("Error creating admin user:", error);
    throw error;
  }
}

// Function to create sample test users at different tiers
async function createSampleUsers() {
  try {
    const users = [
      {
        username: "freemember",
        email: "free@example.com",
        firstName: "Free",
        lastName: "Member",
        password: "Password123!",
        tier: "free",
        phone: "555-123-4567",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
      },
      {
        username: "paiduser",
        email: "paid@example.com",
        firstName: "Paid",
        lastName: "Subscriber",
        password: "Password123!",
        tier: "paid",
        phone: "555-234-5678",
        profilePicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        totalSpent: "59.98"
      },
      {
        username: "premiumuser",
        email: "premium@example.com",
        firstName: "Premium",
        lastName: "Customer",
        password: "Password123!",
        tier: "premium",
        phone: "555-345-6789",
        profilePicture: "https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        lastPaymentDate: new Date(),
        nextPaymentDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        totalSpent: "999.00"
      },
      {
        username: "mentorshipclient",
        email: "mentorship@example.com",
        firstName: "Mentorship",
        lastName: "Client",
        password: "Password123!",
        tier: "mentorship",
        phone: "555-456-7890",
        profilePicture: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        lastPaymentDate: new Date(),
        totalSpent: "5000.00"
      },
      {
        username: "contentadmin",
        email: "content@example.com",
        firstName: "Content",
        lastName: "Administrator",
        password: "Password123!",
        tier: "employee",
        phone: "555-567-8901",
        profilePicture: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
        isAdmin: true,
        adminRoles: ["content_admin", "alerts_admin"]
      }
    ];

    for (const userData of users) {
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        console.log(`User ${userData.username} already exists.`);
        continue;
      }

      // Hash password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(userData.password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      // Create the user
      const userToCreate = {
        ...userData,
        password: hashedPassword
      };

      const newUser = await storage.createUser(userToCreate);
      console.log(`Created test user: ${userData.username}`);

      // If this is an admin user, add permissions
      if (userData.isAdmin) {
        await storage.createAdminPermissions({
          userId: newUser.id,
          canManageUsers: false,
          canManageAdmins: false,
          canCreateAlerts: userData.adminRoles.includes("alerts_admin"),
          canEditAlerts: userData.adminRoles.includes("alerts_admin"),
          canDeleteAlerts: userData.adminRoles.includes("alerts_admin"),
          canCreateEducation: userData.adminRoles.includes("content_admin"),
          canEditEducation: userData.adminRoles.includes("content_admin"),
          canDeleteEducation: userData.adminRoles.includes("content_admin"),
          canCreateArticles: userData.adminRoles.includes("content_admin"),
          canEditArticles: userData.adminRoles.includes("content_admin"),
          canDeleteArticles: userData.adminRoles.includes("content_admin"),
          canManageCoaching: userData.adminRoles.includes("coaching_admin"),
          canManageGroupSessions: userData.adminRoles.includes("coaching_admin"),
          canScheduleSessions: userData.adminRoles.includes("coaching_admin"),
          canViewSessionDetails: userData.adminRoles.includes("coaching_admin") || userData.adminRoles.includes("customer_support"),
          canViewAnalytics: userData.adminRoles.includes("analytics_admin")
        });
        console.log(`Created permissions for admin user: ${userData.username}`);
      }
    }

    console.log("Sample users creation complete");
  } catch (error) {
    console.error("Error creating sample users:", error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Create admin user
  await createAdminUser();
  
  // Create sample test users
  await createSampleUsers();
  
  // Initialize sample notifications
  await createSampleNotifications();

  // Stock Alerts API
  app.get("/api/stock-alerts", async (req, res) => {
    try {
      // Get user's membership tier if they're logged in
      let userTier = 'free';
      
      if (req.isAuthenticated()) {
        userTier = req.user.tier || 'free';
      }
      
      // Get alerts filtered by the user's tier or free alerts
      const alerts = await storage.getStockAlerts(userTier);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching stock alerts:", error);
      res.status(500).json({ message: "Failed to fetch stock alerts" });
    }
  });

  app.get("/api/stock-alerts/buy-zone", async (req, res) => {
    try {
      // Get user's membership tier if they're logged in
      let userTier = 'free';
      
      if (req.isAuthenticated()) {
        userTier = req.user.tier || 'free';
      }
      
      const alerts = await storage.getStockAlertsInBuyZone(userTier);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching stock alerts in buy zone:", error);
      res.status(500).json({ message: "Failed to fetch stock alerts in buy zone" });
    }
  });

  app.get("/api/stock-alerts/targets", async (req, res) => {
    try {
      // Get user's membership tier if they're logged in
      let userTier = 'free';
      
      if (req.isAuthenticated()) {
        userTier = req.user.tier || 'free';
      }
      
      const targets = await storage.getStockAlertsNearingTargets(userTier);
      res.json(targets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alerts nearing targets" });
    }
  });

  app.get("/api/stock-alerts/closed", async (req, res) => {
    try {
      // Get user's membership tier if they're logged in
      let userTier = 'free';
      
      if (req.isAuthenticated()) {
        userTier = req.user.tier || 'free';
      }
      
      const closedAlerts = await storage.getClosedStockAlerts(userTier);
      res.json(closedAlerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch closed stock alerts" });
    }
  });
  
  app.get("/api/stock-alerts/high-risk-reward", async (req, res) => {
    try {
      // Get user's membership tier if they're logged in
      let userTier = 'free';
      
      if (req.isAuthenticated()) {
        userTier = req.user.tier || 'free';
      }
      
      const alerts = await storage.getHighRiskRewardStockAlerts(userTier);
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch high risk/reward stock alerts" });
    }
  });
  
  app.get("/api/stock-alerts/hit-targets", async (req, res) => {
    try {
      // Get user's membership tier if they're logged in
      let userTier = 'free';
      
      if (req.isAuthenticated()) {
        userTier = req.user.tier || 'free';
      }
      
      const targets = await storage.getRecentlyHitTargetsStockAlerts(userTier);
      res.json(targets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alerts that hit targets" });
    }
  });
  
  // Technical reasons for stock alerts
  app.get("/api/technical-reasons", (req, res) => {
    // Check if demo mode is enabled via query param
    const isDemoMode = req.query.demo === "true";
    
    if (isDemoMode) {
      const demoTechnicalReasons = [
        { id: 1, name: "Support Level", description: "Price has reached a historical support level" },
        { id: 2, name: "Resistance Breakout", description: "Price has broken through a significant resistance level" },
        { id: 3, name: "Oversold RSI", description: "Relative Strength Index indicates the stock is oversold" },
        { id: 4, name: "Bullish Pattern", description: "Formation of a bullish chart pattern (e.g., cup and handle)" },
        { id: 5, name: "Sector Momentum", description: "The entire sector is showing strong momentum" },
        { id: 6, name: "Volume Increase", description: "Significant increase in trading volume" },
        { id: 7, name: "Earnings Beat", description: "Company has reported better than expected earnings" },
        { id: 8, name: "Analyst Upgrade", description: "Stock has received upgrades from analysts" },
        { id: 9, name: "Dividend Increase", description: "Company has announced an increase in dividends" },
        { id: 10, name: "Institutional Buying", description: "Increased institutional ownership detected" },
        { id: 11, name: "Moving Average Crossover", description: "Bullish moving average crossover has occurred" },
        { id: 12, name: "Revenue Growth", description: "Company shows strong revenue growth" },
        { id: 13, name: "Technical Support", description: "Price finding support at technical levels" },
        { id: 14, name: "AI Integration", description: "Company integrating AI into products or services" },
        { id: 15, name: "Growth Potential", description: "Strong growth potential identified in business model" }
      ];
      return res.json(demoTechnicalReasons);
    } else {
      try {
        // In non-demo mode, fetch from database (would need to be implemented)
        // For now, we'll just return a simpler set
        const technicalReasons = [
          { id: 1, name: "Support Level" },
          { id: 2, name: "Resistance Breakout" },
          { id: 3, name: "Oversold RSI" },
          { id: 4, name: "Bullish Pattern" },
          { id: 5, name: "Sector Momentum" }
        ];
        res.json(technicalReasons);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch technical reasons" });
      }
    }
  });
  
  // Price confluences for stock alerts
  app.get("/api/confluences", (req, res) => {
    const isDemoMode = req.query.demo === "true";
    
    if (isDemoMode) {
      const demoConfluences = [
        // Price-Based Confluences
        { id: 1, category: "Price-Based", name: "Support Zone Strength", description: "The support zone has held firm—buyers are stepping up." },
        { id: 2, category: "Price-Based", name: "Resistance Turned Support", description: "The zone flipped from a ceiling to a floor—buyers are holding strong." },
        { id: 3, category: "Price-Based", name: "Bullish Trend Line Support", description: "A trend line below is propping up the price—bulls are holding the fort." },
        { id: 4, category: "Price-Based", name: "Trendline Break", description: "A break from specific high/low signals a shift—momentum's turning bullish." },
        { id: 5, category: "Price-Based", name: "4-Hour Trend Line Break", description: "Short-term charts show a trend line snap—early bulls are stepping up." },
        
        // Volume-Based Confluences
        { id: 6, category: "Volume-Based", name: "Volume Spike/Volume - Buy at the Lows", description: "Buying volume's picking up—investors are grabbing shares at these lows." },
        { id: 7, category: "Volume-Based", name: "High Volume Node", description: "This support zone is a high volume hotspot—intense buyer interest locks it in." },
        
        // Momentum Indicators
        { id: 8, category: "Momentum", name: "Daily MACD Turning Up", description: "Daily charts show momentum starting to turn bullish—a shift is underway." },
        { id: 9, category: "Momentum", name: "Daily MACD Cross", description: "Daily charts confirm momentum's flipped bullish—the turn is here." },
        { id: 10, category: "Momentum", name: "Daily MACD Divergence", description: "Daily charts show hidden strength—a bounce is brewing." },
        { id: 11, category: "Momentum", name: "Daily RSI Divergence", description: "Daily charts show hidden strength—ready to bounce." },
        { id: 12, category: "Momentum", name: "Daily RSI Oversold", description: "Daily charts signal oversold conditions—undervaluation suggests a rebound." },
        { id: 13, category: "Momentum", name: "Weekly MACD Turning Up", description: "Weekly charts show momentum starting to turn bullish—a shift is underway." },
        { id: 14, category: "Momentum", name: "Weekly MACD Cross", description: "Weekly charts are on the cusp of a bullish signal—momentum's brewing." },
        { id: 15, category: "Momentum", name: "Weekly MACD Divergence", description: "Weekly charts show hidden strength—a bounce is brewing." },
        { id: 16, category: "Momentum", name: "Weekly RSI Divergence", description: "Oversold signals on the weekly chart hint at a rebound—undervaluation's clear." },
        { id: 17, category: "Momentum", name: "Weekly RSI Oversold", description: "Oversold vibes on the weekly chart hint at a rebound—undervaluation's clear." },
        
        // Chart Patterns
        { id: 18, category: "Chart Patterns", name: "Wyckoff Pattern", description: "A textbook Wyckoff setup at support shows accumulation—a breakout's brewing." },
        { id: 19, category: "Chart Patterns", name: "Weinstein Analysis", description: "Stage 1-to-2 transition signals classic growth potential at the bottom." },
        
        // Sentiment and Insider Activity
        { id: 20, category: "Sentiment", name: "Insider Buys", description: "Specific insider activity—insider confidence shines through." },
        { id: 21, category: "Sentiment", name: "Dark Pool Print", description: "Hidden buying activity in dark pools suggests investors are quietly accumulating shares—price suppression may be at play." }
      ];
      return res.json(demoConfluences);
    } else {
      try {
        // Non-demo mode would fetch from database
        const simpleConfluences = [
          { id: 1, category: "Price-Based", name: "Support Zone Strength" },
          { id: 2, category: "Volume-Based", name: "Volume Spike" },
          { id: 3, category: "Momentum", name: "RSI Oversold" }
        ];
        res.json(simpleConfluences);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch confluences" });
      }
    }
  });
  
  // Tags for stock alerts
  app.get("/api/tags", (req, res) => {
    const isDemoMode = req.query.demo === "true";
    
    if (isDemoMode) {
      const demoTags = [
        { id: 1, name: "Fintech", description: "Financial technology companies" },
        { id: 2, name: "Growth Stocks", description: "Companies with above-average growth potential" },
        { id: 3, name: "Crypto Plays", description: "Companies involved in cryptocurrency" },
        { id: 4, name: "Weinstein", description: "Following Weinstein methodology" },
        { id: 5, name: "Biotech", description: "Biotechnology companies" },
        { id: 6, name: "Leveraged Plays", description: "Stocks with leverage potential" },
        { id: 7, name: "Retail", description: "Retail sector companies" },
        { id: 8, name: "Leveraged ETFs", description: "Exchange-traded funds with leverage" },
        { id: 9, name: "Inverse Plays", description: "Stocks for downside positioning" },
        { id: 10, name: "Energy", description: "Energy sector companies" },
        { id: 11, name: "Currency", description: "Currency-related investments" },
        { id: 12, name: "Safe-Haven Plays", description: "Defensive investments" },
        { id: 13, name: "China", description: "China-based investments" },
        { id: 14, name: "Emerging Markets", description: "Investments in emerging economies" }
      ];
      return res.json(demoTags);
    } else {
      try {
        // Non-demo mode
        const simpleTags = [
          { id: 1, name: "Fintech" },
          { id: 2, name: "Growth Stocks" },
          { id: 3, name: "Biotech" }
        ];
        res.json(simpleTags);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch tags" });
      }
    }
  });
  
  // Risk factors for stock alerts
  app.get("/api/risks", (req, res) => {
    const isDemoMode = req.query.demo === "true";
    
    if (isDemoMode) {
      const demoRisks = [
        { id: 1, name: "Earnings Miss", description: "Risk of company missing earnings expectations" },
        { id: 2, name: "Sector Rotation", description: "Risk of money flowing out of this sector" },
        { id: 3, name: "Regulatory Headwinds", description: "Potential negative regulatory changes" },
        { id: 4, name: "Market Volatility", description: "Overall market instability affecting stock" },
        { id: 5, name: "Competition", description: "Increasing competitive pressure" },
        { id: 6, name: "Valuation Concerns", description: "Stock may be overvalued at current levels" },
        { id: 7, name: "Supply Chain Issues", description: "Disruptions in product/service delivery" },
        { id: 8, name: "Macro Economic Risks", description: "Broader economic factors affecting stock" },
        { id: 9, name: "Management Changes", description: "Changes in leadership creating uncertainty" },
        { id: 10, name: "Technical Resistance", description: "Strong technical resistance overhead" }
      ];
      return res.json(demoRisks);
    } else {
      try {
        // Non-demo mode
        const simpleRisks = [
          { id: 1, name: "Earnings Miss" },
          { id: 2, name: "Market Volatility" },
          { id: 3, name: "Technical Resistance" }
        ];
        res.json(simpleRisks);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch risks" });
      }
    }
  });
  
  // Add a new confluence 
  app.post("/api/confluences", async (req, res) => {
    const isDemoMode = req.query.demo === "true";
    
    try {
      const { name, category, description } = req.body;
      
      if (!name || !category) {
        return res.status(400).json({ message: "Name and category are required" });
      }
      
      if (isDemoMode) {
        // In demo mode, just return a mock response
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000) + 100,
          name,
          category,
          description: description || "",
          createdAt: new Date().toISOString()
        });
      } else {
        // In production, we would add to the database here
        // For now, return a mock response
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000) + 100,
          name,
          category,
          description: description || "",
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to add confluence" });
    }
  });
  
  // Add a new tag
  app.post("/api/tags", async (req, res) => {
    const isDemoMode = req.query.demo === "true";
    
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      if (isDemoMode) {
        // In demo mode, just return a mock response
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000) + 100,
          name,
          description: description || "",
          createdAt: new Date().toISOString()
        });
      } else {
        // In production, we would add to the database here
        // For now, return a mock response
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000) + 100,
          name,
          description: description || "",
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to add tag" });
    }
  });
  
  // Add a new risk
  app.post("/api/risks", async (req, res) => {
    const isDemoMode = req.query.demo === "true";
    
    try {
      const { name, description } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }
      
      if (isDemoMode) {
        // In demo mode, just return a mock response
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000) + 100,
          name,
          description: description || "",
          createdAt: new Date().toISOString()
        });
      } else {
        // In production, we would add to the database here
        // For now, return a mock response
        return res.status(201).json({
          id: Math.floor(Math.random() * 1000) + 100,
          name,
          description: description || "",
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to add risk" });
    }
  });

  // PATCH endpoint for updating stock alerts
  app.patch("/api/stock-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Special handling for demo mode
      const isDemoMode = req.query.demo === 'true';
      if (isDemoMode) {
        console.log(`Demo mode stock alert update for ID: ${id}`);
        
        // Initialize the global array if it doesn't exist
        if (!global.DEMO_CREATED_ALERTS) {
          global.DEMO_CREATED_ALERTS = [];
        }
        
        // Check for the alert in our dynamically created alerts first
        let alert = global.DEMO_CREATED_ALERTS.find(a => a.id === id);
        
        // If not found in dynamic alerts, try the mock data
        if (!alert) {
          alert = MOCK_STOCK_ALERTS.find(a => a.id === id);
        }
        
        if (!alert) {
          return res.status(404).json({ message: "Stock alert not found" });
        }
        
        // Update the alert with new data
        const updatedAlert = {
          ...alert,
          ...req.body,
          id: id, // Keep the original ID
          updatedAt: new Date().toISOString()
        };
        
        // Update in the correct storage
        if (global.DEMO_CREATED_ALERTS.find(a => a.id === id)) {
          // If it's in the dynamic alerts, update there
          const alertIndex = global.DEMO_CREATED_ALERTS.findIndex(a => a.id === id);
          if (alertIndex !== -1) {
            global.DEMO_CREATED_ALERTS[alertIndex] = updatedAlert;
            console.log(`Updated dynamic alert with ID ${id} in global storage`);
          }
        } else if (MOCK_STOCK_ALERTS.find(a => a.id === id)) {
          // Otherwise update in mock data
          const alertIndex = MOCK_STOCK_ALERTS.findIndex(a => a.id === id);
          if (alertIndex !== -1) {
            MOCK_STOCK_ALERTS[alertIndex] = updatedAlert;
            console.log(`Updated mock alert with ID ${id}`);
          }
        }
        
        return res.json(updatedAlert);
      }
      
      // Normal behavior (not in demo mode)
      // Only allow authenticated admin users to update stock alerts
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Update the alert in storage
      const updatedAlert = await storage.updateStockAlert(id, req.body);
      if (!updatedAlert) {
        return res.status(404).json({ message: "Stock alert not found" });
      }
      
      res.json(updatedAlert);
    } catch (error) {
      console.error("Error updating stock alert:", error);
      res.status(500).json({ message: "Failed to update stock alert" });
    }
  });

  app.get("/api/stock-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Special handling for demo mode
      const isDemoMode = req.query.demo === 'true';
      // Check for draft recovery mode, which helps recover after server restarts
      const isDraftRecovery = req.query.draftRecovery === 'true';
      // Check if we should force database retrieval (for alerts after server restart)
      const forceDatabase = req.query.forceDatabase === 'true';
      
      if (isDemoMode) {
        console.log(`Demo mode stock alert retrieval for ID: ${id}`);
        
        // If forceDatabase is true, bypass in-memory checks and go straight to database
        if (forceDatabase) {
          console.log(`Force database retrieval requested for alert ID: ${id}`);
          try {
            // Get user's membership tier if they're logged in
            let userTier = 'free';
            if (req.isAuthenticated()) {
              userTier = req.user.tier || 'free';
            }
            
            // Try to retrieve the alert directly from database instead of in-memory storage
            const dbAlert = await storage.getStockAlert(id, userTier);
            if (dbAlert) {
              console.log(`Successfully retrieved alert ID ${id} from database`);
              
              // Add simulated change percent for UI display
              const alertWithChanges = {
                ...dbAlert,
                changePercent: "0.40" // Simple fixed value for demo purposes
              };
              
              return res.json(alertWithChanges);
            } else {
              console.log(`Alert ID ${id} not found in database`);
            }
          } catch (err) {
            console.error(`Database error retrieving alert ID ${id}:`, err);
          }
        }
        
        // For demo mode, first check if this is a dynamically created alert (from POST endpoint)
        // These would be stored in memory in a real implementation
        // We use global variable for demo purposes to simulate database persistence
        if (!global.DEMO_CREATED_ALERTS) {
          global.DEMO_CREATED_ALERTS = [];
        }
        
        // Try to find the alert in our dynamically created alerts first
        let alert = global.DEMO_CREATED_ALERTS.find(a => a.id === id);
        
        // If not found in dynamic alerts, try mock data
        if (!alert) {
          alert = MOCK_STOCK_ALERTS.find(a => a.id === id);
        }
        
        // If the alert isn't in our mocks but it's in draft recovery mode
        if ((!alert && id > 100) || isDraftRecovery) {
          // Create a mock alert for dynamically created alerts in demo mode
          alert = {
            id: isDraftRecovery ? 999 : id, // Use a known ID for draft recovery
            symbol: isDraftRecovery ? "RECOVERED" : "DEMO",
            companyName: isDraftRecovery ? "Recovered Draft Alert" : "Demo Stock Alert",
            currentPrice: 100.00,
            buyZoneMin: 95.00,
            buyZoneMax: 105.00,
            target1: 110.00,
            target2: 120.00,
            target3: 130.00,
            target1Reasoning: "First target reasoning",
            target2Reasoning: "Second target reasoning",
            target3Reasoning: "Third target reasoning",
            lossLevel: 90.00,
            technicalReasons: ["Support Level", "Volume Pattern"],
            dailyChartImageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop",
            weeklyChartImageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop",
            chartImageUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800&auto=format&fit=crop",
            mainChartType: "daily",
            narrative: isDraftRecovery 
              ? "This is a recovered draft alert to replace one that was lost during server restart."
              : "This is a dynamically created demo stock alert.",
            risks: "Market volatility, Stop loss if price drops below buy zone",
            tags: [],
            confluences: [],
            requiredTier: "free",
            status: "active",
            isDraft: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          // For draft recovery, save this alert to our storage
          if (isDraftRecovery) {
            // Store the recovered alert so it persists
            await storage.createStockAlert(alert);
            console.log("Created recovery draft alert with ID:", alert.id);
          }
        }
        
        if (!alert) {
          return res.status(404).json({ 
            message: "Stock alert not found",
            canRecover: true // Flag that indicates we can recover
          });
        }
        
        // For the detail page, we'll inject a random change percentage for demo
        const changePercent = ((Math.random() * 3) - 1).toFixed(2);
        
        return res.json({
          ...alert,
          changePercent
        });
      }
      
      // Normal non-demo behavior
      // Get user's membership tier if they're logged in
      let userTier = 'free';
      
      if (req.isAuthenticated()) {
        userTier = req.user.tier || 'free';
      }
      
      const alert = await storage.getStockAlert(id, userTier);
      if (!alert) {
        return res.status(404).json({ 
          message: "Stock alert not found or access denied",
          canRecover: true // Flag that indicates we can recover
        });
      }
      
      // For the detail page, we'll inject a random change percentage
      const changePercent = ((Math.random() * 3) - 1).toFixed(2);
      
      res.json({
        ...alert,
        changePercent
      });
    } catch (error) {
      console.error("Error fetching stock alert:", error);
      res.status(500).json({ message: "Failed to fetch stock alert" });
    }
  });
  
  // Endpoint to publish a draft stock alert
  app.patch("/api/stock-alerts/:id/publish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Special handling for demo mode
      const isDemoMode = req.query.demo === 'true';
      if (isDemoMode) {
        console.log('Demo mode stock alert publishing granted via query parameter');
        
        // Initialize the global array if it doesn't exist
        if (!global.DEMO_CREATED_ALERTS) {
          global.DEMO_CREATED_ALERTS = [];
        }
        
        // Check for the alert in our dynamically created alerts first
        let alert = global.DEMO_CREATED_ALERTS.find(a => a.id === id);
        
        // If not found in dynamic alerts, try the mock data
        if (!alert) {
          alert = MOCK_STOCK_ALERTS.find(a => a.id === id);
        }
        
        if (!alert) {
          return res.status(404).json({ message: "Stock alert not found" });
        }
        
        // Update the alert (draft concept removed)
        const updatedAlert = {
          ...alert,
          updatedAt: new Date().toISOString()
        };
        
        // Update in the correct storage
        if (global.DEMO_CREATED_ALERTS.find(a => a.id === id)) {
          // If it's in the dynamic alerts, update there
          const alertIndex = global.DEMO_CREATED_ALERTS.findIndex(a => a.id === id);
          if (alertIndex !== -1) {
            global.DEMO_CREATED_ALERTS[alertIndex] = updatedAlert;
            console.log(`Updated dynamic alert with ID ${id} in global storage`);
          }
        } else if (MOCK_STOCK_ALERTS.find(a => a.id === id)) {
          // Otherwise update in mock data
          const alertIndex = MOCK_STOCK_ALERTS.findIndex(a => a.id === id);
          if (alertIndex !== -1) {
            MOCK_STOCK_ALERTS[alertIndex] = updatedAlert;
            console.log(`Updated mock alert with ID ${id}`);
          }
        }
        
        return res.json(updatedAlert);
      }
      
      // Normal behavior (not in demo mode)
      // Only allow authenticated admin users to publish stock alerts
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // We no longer use draft status, just update whatever data was provided
      // Update the alert in storage with whatever data is in the request body
      const updatedAlert = await storage.updateStockAlert(id, req.body);
      if (!updatedAlert) {
        return res.status(404).json({ message: "Stock alert not found" });
      }
      
      res.json(updatedAlert);
    } catch (error) {
      res.status(500).json({ message: "Failed to publish stock alert" });
    }
  });

  app.post("/api/stock-alerts", async (req, res) => {
    try {
      // Special handling for demo mode
      const isDemoMode = req.query.demo === 'true';
      if (isDemoMode) {
        console.log('Demo mode stock alert creation granted via query parameter');
        
        // Validate request data
        const validationResult = insertStockAlertSchema.safeParse(req.body);
        if (!validationResult.success) {
          return res.status(400).json({ 
            message: "Invalid stock alert data", 
            errors: validationResult.error.errors 
          });
        }
        
        // Create a simulated stock alert response for demo mode
        const mockAlert = {
          ...validationResult.data,
          id: Math.floor(Math.random() * 1000) + 100, // random ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        // Store the mock alert in our global array for future retrieval
        if (!global.DEMO_CREATED_ALERTS) {
          global.DEMO_CREATED_ALERTS = [];
        }
        
        // Add to our global storage
        global.DEMO_CREATED_ALERTS.push(mockAlert);
        
        // For better persistence after server restarts, also store in actual database
        await storage.createStockAlert(mockAlert);
        
        console.log(`Stored mock alert with ID ${mockAlert.id} in global storage and database`);
        
        return res.status(201).json(mockAlert);
      }
      
      // Normal behavior (not in demo mode)
      // Only allow authenticated admin users to create stock alerts
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Validate request data
      const validationResult = insertStockAlertSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid stock alert data", 
          errors: validationResult.error.errors 
        });
      }
      
      const newAlert = await storage.createStockAlert(validationResult.data);
      res.status(201).json(newAlert);
    } catch (error) {
      res.status(500).json({ message: "Failed to create stock alert" });
    }
  });

  // Portfolio API
  app.get("/api/portfolio", async (req, res) => {
    try {
      // Get all stock alerts for demo portfolio
      const stockAlerts = await storage.getStockAlerts();
      
      // Create demo portfolio with some stock alerts
      const demoPortfolio = [
        {
          id: 1,
          userId: 999,
          stockAlertId: stockAlerts[0].id,
          quantity: 10,
          boughtPrice: stockAlerts[0].currentPrice * 0.95,
          boughtDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          sold: false,
          soldPrice: null,
          soldDate: null,
          notes: "Strong buy signal",
          stockAlert: stockAlerts[0]
        },
        {
          id: 2,
          userId: 999,
          stockAlertId: stockAlerts[1].id,
          quantity: 5,
          boughtPrice: stockAlerts[1].currentPrice * 0.9,
          boughtDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          sold: false,
          soldPrice: null,
          soldDate: null,
          notes: "Long term hold",
          stockAlert: stockAlerts[1]
        },
        {
          id: 3,
          userId: 999,
          stockAlertId: stockAlerts[2].id,
          quantity: 20,
          boughtPrice: stockAlerts[2].currentPrice * 1.1,
          boughtDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
          sold: true,
          soldPrice: stockAlerts[2].currentPrice * 1.2,
          soldDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          notes: "Sold at target",
          stockAlert: stockAlerts[2]
        }
      ];
      
      res.json(demoPortfolio);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio" });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate request data
      const validationResult = insertPortfolioItemSchema.safeParse({
        ...req.body,
        userId: req.user.id,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid portfolio item data", 
          errors: validationResult.error.errors 
        });
      }
      
      const newItem = await storage.createPortfolioItem(validationResult.data);
      res.status(201).json(newItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to add to portfolio" });
    }
  });

  app.put("/api/portfolio/:id/sell", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { soldPrice } = req.body;
      if (typeof soldPrice !== 'number' || soldPrice <= 0) {
        return res.status(400).json({ message: "Valid sold price is required" });
      }
      
      const updatedItem = await storage.sellPortfolioItem(id, soldPrice);
      if (!updatedItem) {
        return res.status(404).json({ message: "Portfolio item not found" });
      }
      
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to sell portfolio item" });
    }
  });
  
  // Portfolio Stats and Metrics API
  app.get("/api/portfolio/stats", async (req, res) => {
    try {
      // Return demo stats instead of requiring authentication
      // This is for development purposes only
      res.json({
        totalValue: 28550.75,
        totalInvested: 25000,
        totalGainLoss: 3550.75,
        percentGainLoss: 14.2,
        totalPositions: 6,
        activePositions: 4,
        closedPositions: 2,
        totalClosedProfit: 1850.50,
        winRate: 75
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio statistics" });
    }
  });
  
  app.get("/api/portfolio/metrics", async (req, res) => {
    try {
      // Return demo metrics data instead of requiring authentication
      // This is for development purposes only
      res.json({
        totalAlertsBought: 28,
        buyZonePercentage: 65,
        highRiskPercentage: 15,
        aboveBuyZonePercentage: 20,
        monthlyPurchases: [
          { month: "Jan", count: 2 },
          { month: "Feb", count: 4 },
          { month: "Mar", count: 6 },
          { month: "Apr", count: 8 },
          { month: "May", count: 5 },
          { month: "Jun", count: 3 },
        ]
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch portfolio metrics" });
    }
  });

  // Education API
  app.get("/api/education", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        // For unauthenticated users, return only free content
        const freeContent = await storage.getEducationContentByTier('free');
        return res.json(freeContent);
      }
      
      // Return content based on user tier
      const content = await storage.getEducationContentByTier(req.user.tier);
      res.json(content);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch education content" });
    }
  });

  // Coaching API
  app.post("/api/coaching", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Validate the date from the request
      const { date } = req.body;
      if (!date) {
        return res.status(400).json({ message: "Coaching session date is required" });
      }
      
      const sessionData = {
        userId: req.user.id,
        date: new Date(date),
        status: "scheduled",
      };
      
      // Validate request data
      const validationResult = insertCoachingSessionSchema.safeParse(sessionData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid coaching session data", 
          errors: validationResult.error.errors 
        });
      }
      
      const newSession = await storage.createCoachingSession(validationResult.data);
      res.status(201).json(newSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to book coaching session" });
    }
  });

  app.get("/api/coaching", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const sessions = await storage.getCoachingSessionsByUser(req.user.id);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coaching sessions" });
    }
  });
  
  // Coaching availability endpoint
  app.get("/api/coaching/availability", async (req, res) => {
    try {
      // Allow unauthenticated viewing of availability for marketing purposes
      // but will require auth for actual booking
      const { date } = req.query;
      let targetDate = date ? new Date(date as string) : new Date();
      
      // Default range is one day
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 1);
      
      const availability = await storage.getCoachAvailability(targetDate, endDate);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch coach availability" });
    }
  });
  
  // Book coaching session endpoint
  app.post("/api/coaching/book", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has required tier (Executive or higher)
      if (req.user.tier !== 'executive' && req.user.tier !== 'vip' && req.user.tier !== 'all-in') {
        return res.status(403).json({ 
          message: "This feature requires Executive tier or higher. Please upgrade your membership." 
        });
      }
      
      // Validate the coaching session data
      const { date, duration, topic } = req.body;
      
      if (!date) {
        return res.status(400).json({ message: "Session date is required" });
      }
      
      const sessionDate = new Date(date);
      const now = new Date();
      
      if (sessionDate <= now) {
        return res.status(400).json({ 
          message: "Session date must be in the future" 
        });
      }
      
      const sessionData = {
        userId: req.user.id,
        date: sessionDate,
        duration: duration || 30,
        topic: topic || "Portfolio Review",
        price: duration === 60 ? 149 : 99,
        paymentStatus: "pending",
        status: "scheduled"
      };
      
      // Create the coaching session
      const newSession = await storage.createCoachingSession(sessionData);
      res.status(201).json(newSession);
    } catch (error) {
      res.status(500).json({ message: "Failed to book coaching session" });
    }
  });
  
  // Group coaching sessions endpoint
  app.get("/api/coaching/group-sessions", async (req, res) => {
    try {
      // Allow unauthenticated viewing of group sessions for marketing purposes
      // but will require auth for registration
      const upcomingSessions = await storage.getUpcomingGroupSessions();
      res.json(upcomingSessions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch group coaching sessions" });
    }
  });
  
  // Register for group session endpoint
  app.post("/api/coaching/register-group", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has required tier (Standard or higher)
      if (req.user.tier === 'free') {
        return res.status(403).json({ 
          message: "This feature requires Standard tier or higher. Please upgrade your membership." 
        });
      }
      
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      // Register for the group session
      const registration = await storage.registerForGroupSession(req.user.id, sessionId);
      res.status(201).json(registration);
    } catch (error: any) {
      const errorMessage = error.message || "Failed to register for group session";
      res.status(400).json({ message: errorMessage });
    }
  });
  
  // Get user's booked sessions (both individual and group)
  app.get("/api/coaching/my-sessions", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        // Return empty arrays for unauthenticated users for easier frontend handling
        return res.json({ individual: [], groupSessions: [] });
      }
      
      // Get individual sessions
      const individualSessions = await storage.getCoachingSessionsByUser(req.user.id);
      
      // Get group sessions
      const groupSessions = await storage.getUserGroupSessionRegistrations(req.user.id);
      
      res.json({
        individual: individualSessions,
        groupSessions
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user's coaching sessions" });
    }
  });

  // Alert Preferences API
  app.get("/api/alert-preferences", async (req, res) => {
    try {
      // Return demo alert preferences for development purposes
      const demoUserId = 1; // Default demo user ID
      
      const preferences = await storage.getAlertPreferencesByUser(demoUserId);
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alert preferences" });
    }
  });
  
  app.get("/api/alert-preferences/:stockId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const stockId = parseInt(req.params.stockId);
      if (isNaN(stockId)) {
        return res.status(400).json({ message: "Invalid stock ID format" });
      }
      
      const preference = await storage.getAlertPreferenceByUserAndStock(req.user.id, stockId);
      
      if (!preference) {
        return res.status(404).json({ message: "Alert preference not found" });
      }
      
      res.json(preference);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alert preference" });
    }
  });
  
  app.get("/api/alert-preferences/stock/:stockId", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const stockId = parseInt(req.params.stockId);
      if (isNaN(stockId)) {
        return res.status(400).json({ message: "Invalid stock ID format" });
      }
      
      const preference = await storage.getAlertPreferenceByUserAndStock(req.user.id, stockId);
      
      // If no preference exists yet, return a 404 (the frontend will handle this by showing defaults)
      if (!preference) {
        return res.status(404).json({ message: "Alert preference not found" });
      }
      
      res.json(preference);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch alert preference" });
    }
  });
  
  app.post("/api/alert-preferences", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user has Premium access
      const user = req.user;
      if (user.tier === 'free') {
        return res.status(403).json({ 
          message: "Upgrade to Premium to set custom alert preferences" 
        });
      }
      
      // Add user ID to the data
      const alertPreferenceData = {
        ...req.body,
        userId: req.user.id
      };
      
      // Validate request data
      const validationResult = insertAlertPreferenceSchema.safeParse(alertPreferenceData);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid alert preference data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Check if a preference already exists for this user and stock
      const existingPreference = await storage.getAlertPreferenceByUserAndStock(
        req.user.id, 
        validationResult.data.stockAlertId
      );
      
      if (existingPreference) {
        // Update existing preference
        const updatedPreference = await storage.updateAlertPreference(
          existingPreference.id, 
          validationResult.data
        );
        return res.json(updatedPreference);
      } else {
        // Create new preference
        const newPreference = await storage.createAlertPreference(validationResult.data);
        res.status(201).json(newPreference);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to save alert preference" });
    }
  });
  
  app.put("/api/alert-preferences/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get the existing preference
      const existingPreference = await storage.getAlertPreference(id);
      
      // Check if the preference exists and belongs to the user
      if (!existingPreference) {
        return res.status(404).json({ message: "Alert preference not found" });
      }
      
      if (existingPreference.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only update your own preferences" });
      }
      
      // Update the preference
      const updatedPreference = await storage.updateAlertPreference(id, req.body);
      res.json(updatedPreference);
    } catch (error) {
      res.status(500).json({ message: "Failed to update alert preference" });
    }
  });
  
  app.delete("/api/alert-preferences/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get the existing preference
      const existingPreference = await storage.getAlertPreference(id);
      
      // Check if the preference exists and belongs to the user
      if (!existingPreference) {
        return res.status(404).json({ message: "Alert preference not found" });
      }
      
      if (existingPreference.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only delete your own preferences" });
      }
      
      // Delete the preference
      const result = await storage.deleteAlertPreference(id);
      
      if (result) {
        res.status(204).end();
      } else {
        res.status(500).json({ message: "Failed to delete alert preference" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete alert preference" });
    }
  });
  
  // Technical Reasons API
  app.get("/api/technical-reasons", async (req, res) => {
    // Special handling for demo mode
    const isDemoMode = req.query.demo === 'true';
    if (isDemoMode) {
      console.log('Demo mode technical reasons access granted');
      return res.json([
        { id: 1, name: 'Support Level' },
        { id: 2, name: 'Resistance Level' },
        { id: 3, name: 'Oversold RSI' },
        { id: 4, name: 'Overbought RSI' },
        { id: 5, name: 'Moving Average Crossover' },
        { id: 6, name: 'MACD Crossover' },
        { id: 7, name: 'Earnings Beat' },
        { id: 8, name: 'Revenue Growth' },
        { id: 9, name: 'Bullish Pattern' },
        { id: 10, name: 'Bearish Pattern' },
        { id: 11, name: 'Breakout Pattern' },
        { id: 12, name: 'Upward Trend' },
        { id: 13, name: 'Downward Trend' },
        { id: 14, name: 'Volume Increase' },
        { id: 15, name: 'Sector Momentum' },
      ]);
    }
    
    try {
      const reasons = await storage.getTechnicalReasons();
      res.json(reasons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technical reasons" });
    }
  });
  
  // Success Center API - Achievement Badges
  app.get("/api/achievement-badges", async (req, res) => {
    try {
      const badges = await storage.getAllAchievementBadges();
      res.json(badges);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievement badges" });
    }
  });
  
  app.get("/api/user-achievements", async (req, res) => {
    try {
      // For demo purposes, return sample data for unauthenticated users
      if (!req.isAuthenticated()) {
        // Return empty array for unauthenticated users so UI still works
        return res.json([]);
      }
      
      const achievements = await storage.getUserAchievementProgress(req.user.id);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user achievements" });
    }
  });
  
  app.get("/api/user-achievements/recent", async (req, res) => {
    try {
      // For demo purposes, return sample data for unauthenticated users
      if (!req.isAuthenticated()) {
        // Return empty array for unauthenticated users so UI still works
        return res.json([]);
      }
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const achievements = await storage.getRecentCompletedBadges(req.user.id, limit);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent achievements" });
    }
  });
  
  // Success Center API - Success Cards
  app.get("/api/success-cards", async (req, res) => {
    try {
      // For demo purposes, create some sample success cards if none exist
      if (storage.successCards.size === 0) {
        console.log("Creating sample success cards for demonstration");
        
        // Create sample success cards for demonstration
        await storage.createSuccessCard({
          userId: 1,
          stockAlertId: 12, // AMZN
          percentGained: 12.73,
          daysToTarget: 28,
          targetHit: 1,
          imageUrl: "https://images.unsplash.com/photo-1523474438810-b998697493e7?q=80&w=800&auto=format&fit=crop",
          shared: false,
          sharedPlatform: null
        });
        
        await storage.createSuccessCard({
          userId: 1,
          stockAlertId: 13, // GOOGL
          percentGained: 16.65,
          daysToTarget: 45,
          targetHit: 2,
          imageUrl: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?q=80&w=800&auto=format&fit=crop",
          shared: true,
          sharedPlatform: "twitter"
        });
        
        await storage.createSuccessCard({
          userId: 1,
          stockAlertId: 14, // NFLX
          percentGained: 17.81,
          daysToTarget: 65,
          targetHit: 3,
          imageUrl: "https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?q=80&w=800&auto=format&fit=crop",
          shared: false,
          sharedPlatform: null
        });
      }
      
      // Get all success cards
      const cards = Array.from(storage.successCards.values());
      res.json(cards);
    } catch (error) {
      console.error("Error fetching success cards:", error);
      res.status(500).json({ message: "Failed to fetch success cards" });
    }
  });
  
  app.post("/api/success-cards/generate", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { stockAlertId, targetHit } = req.body;
      
      if (!stockAlertId || !targetHit || ![1, 2, 3].includes(targetHit)) {
        return res.status(400).json({ message: "Valid stockAlertId and targetHit (1, 2, or 3) are required" });
      }
      
      const successCard = await storage.generateSuccessCardForStock(req.user.id, stockAlertId, targetHit);
      
      if (!successCard) {
        return res.status(404).json({ message: "Failed to generate success card. Ensure you have this stock in your portfolio." });
      }
      
      res.status(201).json(successCard);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate success card" });
    }
  });
  
  app.put("/api/success-cards/:id/share", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { platform } = req.body;
      if (!platform) {
        return res.status(400).json({ message: "Platform is required" });
      }
      
      const successCard = await storage.getSuccessCard(id);
      
      if (!successCard) {
        return res.status(404).json({ message: "Success card not found" });
      }
      
      if (successCard.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only share your own success cards" });
      }
      
      const updatedCard = await storage.updateSuccessCard(id, { 
        shared: true, 
        sharedPlatform: platform 
      });
      
      res.json(updatedCard);
    } catch (error) {
      res.status(500).json({ message: "Failed to share success card" });
    }
  });

  // Notifications API
  app.get("/api/notifications", async (req, res) => {
    try {
      // Return demo notifications for development purposes
      const demoUserId = 1; // Default demo user ID
      
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const notifications = await storage.getUserNotifications(demoUserId, limit);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const notifications = await storage.getUserUnreadNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  app.get("/api/notifications/category/:category", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const category = req.params.category;
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }
      
      const notifications = await storage.getUserNotificationsByCategory(req.user.id, category);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications by category" });
    }
  });

  app.get("/api/notifications/stats", async (req, res) => {
    try {
      // Return demo notification stats for development purposes
      const demoUserId = 1; // Default demo user ID
      
      const stats = await storage.getNotificationStats(demoUserId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notification stats" });
    }
  });

  app.post("/api/notifications", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin for creating non-personal notifications
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin && req.body.userId !== req.user.id) {
        return res.status(403).json({ message: "You can only create notifications for yourself" });
      }
      
      // Validate request data
      const validationResult = insertUserNotificationSchema.safeParse({
        ...req.body,
        userId: req.body.userId || req.user.id,
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid notification data", 
          errors: validationResult.error.errors 
        });
      }
      
      const newNotification = await storage.createNotification(validationResult.data);
      res.status(201).json(newNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to create notification" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const updatedNotification = await storage.markNotificationAsRead(id);
      
      if (!updatedNotification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json(updatedNotification);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.put("/api/notifications/read/all", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const success = await storage.markAllNotificationsAsRead(req.user.id);
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialize WebSocket server for real-time stock price updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connection', 
      message: 'Connected to Portfolio Consultant WebSocket Server' 
    }));
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received WebSocket message:', data);
        
        // Handle message types
        switch (data.type) {
          case 'subscribe':
            // Handle subscription to stock alerts or portfolio updates
            ws.send(JSON.stringify({
              type: 'subscribed',
              channel: data.channel,
              message: `Subscribed to ${data.channel}`
            }));
            break;
            
          case 'ping':
            ws.send(JSON.stringify({ 
              type: 'pong', 
              timestamp: new Date().toISOString() 
            }));
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });
  
  // Utility function to broadcast stock price updates to all connected clients
  const broadcastStockUpdate = (stockData: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'stock_update',
          data: stockData
        }));
      }
    });
  };
  
  // Utility function to broadcast alert triggers to all connected clients
  const broadcastAlertTrigger = (triggerData: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'alert_trigger',
          data: triggerData
        }));
      }
    });
  };
  
  // Mock periodic stock price updates for demonstration
  // In a real app, this would come from an external API
  setInterval(async () => {
    try {
      const alerts = await storage.getStockAlerts();
      
      // Update a random stock with small price change
      if (alerts.length > 0) {
        const randomIndex = Math.floor(Math.random() * alerts.length);
        const alert = alerts[randomIndex];
        
        // Random price change between -1% and +1%
        const changePercent = (Math.random() * 2 - 1) / 100;
        const newPrice = alert.currentPrice * (1 + changePercent);
        
        // Update the stock price in storage
        const updatedAlert = await storage.updateStockAlertPrice(alert.id, parseFloat(newPrice.toFixed(2)));
        
        if (updatedAlert) {
          // Broadcast the update to all connected clients
          broadcastStockUpdate(updatedAlert);
          
          // Check for alert triggers
          const triggers = await storage.checkAlertTriggers(updatedAlert);
          
          // Broadcast each trigger to clients
          for (const trigger of triggers) {
            broadcastAlertTrigger(trigger);
          }
        }
      }
    } catch (error) {
      console.error('Error updating stock prices:', error);
    }
  }, 15000); // Update every 15 seconds
  
  // Admin routes for stock alert management with all fields
  app.post("/api/admin/stock-alert", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const alertData = req.body;
      
      // If updating an existing alert
      if (alertData.id) {
        const updatedAlert = await storage.updateStockAlert(alertData.id, alertData);
        if (!updatedAlert) {
          return res.status(404).send("Stock alert not found");
        }
        return res.status(200).json(updatedAlert);
      } 
      
      // Creating a new alert
      const newAlert = await storage.createStockAlert(alertData);
      res.status(201).json(newAlert);
    } catch (error) {
      console.error("Error creating/updating stock alert:", error);
      res.status(500).send(`Error creating/updating stock alert: ${error.message}`);
    }
  });
  
  // Admin route to update stock price for testing
  app.post("/api/admin/update-stock-price", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { id, currentPrice } = req.body;
      
      if (!id || currentPrice === undefined) {
        return res.status(400).send("Missing required fields: id and currentPrice");
      }
      
      const updatedAlert = await storage.updateStockAlertPrice(id, currentPrice);
      
      if (!updatedAlert) {
        return res.status(404).send("Stock alert not found");
      }
      
      res.status(200).json(updatedAlert);
    } catch (error) {
      console.error("Error updating stock price:", error);
      res.status(500).send(`Error updating stock price: ${error.message}`);
    }
  });
  
  // Get all users (admin only)
  app.get("/api/admin/users", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageUsers) {
          return res.status(403).json({ message: "You don't have permission to view users" });
        }
      }
      
      const users = await storage.getAllUsers();
      res.status(200).json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send(`Error fetching users: ${error.message}`);
    }
  });
  
  // Get a specific user by ID (admin only)
  app.get("/api/admin/users/:userId", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageUsers) {
          return res.status(403).json({ message: "You don't have permission to view users" });
        }
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).send(`Error fetching user: ${error.message}`);
    }
  });
  
  // Update a specific user (admin only)
  app.patch("/api/admin/users/:userId", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageUsers) {
          return res.status(403).json({ message: "You don't have permission to manage users" });
        }
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      // Get the user to update
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Don't allow changing super admin data by non-super admins
      if (user.adminRoles && user.adminRoles.includes('super_admin') && 
          (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin'))) {
        return res.status(403).json({ message: "You don't have permission to edit a super admin" });
      }
      
      // Update the user
      const updatedUser = await storage.updateUser(userId, req.body);
      res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).send(`Error updating user: ${error.message}`);
    }
  });
  
  // Specific endpoint for changing a user's membership tier
  app.patch("/api/admin/users/:userId/change-tier", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageUsers) {
          return res.status(403).json({ message: "You don't have permission to manage users" });
        }
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      // Get the user to update
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).send("User not found");
      }
      
      // Don't allow changing super admin data by non-super admins
      if (user.adminRoles && user.adminRoles.includes('super_admin') && 
          (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin'))) {
        return res.status(403).json({ message: "You don't have permission to edit a super admin" });
      }
      
      const { tier, reason, notifyUser } = req.body;
      
      // Validate tier value
      if (!tier || !['free', 'paid', 'premium', 'mentorship', 'employee'].includes(tier)) {
        return res.status(400).json({ message: "Invalid tier value" });
      }
      
      // Update user tier and record the change reason
      const updatedUser = await storage.updateUser(userId, { 
        tier, 
        lastTierChangeReason: reason,
        lastTierChangeDate: new Date()
      });
      
      // TODO: If notifyUser is true, send email notification about tier change
      
      res.status(200).json(updatedUser);
    } catch (error: any) {
      console.error("Error updating user tier:", error);
      res.status(500).send(`Error updating user tier: ${error.message}`);
    }
  });
  
  // Get admin users only (admin only)
  app.get("/api/admin/users/admins", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageAdmins) {
          return res.status(403).json({ message: "You don't have permission to manage admins" });
        }
      }
      
      const adminUsers = await storage.getAdminUsers();
      res.status(200).json(adminUsers);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).send(`Error fetching admin users: ${error.message}`);
    }
  });
  
  // Create a new user (admin only)
  app.post("/api/admin/users", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (req.user.adminRoles && !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageUsers) {
          return res.status(403).json({ message: "You don't have permission to create users" });
        }
      }
      
      // Extract user data from request
      const { 
        username, 
        password, 
        email, 
        firstName, 
        lastName, 
        phone, 
        tier, 
        isEmployee, 
        isAdmin: newUserIsAdmin, 
        adminRoles,
        sendWelcomeEmail
      } = req.body;
      
      // Check if username already exists
      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }
      
      // Hash the password
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;
      
      // Create new user with proper settings based on tier and admin status
      const userData = {
        username,
        password: hashedPassword,
        email,
        firstName,
        lastName,
        phone: phone || null,
        tier, // Use the tier from form
        isAdmin: tier === 'employee' && isEmployee && newUserIsAdmin ? true : false,
        adminRoles: tier === 'employee' && isEmployee && newUserIsAdmin ? adminRoles : []
      };
      
      const newUser = await storage.createUser(userData);
      
      // If user is an admin, create admin permissions
      if (newUser.isAdmin) {
        await storage.createAdminPermissions({
          userId: newUser.id,
          canManageUsers: adminRoles.includes('super_admin'),
          canManageAdmins: adminRoles.includes('super_admin'),
          canCreateAlerts: adminRoles.includes('alerts_admin') || adminRoles.includes('super_admin'),
          canEditAlerts: adminRoles.includes('alerts_admin') || adminRoles.includes('super_admin'),
          canDeleteAlerts: adminRoles.includes('alerts_admin') || adminRoles.includes('super_admin'),
          canCreateEducation: adminRoles.includes('education_admin') || adminRoles.includes('super_admin'),
          canEditEducation: adminRoles.includes('education_admin') || adminRoles.includes('super_admin'),
          canDeleteEducation: adminRoles.includes('education_admin') || adminRoles.includes('super_admin'),
          canManageCoaching: adminRoles.includes('coaching_admin') || adminRoles.includes('super_admin'),
          canManageGroupSessions: adminRoles.includes('coaching_admin') || adminRoles.includes('super_admin'),
          canScheduleSessions: adminRoles.includes('coaching_admin') || adminRoles.includes('super_admin'),
          canViewSessionDetails: adminRoles.includes('coaching_admin') || adminRoles.includes('super_admin'),
          canCreateContent: adminRoles.includes('content_admin') || adminRoles.includes('super_admin'),
          canEditContent: adminRoles.includes('content_admin') || adminRoles.includes('super_admin'),
          canDeleteContent: adminRoles.includes('content_admin') || adminRoles.includes('super_admin'),
          canViewAnalytics: adminRoles.includes('super_admin')
        });
      }
      
      // TODO: If sendWelcomeEmail is true, implement email sending functionality
      
      res.status(201).json(newUser);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).send(`Error creating user: ${error.message}`);
    }
  });

  // Get admin permissions for a user
  app.get("/api/admin/permissions/:userId", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageAdmins) {
          return res.status(403).json({ message: "You don't have permission to manage admins" });
        }
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      const permissions = await storage.getAdminPermissions(userId);
      res.status(200).json(permissions || {});
    } catch (error) {
      console.error("Error fetching admin permissions:", error);
      res.status(500).send(`Error fetching admin permissions: ${error.message}`);
    }
  });
  
  // Update admin permissions for a user
  app.post("/api/admin/permissions/:userId", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageAdmins) {
          return res.status(403).json({ message: "You don't have permission to manage admins" });
        }
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      // Get user to check if they're a super admin
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).send("User not found");
      }
      
      // Don't allow changing super admin permissions
      if (targetUser.adminRoles && targetUser.adminRoles.includes('super_admin') && targetUser.id !== req.user.id) {
        return res.status(403).json({ message: "Cannot modify super admin permissions" });
      }
      
      const updatedPermissions = await storage.updateAdminPermissions(userId, req.body);
      res.status(200).json(updatedPermissions);
    } catch (error) {
      console.error("Error updating admin permissions:", error);
      res.status(500).send(`Error updating admin permissions: ${error.message}`);
    }
  });
  
  // Toggle admin status
  app.post("/api/admin/toggle-admin-status/:userId", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageAdmins) {
          return res.status(403).json({ message: "You don't have permission to manage admins" });
        }
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      // Get user to check if they're a super admin
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).send("User not found");
      }
      
      // Don't allow changing super admin status
      if (targetUser.adminRoles && targetUser.adminRoles.includes('super_admin') && req.body.isAdmin === false) {
        return res.status(403).json({ message: "Cannot remove super admin status" });
      }
      
      const updatedUser = await storage.updateUserAdminStatus(userId, req.body.isAdmin);
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error toggling admin status:", error);
      res.status(500).send(`Error toggling admin status: ${error.message}`);
    }
  });
  
  // Update admin role
  app.post("/api/admin/update-role/:userId", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check permission if user is not super admin
      if (!req.user.adminRoles || !req.user.adminRoles.includes('super_admin')) {
        const permissions = await storage.getAdminPermissions(req.user.id);
        if (!permissions || !permissions.canManageAdmins) {
          return res.status(403).json({ message: "You don't have permission to manage admins" });
        }
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).send("Invalid user ID");
      }
      
      // Get user to check if they're a super admin
      const targetUser = await storage.getUser(userId);
      if (!targetUser) {
        return res.status(404).send("User not found");
      }
      
      // Don't allow changing super admin role
      if (targetUser.adminRoles && targetUser.adminRoles.includes('super_admin')) {
        return res.status(403).json({ message: "Cannot change super admin role" });
      }
      
      // Validate the role
      const validRoles = ['super_admin', 'content_admin', 'alerts_admin', 'education_admin', 'coaching_admin'];
      if (!validRoles.includes(req.body.role)) {
        return res.status(400).send("Invalid role specified");
      }
      
      const updatedUser = await storage.updateUserAdminRole(userId, req.body.role);
      res.status(200).json(updatedUser);
    } catch (error) {
      console.error("Error updating admin role:", error);
      res.status(500).send(`Error updating admin role: ${error.message}`);
    }
  });
  
  // Check if user is admin (used for UI protections)
  app.get("/api/user/is-admin", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      res.status(200).json({ isAdmin });
    } catch (error) {
      console.error("Error checking admin status:", error);
      res.status(500).send(`Error checking admin status: ${error.message}`);
    }
  });
  
  // Get current user's admin permissions
  app.get("/api/user/admin-permissions", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const permissions = await storage.getAdminPermissions(req.user.id);
      res.status(200).json(permissions || {});
    } catch (error) {
      console.error("Error fetching user admin permissions:", error);
      res.status(500).send(`Error fetching user admin permissions: ${error.message}`);
    }
  });
  
  // Revenue Analytics API Endpoints
  
  // Get payment transactions with filtering options
  app.get("/api/admin/revenue/transactions", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check if the admin has analytics permission
      const permissions = await storage.getAdminPermissions(req.user.id);
      if (!permissions || !permissions.canViewAnalytics) {
        return res.status(403).json({ message: "You don't have permission to view analytics" });
      }
      
      // Parse date range from query
      const timeRange = req.query.timeRange as string || '30d';
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '12m':
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
      
      // Get transactions from database
      const transactions = await storage.getPaymentTransactions(startDate);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching payment transactions:", error);
      res.status(500).json({ message: "Failed to get payment transactions" });
    }
  });
  
  // Get subscription stats
  app.get("/api/admin/revenue/subscriptions", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check if the admin has analytics permission
      const permissions = await storage.getAdminPermissions(req.user.id);
      if (!permissions || !permissions.canViewAnalytics) {
        return res.status(403).json({ message: "You don't have permission to view analytics" });
      }
      
      // Parse date range from query
      const timeRange = req.query.timeRange as string || '30d';
      let startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '12m':
          startDate.setMonth(startDate.getMonth() - 12);
          break;
        default:
          startDate.setDate(startDate.getDate() - 30);
      }
      
      // Get subscription stats from database
      const stats = await storage.getSubscriptionStats(startDate);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching subscription stats:", error);
      res.status(500).json({ message: "Failed to get subscription statistics" });
    }
  });
  
  // Create a payment transaction
  app.post("/api/admin/revenue/transactions", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Check if the admin has analytics permission
      const permissions = await storage.getAdminPermissions(req.user.id);
      if (!permissions || !permissions.canViewAnalytics) {
        return res.status(403).json({ message: "You don't have permission to manage transactions" });
      }
      
      // Create the new transaction
      const transaction = await storage.createPaymentTransaction(req.body);
      res.status(201).json(transaction);
    } catch (error) {
      console.error("Error creating payment transaction:", error);
      res.status(500).json({ message: "Failed to create payment transaction" });
    }
  });

  // ======= COUPON MANAGEMENT API ENDPOINTS =======
  
  // Get all active coupons (admin only)
  app.get("/api/coupons", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const coupons = await storage.getActiveCoupons();
      res.status(200).json(coupons);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      res.status(500).json({ message: "Failed to fetch coupons" });
    }
  });
  
  // Get a specific coupon by ID (admin only)
  app.get("/api/coupons/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const coupon = await storage.getCoupon(id);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      res.status(200).json(coupon);
    } catch (error) {
      console.error("Error fetching coupon:", error);
      res.status(500).json({ message: "Failed to fetch coupon" });
    }
  });
  
  // Create a new coupon (admin only)
  app.post("/api/coupons", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      // Validate request data
      const validationResult = insertCouponSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid coupon data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Add the current admin as the creator
      const couponData = {
        ...validationResult.data,
        createdBy: req.user.id
      };
      
      const coupon = await storage.createCoupon(couponData);
      res.status(201).json(coupon);
    } catch (error) {
      console.error("Error creating coupon:", error);
      res.status(500).json({ message: "Failed to create coupon" });
    }
  });
  
  // Update a coupon (admin only)
  app.patch("/api/coupons/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const coupon = await storage.getCoupon(id);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      const updatedCoupon = await storage.updateCoupon(id, req.body);
      res.status(200).json(updatedCoupon);
    } catch (error) {
      console.error("Error updating coupon:", error);
      res.status(500).json({ message: "Failed to update coupon" });
    }
  });
  
  // Deactivate a coupon (admin only)
  app.post("/api/coupons/:id/deactivate", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const coupon = await storage.getCoupon(id);
      if (!coupon) {
        return res.status(404).json({ message: "Coupon not found" });
      }
      
      const deactivatedCoupon = await storage.deactivateCoupon(id);
      res.status(200).json(deactivatedCoupon);
    } catch (error) {
      console.error("Error deactivating coupon:", error);
      res.status(500).json({ message: "Failed to deactivate coupon" });
    }
  });
  
  // Validate a coupon code (public)
  app.post("/api/coupons/validate", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Coupon code is required" });
      }
      
      const result = await storage.validateCoupon(code);
      res.status(200).json(result);
    } catch (error) {
      console.error("Error validating coupon:", error);
      res.status(500).json({ message: "Failed to validate coupon" });
    }
  });
  
  // ======= USER DISCOUNT MANAGEMENT API ENDPOINTS =======
  
  // Get all discounts for a user (admin only)
  app.get("/api/users/:userId/discounts", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const discounts = await storage.getUserDiscountsByUser(userId);
      res.status(200).json(discounts);
    } catch (error) {
      console.error("Error fetching user discounts:", error);
      res.status(500).json({ message: "Failed to fetch user discounts" });
    }
  });
  
  // Get active discount for a user
  app.get("/api/users/:userId/active-discount", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Only allow admins or the user themselves to view their active discount
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin && req.user.id !== userId) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
      
      const discount = await storage.getActiveUserDiscount(userId);
      res.status(200).json(discount || null);
    } catch (error) {
      console.error("Error fetching active user discount:", error);
      res.status(500).json({ message: "Failed to fetch active user discount" });
    }
  });
  
  // Create a new user discount (admin only)
  app.post("/api/users/:userId/discounts", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID format" });
      }
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate request data
      const validationResult = insertUserDiscountSchema.safeParse({
        ...req.body,
        userId,
        createdBy: req.user.id
      });
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: "Invalid discount data", 
          errors: validationResult.error.errors 
        });
      }
      
      // Validate reason is one of the allowed reasons
      if (!discountReasons.includes(validationResult.data.reason as any)) {
        return res.status(400).json({ 
          message: "Invalid discount reason",
          allowedReasons: discountReasons
        });
      }
      
      const discount = await storage.createUserDiscount(validationResult.data);
      
      // Update user's active discount reference if needed
      await storage.updateUser(userId, { activeDiscountId: discount.id });
      
      res.status(201).json(discount);
    } catch (error) {
      console.error("Error creating user discount:", error);
      res.status(500).json({ message: "Failed to create user discount" });
    }
  });
  
  // Update a user discount (admin only)
  app.patch("/api/discounts/:id", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid discount ID format" });
      }
      
      const discount = await storage.getUserDiscount(id);
      if (!discount) {
        return res.status(404).json({ message: "Discount not found" });
      }
      
      // If trying to update reason, validate it
      if (req.body.reason && !discountReasons.includes(req.body.reason as any)) {
        return res.status(400).json({ 
          message: "Invalid discount reason",
          allowedReasons: discountReasons
        });
      }
      
      const updatedDiscount = await storage.updateUserDiscount(id, req.body);
      res.status(200).json(updatedDiscount);
    } catch (error) {
      console.error("Error updating user discount:", error);
      res.status(500).json({ message: "Failed to update user discount" });
    }
  });
  
  // Deactivate a user discount (admin only)
  app.post("/api/discounts/:id/deactivate", async (req, res) => {
    try {
      // Check authentication
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check if user is an admin
      const isAdmin = await storage.checkIfAdmin(req.user.id);
      if (!isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid discount ID format" });
      }
      
      const discount = await storage.getUserDiscount(id);
      if (!discount) {
        return res.status(404).json({ message: "Discount not found" });
      }
      
      const deactivatedDiscount = await storage.deactivateUserDiscount(id);
      
      // If this was the user's active discount, remove the reference
      if (discount.isActive) {
        const user = await storage.getUser(discount.userId);
        if (user && user.activeDiscountId === id) {
          await storage.updateUser(discount.userId, { activeDiscountId: null });
        }
      }
      
      res.status(200).json(deactivatedDiscount);
    } catch (error) {
      console.error("Error deactivating user discount:", error);
      res.status(500).json({ message: "Failed to deactivate user discount" });
    }
  });
  
  // Get list of discount reasons (for dropdowns)
  app.get("/api/discount-reasons", (req, res) => {
    try {
      res.status(200).json({
        reasons: discountReasons
      });
    } catch (error) {
      console.error("Error fetching discount reasons:", error);
      res.status(500).json({ message: "Failed to fetch discount reasons" });
    }
  });
  
  return httpServer;
}
