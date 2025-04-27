import MainLayout from "@/components/layout/main-layout";
import { ChartLine, TrendingUp, Target, AlertCircle, Award, Wifi, CheckCircle, Filter, CalendarDays, Clock, UserCircle, Users, Eye, Bell } from "lucide-react";
import { DashboardNotifications } from "@/components/notifications/dashboard-notifications";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState, useMemo } from "react";
import { StockAlert } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// We'll replace this with real data from the API
const initialLatestAlerts = [
  { 
    id: 1, 
    symbol: "AAPL", 
    companyName: "Apple Inc.", 
    currentPrice: 170.50, 
    buyZoneMin: 175.00, 
    buyZoneMax: 185.00, 
    target1: 195.00, 
    target2: 210.00, 
    target3: 225.00,
    createdAt: new Date(2025, 3, 15),
    status: "high-risk"
  },
  { 
    id: 2, 
    symbol: "MSFT", 
    companyName: "Microsoft Corp.", 
    currentPrice: 410.20, 
    buyZoneMin: 400.00, 
    buyZoneMax: 415.00, 
    target1: 430.00, 
    target2: 450.00, 
    target3: 470.00,
    createdAt: new Date(2025, 3, 12), 
    status: "in-buy-zone"
  },
  { 
    id: 3, 
    symbol: "TSLA", 
    companyName: "Tesla, Inc.", 
    currentPrice: 182.25, 
    buyZoneMin: 170.00, 
    buyZoneMax: 180.00, 
    target1: 195.00, 
    target2: 210.00, 
    target3: 230.00,
    createdAt: new Date(2025, 3, 10), 
    status: "above-buy-zone"
  }
];

// Sample portfolio data
const portfolioSummary = {
  activePositions: 4,
  currentValue: 12850.75,
  totalGainLoss: 1255.30,
  percentGainLoss: 10.82,
  closedProfit: 2340.50
};

// Sample targeting data
const approachingTargets = {
  target1: [
    { 
      id: 1, 
      symbol: "AAPL", 
      companyName: "Apple Inc.", 
      currentPrice: 170.50, 
      target1: 195.00, 
      percentToTarget: 9.86
    }
  ],
  target2: [
    { 
      id: 4, 
      symbol: "GOOGL", 
      companyName: "Alphabet Inc.", 
      currentPrice: 172.85, 
      target2: 180.00, 
      percentToTarget: 3.98 
    }
  ],
  target3: [
    { 
      id: 2, 
      symbol: "MSFT", 
      companyName: "Microsoft Corp.", 
      currentPrice: 410.20, 
      target3: 470.00, 
      percentToTarget: 12.76
    }
  ]
};

// Sample curriculum outline
const curriculumSections = [
  {
    id: 1,
    title: "Market Basics",
    description: "Understanding the stock market fundamentals",
    tier: "free",
    progress: 85,
    modules: 6,
    completedModules: 5
  },
  {
    id: 2,
    title: "Chart Reading Essentials",
    description: "Learn to interpret different chart patterns",
    tier: "free",
    progress: 100,
    modules: 4,
    completedModules: 4
  },
  {
    id: 3,
    title: "Technical Analysis",
    description: "Using indicators to predict price movements",
    tier: "premium",
    progress: 60,
    modules: 10,
    completedModules: 6
  },
  {
    id: 4,
    title: "Risk Management",
    description: "Strategies to protect your portfolio",
    tier: "premium",
    progress: 40,
    modules: 5,
    completedModules: 2
  },
  {
    id: 5,
    title: "Options Trading",
    description: "Complete options trading course",
    tier: "premium",
    progress: 20,
    modules: 10,
    completedModules: 2
  },
  {
    id: 6,
    title: "Advanced Swing Trading",
    description: "Multi-day trading strategies",
    tier: "premium",
    progress: 0,
    modules: 8,
    completedModules: 0
  },
  {
    id: 7,
    title: "Sector Rotation Strategies",
    description: "Timing sector investments for maximum returns",
    tier: "premium",
    progress: 0,
    modules: 6,
    completedModules: 0
  },
  {
    id: 8,
    title: "Algorithmic Trading Principles",
    description: "Understanding automated trading systems",
    tier: "premium",
    progress: 0,
    modules: 7,
    completedModules: 0
  },
  {
    id: 9,
    title: "Market Psychology",
    description: "Understanding emotions in trading",
    tier: "premium",
    progress: 0,
    modules: 5,
    completedModules: 0
  },
  {
    id: 10,
    title: "Position Sizing Strategies",
    description: "Optimizing your trade sizes",
    tier: "premium",
    progress: 0,
    modules: 4,
    completedModules: 0
  }
];

