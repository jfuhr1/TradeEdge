import {
  users, User, InsertUser,
  stockAlerts, StockAlert, InsertStockAlert,
  portfolioItems, PortfolioItem, InsertPortfolioItem,
  educationContent, EducationContent, InsertEducationContent,
  coachingSessions, CoachingSession, InsertCoachingSession,
  technicalReasons, TechnicalReason, InsertTechnicalReason,
  educationProgress, EducationProgress, InsertEducationProgress,
  userAchievements, UserAchievement, InsertUserAchievement
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserTier(id: number, tier: string): Promise<User | undefined>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getUsersByTier(tier: string): Promise<User[]>;
  checkIfAdmin(userId: number): Promise<boolean>;
  
  // Stock alert operations
  createStockAlert(alert: InsertStockAlert): Promise<StockAlert>;
  getStockAlerts(): Promise<StockAlert[]>;
  getStockAlert(id: number): Promise<StockAlert | undefined>;
  getStockAlertsInBuyZone(): Promise<StockAlert[]>;
  getStockAlertsNearingTargets(): Promise<{target1: StockAlert[], target2: StockAlert[], target3: StockAlert[]}>;
  updateStockAlert(id: number, updates: Partial<StockAlert>): Promise<StockAlert | undefined>;
  updateStockAlertPrice(id: number, currentPrice: number): Promise<StockAlert | undefined>;
  
  // Portfolio operations
  createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem>;
  getPortfolioItemsByUser(userId: number): Promise<PortfolioItem[]>;
  updatePortfolioItem(id: number, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined>;
  sellPortfolioItem(id: number, soldPrice: number): Promise<PortfolioItem | undefined>;
  getPortfolioStats(userId: number): Promise<{
    activePositions: number;
    currentValue: number;
    totalGainLoss: number;
    percentGainLoss: number;
    closedProfit: number;
  }>;
  
  // Education content operations
  createEducationContent(content: InsertEducationContent): Promise<EducationContent>;
  getEducationContent(): Promise<EducationContent[]>;
  getEducationContentByTier(tier: string): Promise<EducationContent[]>;
  getEducationContentByCategory(category: string): Promise<EducationContent[]>;
  getEducationContentByLevel(level: string): Promise<EducationContent[]>;
  searchEducationContent(query: string): Promise<EducationContent[]>;
  
  // Education progress operations
  createEducationProgress(progress: InsertEducationProgress): Promise<EducationProgress>;
  getEducationProgressByUser(userId: number): Promise<EducationProgress[]>;
  updateEducationProgress(id: number, updates: Partial<EducationProgress>): Promise<EducationProgress | undefined>;
  getCompletedContentCount(userId: number): Promise<number>;
  
  // User achievements operations
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  getUserAchievements(userId: number): Promise<UserAchievement[]>;
  checkForNewAchievements(userId: number): Promise<UserAchievement[]>;
  
  // Coaching operations
  createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession>;
  getCoachingSessionsByUser(userId: number): Promise<CoachingSession[]>;
  updateCoachingSession(id: number, updates: Partial<CoachingSession>): Promise<CoachingSession | undefined>;
  getCoachAvailability(startDate: Date, endDate: Date): Promise<{date: Date, available: boolean}[]>;
  
  // Technical reasons
  getTechnicalReasons(): Promise<TechnicalReason[]>;
  createTechnicalReason(reason: InsertTechnicalReason): Promise<TechnicalReason>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private stockAlerts: Map<number, StockAlert>;
  private portfolioItems: Map<number, PortfolioItem>;
  private educationContents: Map<number, EducationContent>;
  private coachingSessions: Map<number, CoachingSession>;
  private technicalReasonsList: Map<number, TechnicalReason>;
  private educationProgressList: Map<number, EducationProgress>;
  private userAchievementsList: Map<number, UserAchievement>;
  
  sessionStore: any; // Using any to bypass type checking temporarily
  
  private userId: number;
  private stockAlertId: number;
  private portfolioItemId: number;
  private educationContentId: number;
  private coachingSessionId: number;
  private technicalReasonId: number;
  private educationProgressId: number;
  private userAchievementId: number;

  constructor() {
    this.users = new Map();
    this.stockAlerts = new Map();
    this.portfolioItems = new Map();
    this.educationContents = new Map();
    this.coachingSessions = new Map();
    this.technicalReasonsList = new Map();
    this.educationProgressList = new Map();
    this.userAchievementsList = new Map();
    
    this.userId = 1;
    this.stockAlertId = 1;
    this.portfolioItemId = 1;
    this.educationContentId = 1;
    this.coachingSessionId = 1;
    this.technicalReasonId = 1;
    this.educationProgressId = 1;
    this.userAchievementId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with some technical reasons
    this.seedTechnicalReasons();
    // Initialize with some education content
    this.seedEducationContent();
    // Initialize with some stock alerts
    this.seedStockAlerts();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserTier(id: number, tier: string): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, tier };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsersByTier(tier: string): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.tier === tier);
  }
  
  async checkIfAdmin(userId: number): Promise<boolean> {
    const user = await this.getUser(userId);
    return user?.isAdmin === true;
  }
  
  // Stock alert operations
  async createStockAlert(alert: InsertStockAlert): Promise<StockAlert> {
    const id = this.stockAlertId++;
    const now = new Date();
    const stockAlert: StockAlert = { ...alert, id, createdAt: now };
    this.stockAlerts.set(id, stockAlert);
    return stockAlert;
  }
  
  async getStockAlerts(): Promise<StockAlert[]> {
    return Array.from(this.stockAlerts.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  
  async getStockAlert(id: number): Promise<StockAlert | undefined> {
    return this.stockAlerts.get(id);
  }
  
  async getStockAlertsInBuyZone(): Promise<StockAlert[]> {
    return Array.from(this.stockAlerts.values()).filter(alert => 
      alert.currentPrice >= alert.buyZoneMin && alert.currentPrice <= alert.buyZoneMax
    );
  }
  
  async getStockAlertsNearingTargets(): Promise<{target1: StockAlert[], target2: StockAlert[], target3: StockAlert[]}> {
    const target1: StockAlert[] = [];
    const target2: StockAlert[] = [];
    const target3: StockAlert[] = [];
    
    const alerts = Array.from(this.stockAlerts.values());
    
    for (const alert of alerts) {
      const percentToTarget1 = (alert.currentPrice / alert.target1) * 100;
      const percentToTarget2 = (alert.currentPrice / alert.target2) * 100;
      const percentToTarget3 = (alert.currentPrice / alert.target3) * 100;
      
      if (percentToTarget1 >= 90 && percentToTarget1 < 100) {
        target1.push(alert);
      }
      
      if (percentToTarget2 >= 90 && percentToTarget2 < 100) {
        target2.push(alert);
      }
      
      if (percentToTarget3 >= 90 && percentToTarget3 < 100) {
        target3.push(alert);
      }
    }
    
    return { target1, target2, target3 };
  }
  
  async updateStockAlert(id: number, updates: Partial<StockAlert>): Promise<StockAlert | undefined> {
    const alert = this.stockAlerts.get(id);
    if (!alert) return undefined;
    
    const now = new Date();
    const updatedAlert = { ...alert, ...updates, updatedAt: now };
    this.stockAlerts.set(id, updatedAlert);
    return updatedAlert;
  }
  
  async updateStockAlertPrice(id: number, currentPrice: number): Promise<StockAlert | undefined> {
    return this.updateStockAlert(id, { currentPrice });
  }
  
  // Portfolio operations
  async createPortfolioItem(item: InsertPortfolioItem): Promise<PortfolioItem> {
    const id = this.portfolioItemId++;
    const now = new Date();
    const portfolioItem: PortfolioItem = { 
      ...item, 
      id, 
      sold: false, 
      soldPrice: null, 
      soldAt: null, 
      createdAt: now 
    };
    this.portfolioItems.set(id, portfolioItem);
    return portfolioItem;
  }
  
  async getPortfolioItemsByUser(userId: number): Promise<PortfolioItem[]> {
    return Array.from(this.portfolioItems.values())
      .filter(item => item.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updatePortfolioItem(id: number, updates: Partial<PortfolioItem>): Promise<PortfolioItem | undefined> {
    const item = this.portfolioItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.portfolioItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async sellPortfolioItem(id: number, soldPrice: number): Promise<PortfolioItem | undefined> {
    const item = this.portfolioItems.get(id);
    if (!item) return undefined;
    
    const now = new Date();
    const updatedItem = { 
      ...item, 
      sold: true, 
      soldPrice, 
      soldAt: now 
    };
    this.portfolioItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async getPortfolioStats(userId: number): Promise<{
    activePositions: number;
    currentValue: number;
    totalGainLoss: number;
    percentGainLoss: number;
    closedProfit: number;
  }> {
    const items = await this.getPortfolioItemsByUser(userId);
    
    // Get active positions
    const activeItems = items.filter(item => !item.sold);
    const activePositions = activeItems.length;
    
    // Calculate current value and gain/loss for active positions
    let currentValue = 0;
    let totalInvested = 0;
    
    for (const item of activeItems) {
      const stock = this.stockAlerts.get(item.stockAlertId);
      if (stock) {
        const positionValue = stock.currentPrice * item.quantity;
        currentValue += positionValue;
        totalInvested += item.boughtPrice * item.quantity;
      }
    }
    
    const totalGainLoss = currentValue - totalInvested;
    const percentGainLoss = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
    
    // Calculate profit from closed positions
    let closedProfit = 0;
    const closedItems = items.filter(item => item.sold && item.soldPrice);
    
    for (const item of closedItems) {
      const soldValue = item.soldPrice! * item.quantity;
      const boughtValue = item.boughtPrice * item.quantity;
      closedProfit += (soldValue - boughtValue);
    }
    
    return {
      activePositions,
      currentValue,
      totalGainLoss,
      percentGainLoss,
      closedProfit
    };
  }
  
  // Education content operations
  async createEducationContent(content: InsertEducationContent): Promise<EducationContent> {
    const id = this.educationContentId++;
    const now = new Date();
    const educationContent: EducationContent = { ...content, id, createdAt: now };
    this.educationContents.set(id, educationContent);
    return educationContent;
  }
  
  async getEducationContent(): Promise<EducationContent[]> {
    return Array.from(this.educationContents.values());
  }
  
  async getEducationContentByTier(tier: string): Promise<EducationContent[]> {
    if (tier === 'premium') {
      return Array.from(this.educationContents.values());
    }
    return Array.from(this.educationContents.values())
      .filter(content => content.tier === 'free');
  }
  
  async getEducationContentByCategory(category: string): Promise<EducationContent[]> {
    return Array.from(this.educationContents.values())
      .filter(content => content.category === category);
  }
  
  async getEducationContentByLevel(level: string): Promise<EducationContent[]> {
    return Array.from(this.educationContents.values())
      .filter(content => content.level === level);
  }
  
  async searchEducationContent(query: string): Promise<EducationContent[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.educationContents.values())
      .filter(content => 
        content.title.toLowerCase().includes(lowercaseQuery) ||
        content.description.toLowerCase().includes(lowercaseQuery) ||
        content.category.toLowerCase().includes(lowercaseQuery)
      );
  }
  
  // Coaching operations
  async createCoachingSession(session: InsertCoachingSession): Promise<CoachingSession> {
    const id = this.coachingSessionId++;
    const now = new Date();
    const coachingSession: CoachingSession = { ...session, id, createdAt: now };
    this.coachingSessions.set(id, coachingSession);
    return coachingSession;
  }
  
  async getCoachingSessionsByUser(userId: number): Promise<CoachingSession[]> {
    return Array.from(this.coachingSessions.values())
      .filter(session => session.userId === userId)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  async updateCoachingSession(id: number, updates: Partial<CoachingSession>): Promise<CoachingSession | undefined> {
    const session = this.coachingSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { ...session, ...updates };
    this.coachingSessions.set(id, updatedSession);
    return updatedSession;
  }
  
  async getCoachAvailability(startDate: Date, endDate: Date): Promise<{ date: Date, available: boolean }[]> {
    // Define coach availability
    const coachHours = {
      start: 9, // 9 AM
      end: 17,  // 5 PM
      excludeDays: [0, 6], // Sunday (0) and Saturday (6)
    };
    
    // Get existing coach sessions
    const existingSessions = Array.from(this.coachingSessions.values())
      .filter(session => 
        session.date >= startDate && 
        session.date <= endDate
      );
    
    // Create time slots for each day
    const timeSlots: { date: Date, available: boolean }[] = [];
    
    // Loop through each day in the range
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      // Skip weekends and non-working days
      if (!coachHours.excludeDays.includes(currentDate.getDay())) {
        // Loop through each hour of the working day
        for (let hour = coachHours.start; hour < coachHours.end; hour++) {
          // Create a date for this slot
          const slotDate = new Date(currentDate);
          slotDate.setHours(hour, 0, 0, 0);
          
          // Check if slot is already booked
          const isBooked = existingSessions.some(session => {
            const sessionDate = new Date(session.date);
            return sessionDate.getTime() === slotDate.getTime();
          });
          
          timeSlots.push({
            date: slotDate,
            available: !isBooked
          });
        }
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return timeSlots;
  }
  
  // Education progress operations
  async createEducationProgress(progress: InsertEducationProgress): Promise<EducationProgress> {
    const id = this.educationProgressId++;
    const now = new Date();
    const educationProgress: EducationProgress = { 
      ...progress, 
      id, 
      createdAt: now,
      completed: progress.completed || false,
      percentComplete: progress.percentComplete || 0,
      lastAccessedAt: progress.lastAccessedAt || now,
      bookmarks: progress.bookmarks || [],
      notes: progress.notes || null
    };
    this.educationProgressList.set(id, educationProgress);
    return educationProgress;
  }
  
  async getEducationProgressByUser(userId: number): Promise<EducationProgress[]> {
    return Array.from(this.educationProgressList.values())
      .filter(progress => progress.userId === userId);
  }
  
  async updateEducationProgress(id: number, updates: Partial<EducationProgress>): Promise<EducationProgress | undefined> {
    const progress = this.educationProgressList.get(id);
    if (!progress) return undefined;
    
    const updatedProgress = { ...progress, ...updates };
    this.educationProgressList.set(id, updatedProgress);
    return updatedProgress;
  }
  
  async getCompletedContentCount(userId: number): Promise<number> {
    const completedProgress = Array.from(this.educationProgressList.values())
      .filter(progress => progress.userId === userId && progress.completed);
    return completedProgress.length;
  }
  
  // User achievements operations
  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = this.userAchievementId++;
    const now = new Date();
    const userAchievement: UserAchievement = { 
      ...achievement, 
      id, 
      earnedAt: achievement.earnedAt || now,
      imageUrl: achievement.imageUrl || null 
    };
    this.userAchievementsList.set(id, userAchievement);
    return userAchievement;
  }
  
  async getUserAchievements(userId: number): Promise<UserAchievement[]> {
    return Array.from(this.userAchievementsList.values())
      .filter(achievement => achievement.userId === userId)
      .sort((a, b) => b.earnedAt.getTime() - a.earnedAt.getTime());
  }
  
  async checkForNewAchievements(userId: number): Promise<UserAchievement[]> {
    const newAchievements: UserAchievement[] = [];
    
    // Get current achievements and progress
    const existingAchievements = await this.getUserAchievements(userId);
    const completedContentCount = await this.getCompletedContentCount(userId);
    
    // Define achievement criteria and check for each
    const achievementCriteria = [
      { badgeName: 'getting-started', description: 'Complete your first lesson', threshold: 1 },
      { badgeName: 'knowledge-seeker', description: 'Complete 5 lessons', threshold: 5 },
      { badgeName: 'trading-scholar', description: 'Complete 10 lessons', threshold: 10 },
      { badgeName: 'market-master', description: 'Complete 20 lessons', threshold: 20 }
    ];
    
    for (const criteria of achievementCriteria) {
      // Check if user has reached the threshold and doesn't already have this achievement
      if (completedContentCount >= criteria.threshold && 
          !existingAchievements.some(a => a.badgeName === criteria.badgeName)) {
        // Create and save the new achievement
        const newAchievement = await this.createUserAchievement({
          userId,
          badgeName: criteria.badgeName,
          description: criteria.description
        });
        
        newAchievements.push(newAchievement);
      }
    }
    
    return newAchievements;
  }
  
  // Technical reasons
  async getTechnicalReasons(): Promise<TechnicalReason[]> {
    return Array.from(this.technicalReasonsList.values());
  }
  
  async createTechnicalReason(reason: InsertTechnicalReason): Promise<TechnicalReason> {
    const id = this.technicalReasonId++;
    const technicalReason: TechnicalReason = { ...reason, id };
    this.technicalReasonsList.set(id, technicalReason);
    return technicalReason;
  }
  
  // Seed methods
  private seedTechnicalReasons() {
    const reasons = [
      'Support Level', 'Resistance Level', 'Oversold RSI', 
      'Overbought RSI', 'Moving Average Crossover', 'MACD Crossover',
      'Earnings Beat', 'Revenue Growth', 'Bullish Pattern', 
      'Bearish Pattern', 'Breakout Pattern', 'Upward Trend',
      'Downward Trend', 'Volume Increase', 'Sector Momentum'
    ];
    
    reasons.forEach(reason => {
      this.createTechnicalReason({ name: reason });
    });
  }
  
  private seedEducationContent() {
    const contents: InsertEducationContent[] = [
      {
        title: 'Stock Market Basics',
        description: 'Learn the fundamentals of stock trading, market mechanics, and basic terminology.',
        type: 'course',
        contentUrl: '/education/stock-market-basics',
        imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        tier: 'free',
        level: 'beginner',
        category: 'fundamentals',
        duration: 60,
        glossaryTerms: [],
        videoBookmarks: [],
        tags: ['basics', 'introduction', 'beginner']
      },
      {
        title: 'Technical Analysis Mastery',
        description: 'Advanced chart patterns, indicators, and proven technical strategies.',
        type: 'course',
        contentUrl: '/education/technical-analysis',
        imageUrl: 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        tier: 'premium',
        level: 'intermediate',
        category: 'technical',
        duration: 120,
        glossaryTerms: [],
        videoBookmarks: [],
        tags: ['technical', 'charts', 'patterns']
      },
      {
        title: 'Weekly Market Review',
        description: 'Our analysis of this week\'s market movements, sector rotations, and what to watch in the coming week.',
        type: 'article',
        contentUrl: '/education/market-review',
        imageUrl: 'https://images.unsplash.com/photo-1612178537253-bccd437b730e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        tier: 'free',
        level: 'beginner',
        category: 'market-news',
        duration: 15,
        glossaryTerms: [],
        videoBookmarks: [],
        tags: ['news', 'current-events', 'weekly-update']
      }
    ];
    
    contents.forEach(content => {
      this.createEducationContent(content);
    });
  }
  
  private seedStockAlerts() {
    const alerts: InsertStockAlert[] = [
      {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        currentPrice: 182.63,
        buyZoneMin: 175,
        buyZoneMax: 185,
        target1: 195,
        target2: 210,
        target3: 225,
        technicalReasons: ['Support Level', 'Oversold RSI', 'Earnings Beat']
      },
      {
        symbol: 'MSFT',
        companyName: 'Microsoft Corp.',
        currentPrice: 412.46,
        buyZoneMin: 395,
        buyZoneMax: 415,
        target1: 430,
        target2: 450,
        target3: 475,
        technicalReasons: ['Breakout Pattern', 'Upward Trend', 'Sector Momentum']
      },
      {
        symbol: 'NVDA',
        companyName: 'NVIDIA Corporation',
        currentPrice: 940.20,
        buyZoneMin: 900,
        buyZoneMax: 950,
        target1: 995,
        target2: 1050,
        target3: 1100,
        technicalReasons: ['Earnings Beat', 'Sector Momentum', 'Volume Increase']
      },
      {
        symbol: 'META',
        companyName: 'Meta Platforms Inc.',
        currentPrice: 474.80,
        buyZoneMin: 450,
        buyZoneMax: 480,
        target1: 490,
        target2: 510,
        target3: 530,
        technicalReasons: ['Support Level', 'Revenue Growth', 'Bullish Pattern']
      },
      {
        symbol: 'TSLA',
        companyName: 'Tesla Inc.',
        currentPrice: 230.80,
        buyZoneMin: 220,
        buyZoneMax: 240,
        target1: 250,
        target2: 275,
        target3: 300,
        technicalReasons: ['Oversold RSI', 'Support Level', 'Volume Increase']
      }
    ];
    
    alerts.forEach(alert => {
      this.createStockAlert(alert);
    });
  }
}

export const storage = new MemStorage();
