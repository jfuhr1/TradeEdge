import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { WebSocketServer, WebSocket } from "ws";
import { 
  insertStockAlertSchema, 
  insertPortfolioItemSchema, 
  insertCoachingSessionSchema,
  insertAlertPreferenceSchema,
  insertSuccessCardSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Stock Alerts API
  app.get("/api/stock-alerts", async (req, res) => {
    try {
      const alerts = await storage.getStockAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alerts" });
    }
  });

  app.get("/api/stock-alerts/buy-zone", async (req, res) => {
    try {
      const alerts = await storage.getStockAlertsInBuyZone();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alerts in buy zone" });
    }
  });

  app.get("/api/stock-alerts/targets", async (req, res) => {
    try {
      const targets = await storage.getStockAlertsNearingTargets();
      res.json(targets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alerts nearing targets" });
    }
  });

  app.get("/api/stock-alerts/closed", async (req, res) => {
    try {
      const closedAlerts = await storage.getClosedStockAlerts();
      res.json(closedAlerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch closed stock alerts" });
    }
  });
  
  app.get("/api/stock-alerts/high-risk-reward", async (req, res) => {
    try {
      const alerts = await storage.getHighRiskRewardStockAlerts();
      res.json(alerts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch high risk/reward stock alerts" });
    }
  });
  
  app.get("/api/stock-alerts/hit-targets", async (req, res) => {
    try {
      const targets = await storage.getRecentlyHitTargetsStockAlerts();
      res.json(targets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alerts that hit targets" });
    }
  });

  app.get("/api/stock-alerts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const alert = await storage.getStockAlert(id);
      if (!alert) {
        return res.status(404).json({ message: "Stock alert not found" });
      }
      
      // For the detail page, we'll inject a random change percentage for demo
      const changePercent = ((Math.random() * 3) - 1).toFixed(2);
      
      res.json({
        ...alert,
        changePercent
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alert" });
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
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const portfolioItems = await storage.getPortfolioItemsByUser(req.user.id);
      
      // Enrich portfolio items with stock alert data
      const enrichedItems = await Promise.all(
        portfolioItems.map(async (item) => {
          const stockAlert = await storage.getStockAlert(item.stockAlertId);
          return {
            ...item,
            stockAlert,
          };
        })
      );
      
      res.json(enrichedItems);
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

  // Alert Preferences API
  app.get("/api/alert-preferences", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const preferences = await storage.getAlertPreferencesByUser(req.user.id);
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
  
  return httpServer;
}