// Sample recent articles
const recentArticles = [
  {
    id: 1,
    title: "Three Breakout Patterns To Watch This Week",
    publicationDate: new Date(2025, 3, 18),
    read: true,
    category: "Technical Analysis",
    tier: "premium"
  },
  {
    id: 2,
    title: "How The Fed's Latest Decision Affects Your Portfolio",
    publicationDate: new Date(2025, 3, 15),
    read: true,
    category: "Market News",
    tier: "free"
  },
  {
    id: 3,
    title: "Sector Rotation: Why Tech Is Heating Up Again",
    publicationDate: new Date(2025, 3, 12),
    read: false,
    category: "Sector Analysis",
    tier: "premium"
  },
  {
    id: 4,
    title: "Five Risk Management Rules Every Trader Should Follow",
    publicationDate: new Date(2025, 3, 10),
    read: false,
    category: "Risk Management",
    tier: "free"
  },
  {
    id: 5,
    title: "Options Strategy: Profiting From Sideways Markets",
    publicationDate: new Date(2025, 3, 5),
    read: true,
    category: "Options",
    tier: "premium"
  }
];

// Sample individual coaching sessions
const individualCoaches = [
  {
    id: 1,
    coachName: "Sarah Johnson",
    specialty: "Technical Analysis",
    availability: "Mon, Wed, Fri",
    price: 125,
    image: "https://randomuser.me/api/portraits/women/32.jpg"
  },
  {
    id: 2,
    coachName: "Michael Chen",
    specialty: "Swing Trading",
    availability: "Tue, Thu, Sat",
    price: 150,
    image: "https://randomuser.me/api/portraits/men/26.jpg"
  }
];

// Sample group coaching sessions
const groupCoachingSessions = [
  {
    id: 1,
    title: "Weekly Market Overview",
    coach: "Sarah Johnson",
    date: new Date(2025, 3, 25),
    time: "7:00 PM - 8:30 PM ET",
    participants: 18,
    maxParticipants: 25,
    price: 35
  },
  {
    id: 2,
    title: "Swing Trading Strategies",
    coach: "Michael Chen",
    date: new Date(2025, 3, 26),
    time: "6:00 PM - 7:30 PM ET",
    participants: 12,
    maxParticipants: 20,
    price: 40
  },
  {
    id: 3,
    title: "Options Trading Workshop",
    coach: "Jessica Miller",
    date: new Date(2025, 3, 28),
    time: "7:00 PM - 9:00 PM ET",
    participants: 15,
    maxParticipants: 15,
    price: 50,
    isFull: true
  }
];

