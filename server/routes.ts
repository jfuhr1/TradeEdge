import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertStockAlertSchema, insertPortfolioItemSchema, insertCoachingSessionSchema } from "@shared/schema";

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
      
      res.json(alert);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stock alert" });
    }
  });

  app.post("/api/stock-alerts", async (req, res) => {
    try {
      // Only allow authenticated admin users to create stock alerts
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
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

  // Technical Reasons API
  app.get("/api/technical-reasons", async (req, res) => {
    try {
      const reasons = await storage.getTechnicalReasons();
      res.json(reasons);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch technical reasons" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