// Rich dashboard with real data and WebSocket updates
export default function Dashboard() {
  // Get auth state
  const { user } = useAuth();
  const userName = user?.name || "Guest"; 
  const { connected, lastMessage } = useWebSocket();
  const [latestAlerts, setLatestAlerts] = useState<StockAlert[]>([]);
  const [alertDisplayCount, setAlertDisplayCount] = useState<string>("6");
  const [buyZoneDisplayCount, setBuyZoneDisplayCount] = useState<string>("all");
  const [showOnlyOwned, setShowOnlyOwned] = useState<boolean>(false);
  
  // Fetch stock alerts
  const { data: stockAlerts, isLoading } = useQuery<StockAlert[]>({
    queryKey: ['/api/stock-alerts']
  });
  
  // Fetch stocks in buy zone
  const { data: buyZoneStocks, isLoading: buyZoneLoading } = useQuery<StockAlert[]>({
    queryKey: ['/api/stock-alerts/buy-zone']
  });
  
  // Update the latest alerts when data is fetched
  useEffect(() => {
    if (stockAlerts) {
      // Display the selected number of latest alerts
      setLatestAlerts(stockAlerts.slice(0, parseInt(alertDisplayCount)));
    }
  }, [stockAlerts, alertDisplayCount]);
  
  // Fetch approaching targets
  const { data: targetData } = useQuery({
    queryKey: ['/api/stock-alerts/targets']
  });
  
  // Listen for WebSocket updates
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'stock_update') {
      console.log('Received stock update:', lastMessage);
      // Update the alerts with the new price data
      setLatestAlerts(prevAlerts => {
        return prevAlerts.map(alert => {
          if (alert.id === lastMessage.data.id) {
            // Return updated alert
            return {
              ...alert,
              currentPrice: lastMessage.data.currentPrice,
              updatedAt: new Date()
            };
          }
          return alert;
        });
      });
    }
  }, [lastMessage]);
  
  // Calculate potential gain based on midpoint of buy zone
  const calculatePotentialGain = (alert: StockAlert, targetPrice: number) => {
    const midpoint = (alert.buyZoneMin + alert.buyZoneMax) / 2;
    return ((targetPrice / midpoint) - 1) * 100;
  };
  
  // Sample data for the "Recently Hit Target" section
  // In a real app, this would come from the API
  const recentlyHitTargets = [
    {
      id: 1,
      symbol: "GOOGL",
      companyName: "Alphabet Inc.",
      alertDate: new Date(2025, 2, 15),
      buyZoneMin: 160.00,
      buyZoneMax: 170.00,
      targetName: "Target 1", 
      targetValue: 185.00,
      dateReached: new Date(2025, 3, 5),
      daysToTarget: 21,
      percentGained: 12.1 // ((targetValue / buyZoneMidpoint) - 1) * 100
    },
    {
      id: 2,
      symbol: "AAPL",
      companyName: "Apple Inc.",
      alertDate: new Date(2025, 2, 10),
      buyZoneMin: 175.00,
      buyZoneMax: 185.00,
      targetName: "Target 1", 
      targetValue: 195.00,
      dateReached: new Date(2025, 2, 25),
      daysToTarget: 15,
      percentGained: 8.3 // ((targetValue / buyZoneMidpoint) - 1) * 100
    },
    {
      id: 3,
      symbol: "NVDA",
      companyName: "NVIDIA Corporation",
      alertDate: new Date(2025, 1, 20),
      buyZoneMin: 800.00,
      buyZoneMax: 850.00,
      targetName: "Target 2", 
      targetValue: 950.00,
      dateReached: new Date(2025, 3, 10),
      daysToTarget: 49,
      percentGained: 15.2 // ((targetValue / buyZoneMidpoint) - 1) * 100
    }
  ];
  
  // Filter displayed stocks based on selected counts
  const displayAlerts = latestAlerts.length > 0 ? latestAlerts : initialLatestAlerts;
  const targets = targetData || approachingTargets;
  const allStocksInBuyZone = buyZoneStocks || [];
  
  // Filter stocks in buy zone based on selected display count
  const stocksInBuyZone = useMemo(() => {
    if (buyZoneDisplayCount === 'all') {
      return allStocksInBuyZone;
    }
    const count = parseInt(buyZoneDisplayCount);
    return allStocksInBuyZone.slice(0, count);
  }, [allStocksInBuyZone, buyZoneDisplayCount]);

  return (
    <MainLayout 
      title="Dashboard" 
      description={`Welcome back, ${userName}. Here's what's happening with your stocks.`}
    >
      {/* Notifications Section */}
      <DashboardNotifications />
      
      {/* Portfolio Overview */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Portfolio Overview</h2>
          <Link href="/portfolio">
            <Button className="h-full">
              <ChartLine className="mr-2 h-4 w-4" />
              Portfolio Details
            </Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-1">Active Positions</p>
                <p className="text-3xl font-bold">{portfolioSummary.activePositions}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                <p className="text-3xl font-bold">${portfolioSummary.currentValue.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-1">Unrealized P/L</p>
                <p className={`text-3xl font-bold ${portfolioSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${portfolioSummary.totalGainLoss.toLocaleString()}
                </p>
                <p className={`text-sm ${portfolioSummary.percentGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {portfolioSummary.percentGainLoss >= 0 ? '+' : ''}{portfolioSummary.percentGainLoss.toFixed(2)}%
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-1">Closed Profits</p>
                <p className="text-3xl font-bold text-green-600">${portfolioSummary.closedProfit.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                <p className="text-3xl font-bold">68%</p>
                <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Latest Stock Alerts */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-2xl font-bold mr-4">Latest Stock Alerts</h2>
            <div className="flex items-center space-x-2">
              <Label htmlFor="alert-count" className="text-sm text-muted-foreground">Show:</Label>
              <Select
                value={alertDisplayCount}
                onValueChange={setAlertDisplayCount}
              >
                <SelectTrigger id="alert-count" className="w-20">
                  <SelectValue placeholder="6" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3</SelectItem>
                  <SelectItem value="6">6</SelectItem>
                  <SelectItem value="9">9</SelectItem>
                  <SelectItem value="12">12</SelectItem>
                  <SelectItem value="15">15</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Link href="/stock-alerts">
            <Button variant="outline" size="sm">View All Alerts</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              <Card className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Skeleton className="h-16 w-full mb-2" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Skeleton className="h-16 w-full mb-2" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
              <Card className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <Skeleton className="h-16 w-full mb-2" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            </>
          ) : (
            displayAlerts.map((alert) => (
              <Card key={alert.id} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/stock-detail/${alert.symbol}`}>
                          <span className="text-xl font-bold hover:text-primary hover:underline cursor-pointer">{alert.symbol}</span>
                        </Link>
                        {alert.status === "in-buy-zone" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            In Buy Zone
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Above Buy Zone
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.companyName}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end mb-1">
                        <p className="text-lg font-semibold mr-2">${alert.currentPrice.toFixed(2)}</p>
                        <Link href={`/stock-detail/${alert.symbol}`}>
                          <Button variant="ghost" size="sm" className="h-7 px-2 py-1">
                            <Eye className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </Link>
                      </div>
                      {connected && 
                        <div className="flex items-center justify-end text-xs text-green-600">
                          <Wifi className="h-3 w-3 mr-1" /> Live
                        </div>
                      }
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  <div className="grid grid-cols-2 gap-2 my-2">
                    <div className="text-sm">
                      <p className="text-muted-foreground">Buy Zone</p>
                      <p className="font-medium">${alert.buyZoneMin.toFixed(2)} - ${alert.buyZoneMax.toFixed(2)}</p>
                    </div>
                    <div className="text-sm">
                      <p className="text-muted-foreground">Date Added</p>
                      <p className="font-medium">{new Date(alert.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Price Targets</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-green-50 border border-green-100 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Target 1</p>
                        <p className="font-semibold">${alert.target1.toFixed(2)}</p>
                        <p className="text-xs text-green-600">+{(((alert.target1 / alert.currentPrice) - 1) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Target 2</p>
                        <p className="font-semibold">${alert.target2.toFixed(2)}</p>
                        <p className="text-xs text-green-600">+{(((alert.target2 / alert.currentPrice) - 1) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-green-50 border border-green-100 rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Target 3</p>
                        <p className="font-semibold">${alert.target3.toFixed(2)}</p>
                        <p className="text-xs text-green-600">+{(((alert.target3 / alert.currentPrice) - 1) * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      
      {/* Stocks in Buy Zone */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <AlertCircle className="mr-2 h-5 w-5 text-green-500" />
            <h2 className="text-2xl font-bold">Stocks Still in Buy Zone</h2>
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-700">
              {stocksInBuyZone.length} stock{stocksInBuyZone.length !== 1 ? 's' : ''}
            </Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="buy-zone-count" className="text-sm text-muted-foreground">Display:</Label>
            <Select
              defaultValue="all"
              onValueChange={(value) => setBuyZoneDisplayCount(value)}
            >
              <SelectTrigger id="buy-zone-count" className="w-24">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead>Current Price</TableHead>
                  <TableHead>Buy Zone</TableHead>
                  <TableHead>Target 1</TableHead>
                  <TableHead>Target 2</TableHead>
                  <TableHead>Target 3</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {buyZoneLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4">
                      <div className="flex justify-center">
                        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : stocksInBuyZone.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No stocks currently in buy zone
                    </TableCell>
                  </TableRow>
                ) : (
                  stocksInBuyZone.map((stock) => {
                    const buyZoneMidpoint = (stock.buyZoneMin + stock.buyZoneMax) / 2;
                    return (
                      <TableRow key={stock.id}>
                        <TableCell className="font-medium">
                          <Link href={`/stock-detail/${stock.symbol}`}>
                            <span className="text-primary hover:underline cursor-pointer">{stock.symbol}</span>
                          </Link>
                        </TableCell>
                        <TableCell>{stock.companyName}</TableCell>
                        <TableCell>{new Date(stock.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>${stock.currentPrice.toFixed(2)}</TableCell>
                        <TableCell>${stock.buyZoneMin.toFixed(2)} - ${stock.buyZoneMax.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">
                          ${stock.target1.toFixed(2)}
                          <span className="text-xs block">
                            (+{calculatePotentialGain(stock, stock.target1).toFixed(1)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-green-600">
                          ${stock.target2.toFixed(2)}
                          <span className="text-xs block">
                            (+{calculatePotentialGain(stock, stock.target2).toFixed(1)}%)
                          </span>
                        </TableCell>
                        <TableCell className="text-green-600">
                          ${stock.target3.toFixed(2)}
                          <span className="text-xs block">
                            (+{calculatePotentialGain(stock, stock.target3).toFixed(1)}%)
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Approaching Targets */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Target className="mr-2 h-5 w-5 text-amber-500" />
            <h2 className="text-2xl font-bold">Approaching Targets</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor="owned-only" className="text-sm">
              Show owned stocks only
            </Label>
            <Switch
              id="owned-only"
              checked={showOnlyOwned}
              onCheckedChange={setShowOnlyOwned}
            />
          </div>
        </div>
        <Tabs defaultValue="target1" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="target1">Target 1 ({approachingTargets.target1.length})</TabsTrigger>
            <TabsTrigger value="target2">Target 2 ({approachingTargets.target2.length})</TabsTrigger>
            <TabsTrigger value="target3">Target 3 ({approachingTargets.target3.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="target1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approachingTargets.target1.map((stock) => (
                <Card key={stock.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{stock.companyName}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                        Target 1
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-semibold">${stock.currentPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target Price</p>
                        <p className="font-semibold text-green-600">${stock.target1.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${100 - stock.percentToTarget}%` }}></div>
                    </div>
                    <p className="text-xs text-right mt-1 text-muted-foreground">{stock.percentToTarget.toFixed(1)}% to target</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="target2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approachingTargets.target2.map((stock) => (
                <Card key={stock.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{stock.companyName}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                        Target 2
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-semibold">${stock.currentPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target Price</p>
                        <p className="font-semibold text-green-600">${stock.target2.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${100 - stock.percentToTarget}%` }}></div>
                    </div>
                    <p className="text-xs text-right mt-1 text-muted-foreground">{stock.percentToTarget.toFixed(1)}% to target</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="target3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approachingTargets.target3.map((stock) => (
                <Card key={stock.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">{stock.symbol}</p>
                        <p className="text-sm text-muted-foreground">{stock.companyName}</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                        Target 3
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Current Price</p>
                        <p className="font-semibold">${stock.currentPrice.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Target Price</p>
                        <p className="font-semibold text-green-600">${stock.target3.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${100 - stock.percentToTarget}%` }}></div>
                    </div>
                    <p className="text-xs text-right mt-1 text-muted-foreground">{stock.percentToTarget.toFixed(1)}% to target</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Recently Hit Targets */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CheckCircle className="mr-2 h-5 w-5 text-green-500" />
          <h2 className="text-2xl font-bold">Recently Hit Targets</h2>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Alert Date</TableHead>
                  <TableHead>Buy Zone</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Target Value</TableHead>
                  <TableHead>% Gained</TableHead>
                  <TableHead>Date Reached</TableHead>
                  <TableHead>Days to Target</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyHitTargets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                      No targets have been hit recently
                    </TableCell>
                  </TableRow>
                ) : (
                  recentlyHitTargets.map((target, index) => (
                    <TableRow key={`${target.id}-${index}`}>
                      <TableCell className="font-medium">{target.symbol}</TableCell>
                      <TableCell>{target.companyName}</TableCell>
                      <TableCell>{target.alertDate.toLocaleDateString()}</TableCell>
                      <TableCell>${target.buyZoneMin.toFixed(2)} - ${target.buyZoneMax.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          {target.targetName}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-green-600">${target.targetValue.toFixed(2)}</TableCell>
                      <TableCell className="text-green-600">+{target.percentGained.toFixed(1)}%</TableCell>
                      <TableCell>{target.dateReached.toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge>{target.daysToTarget} days</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Education Resources */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <Award className="mr-2 h-5 w-5 text-purple-500" />
            <h2 className="text-2xl font-bold">Educational Resources</h2>
          </div>
          <Link href="/education">
            <Button variant="outline" size="sm">View All Resources</Button>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Curriculum Outline with Progress */}
          <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <h3 className="text-lg font-semibold">Curriculum Outline</h3>
              <p className="text-sm text-muted-foreground">Track your learning progress</p>
            </CardHeader>
            <CardContent className="p-4 pt-2 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {curriculumSections.slice(0, 7).map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-start gap-2">
                        <div>
                          <p className="font-medium">{section.title}</p>
                          <p className="text-xs text-muted-foreground">{section.description}</p>
                        </div>
                        <Badge variant={section.tier === "premium" ? "default" : "outline"} className="ml-2">
                          {section.tier === "premium" ? "Premium" : "Free"}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${section.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs whitespace-nowrap">
                        {section.completedModules}/{section.modules} modules
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/education">
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                    <Eye className="mr-2 h-4 w-4" />
                    View All Courses
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          {/* Recent Articles */}
          <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <h3 className="text-lg font-semibold">Recent Articles</h3>
              <p className="text-sm text-muted-foreground">Latest trading insights</p>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <ul className="space-y-3">
                {recentArticles.map((article) => (
                  <li key={article.id} className="flex items-start space-x-2">
                    <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${article.read ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                    <div className="flex-1">
                      <a 
                        href="#" 
                        className={`text-sm hover:underline ${article.read ? 'text-muted-foreground' : 'font-medium'}`}
                      >
                        {article.title}
                      </a>
                      <div className="flex items-center mt-1 text-xs">
                        <span className="text-muted-foreground">
                          {article.publicationDate.toLocaleDateString()}
                        </span>
                        <Badge 
                          variant="outline" 
                          className="ml-2 text-[10px] py-0 h-4"
                        >
                          {article.category}
                        </Badge>
                        {article.tier === "premium" && (
                          <Badge className="ml-1 text-[10px] py-0 h-4">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4">
                <Link href="/education/articles">
                  <Button variant="outline" size="sm" className="w-full flex items-center justify-center">
                    <Eye className="mr-2 h-4 w-4" />
                    View All Articles
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Coaching Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-bold">Coaching Sessions</h2>
          </div>
          <Link href="/coaching">
            <Button variant="outline" size="sm">View All Coaching</Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Group Sessions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              Upcoming Group Sessions
            </h3>
            
            <div className="space-y-4">
              {groupCoachingSessions.map((session) => (
                <Card key={session.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-semibold">{session.title}</h4>
                        <p className="text-sm text-muted-foreground">with {session.coach}</p>
                      </div>
                      <Badge variant={session.isFull ? "destructive" : "outline"} className={!session.isFull ? "bg-green-50 text-green-700" : ""}>
                        {session.isFull ? "Full" : `${session.participants}/${session.maxParticipants} spots`}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center mt-3 text-sm">
                      <CalendarDays className="h-4 w-4 mr-1" />
                      <span className="mr-3">{session.date.toLocaleDateString()}</span>
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{session.time}</span>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <p className="font-medium">${session.price}</p>
                      <Button 
                        size="sm" 
                        variant={session.isFull ? "outline" : "default"}
                        disabled={session.isFull}
                      >
                        {session.isFull ? "Join Waitlist" : "Register"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="text-center">
                <Button variant="ghost" size="sm" className="mt-2">
                  View All Group Sessions
                </Button>
              </div>
            </div>
          </div>
          
          {/* Individual Coaching */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <UserCircle className="h-5 w-5 mr-2 text-blue-500" />
              Individual Coaching
            </h3>
            
            <div className="space-y-4">
              {individualCoaches.map((coach) => (
                <Card key={coach.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex">
                      <div className="mr-4">
                        <div className="h-16 w-16 rounded-full overflow-hidden">
                          <img src={coach.image} alt={coach.coachName} className="h-full w-full object-cover" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{coach.coachName}</p>
                        <p className="text-sm text-muted-foreground">{coach.specialty}</p>
                        
                        <div className="flex justify-between items-center mt-2">
                          <div>
                            <p className="text-xs text-muted-foreground">Availability</p>
                            <p className="text-sm">{coach.availability}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">Session Price</p>
                            <p className="font-semibold">${coach.price}/hour</p>
                          </div>
                        </div>
                        
                        <Button className="w-full mt-3" size="sm">
                          Book Session
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <div className="text-center">
                <Button variant="ghost" size="sm" className="mt-2">
                  View All Coaches
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
