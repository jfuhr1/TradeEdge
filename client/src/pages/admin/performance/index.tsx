import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import MainLayout from '@/components/layout/main-layout';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ArrowLeft, 
  LineChart, 
  BarChart, 
  PieChart, 
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
  FileDown
} from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';

export default function AlertPerformance() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [timeframe, setTimeframe] = useState('all');
  
  // Get demo mode state from localStorage
  const isDemoMode = localStorage.getItem('demoMode') === 'true';
  
  // Check if user is admin or using demo mode
  useEffect(() => {
    async function checkAdminStatus() {
      // If we've already checked or are in demo mode, no need to check again
      if (isAdmin !== null || isDemoMode) {
        if (isDemoMode) {
          // In demo mode, automatically grant admin access
          setIsAdmin(true);
        }
        return;
      }
      
      try {
        // Only make the API call once
        const res = await apiRequest('GET', '/api/user/is-admin');
        const data = await res.json();
        setIsAdmin(data.isAdmin);
        
        if (!data.isAdmin) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        // Only show the toast on the first error
        if (isAdmin === null) {
          setIsAdmin(false);
          toast({
            title: 'Access Denied',
            description: 'Access restricted. Enable demo mode to try this feature.',
            variant: 'destructive'
          });
        }
      }
    }
    
    checkAdminStatus();
  }, [toast, isAdmin, isDemoMode]);

  // Fetch stock alerts for performance analysis
  const { data: stockAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ['/api/stock-alerts'],
    enabled: isAdmin === true || isDemoMode
  });

  // Check if user is logged in
  if (authLoading) {
    return (
      <MainLayout title="Loading" description="Checking authentication">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return (
      <MainLayout title="Authentication Required" description="Please log in">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You need to be logged in to access this page.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => window.location.href = "/auth"}>Go to Login</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show access denied message if not admin
  if (isAdmin === false) {
    return (
      <MainLayout title="Access Denied" description="Admin access required">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You do not have permission to access this page. Only administrators can view alert performance metrics.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.location.href = "/"}>Return to Dashboard</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <MainLayout title="Loading" description="Checking permissions">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Demo performance summary data
  const performanceSummary = {
    totalAlerts: 87,
    activeAlerts: 34,
    closedAlerts: 53,
    successRate: 76,
    avgGain: 18.3,
    avgHoldTime: 47,
    maxGain: 62.1,
    hitRateT1: 85,
    hitRateT2: 61,
    hitRateT3: 42
  };

  // Demo performance by sector
  const sectorPerformance = [
    { sector: "Technology", alertCount: 24, avgGain: 22.4, successRate: 83 },
    { sector: "Healthcare", alertCount: 16, avgGain: 15.7, successRate: 71 },
    { sector: "Financial", alertCount: 19, avgGain: 12.2, successRate: 68 },
    { sector: "Consumer", alertCount: 13, avgGain: 19.6, successRate: 76 },
    { sector: "Energy", alertCount: 8, avgGain: 14.3, successRate: 62 },
    { sector: "Others", alertCount: 7, avgGain: 16.8, successRate: 72 }
  ];

  // Demo top performing picks
  const topPicks = [
    { symbol: "NVDA", gain: 62.1, daysToTarget: 38, targets: ["T1", "T2", "T3"] },
    { symbol: "MSFT", gain: 34.8, daysToTarget: 29, targets: ["T1", "T2"] },
    { symbol: "AAPL", gain: 27.5, daysToTarget: 41, targets: ["T1", "T2"] },
    { symbol: "AMD", gain: 26.4, daysToTarget: 32, targets: ["T1"] },
    { symbol: "META", gain: 24.9, daysToTarget: 26, targets: ["T1", "T2"] }
  ];

  return (
    <MainLayout title="Alert Performance" description="Stock Alert Performance Metrics">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button asChild variant="ghost" size="sm" className="mb-2">
              <Link href="/admin/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Alert Performance Dashboard</h1>
            <p className="text-muted-foreground">Analyze the performance of your stock alerts and trading strategies</p>
          </div>
          <div className="flex items-center space-x-2">
            <div>
              <Select 
                value={timeframe}
                onValueChange={setTimeframe}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="year">Past Year</SelectItem>
                  <SelectItem value="quarter">Past Quarter</SelectItem>
                  <SelectItem value="month">Past Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={() => {
              toast({
                title: "Demo Mode",
                description: "This would export performance data to CSV in a production environment.",
              });
            }}>
              <FileDown className="mr-2 h-4 w-4" />
              Export Data
            </Button>
          </div>
        </div>

        {isDemoMode ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <AlertTriangle className="mr-2 h-4 w-4 text-amber-500" />
                    Total Alerts Issued
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceSummary.totalAlerts}</div>
                  <p className="text-xs text-muted-foreground">
                    {performanceSummary.activeAlerts} active, {performanceSummary.closedAlerts} closed
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4 text-green-500" />
                    Average Gain per Alert
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">+{performanceSummary.avgGain}%</div>
                  <p className="text-xs text-muted-foreground">
                    Max gain: {performanceSummary.maxGain}%
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <CheckCircle className="mr-2 h-4 w-4 text-blue-500" />
                    Success Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceSummary.successRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    Target hit frequency
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-purple-500" />
                    Average Hold Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{performanceSummary.avgHoldTime} days</div>
                  <p className="text-xs text-muted-foreground">
                    From entry to target
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Target Hit Rates</CardTitle>
                  <CardDescription>Percentage of alerts that reach each price target</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end h-60 space-x-6 px-8">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-20 bg-primary rounded-t-md" style={{ height: `${performanceSummary.hitRateT1 * 2}px` }}></div>
                      <div className="font-medium">{performanceSummary.hitRateT1}%</div>
                      <div className="text-sm text-muted-foreground">Target 1</div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-20 bg-primary rounded-t-md" style={{ height: `${performanceSummary.hitRateT2 * 2}px` }}></div>
                      <div className="font-medium">{performanceSummary.hitRateT2}%</div>
                      <div className="text-sm text-muted-foreground">Target 2</div>
                    </div>
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-20 bg-primary rounded-t-md" style={{ height: `${performanceSummary.hitRateT3 * 2}px` }}></div>
                      <div className="font-medium">{performanceSummary.hitRateT3}%</div>
                      <div className="text-sm text-muted-foreground">Target 3</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Alert Status Breakdown</CardTitle>
                  <CardDescription>Current status of all issued alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center h-60">
                    <div className="w-40 h-40 rounded-full border-8 border-primary relative">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{performanceSummary.successRate}%</div>
                          <div className="text-sm text-muted-foreground">Success Rate</div>
                        </div>
                      </div>
                      <div 
                        className="absolute top-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 border-white"
                        style={{ transform: 'translate(50%, -50%)' }}
                      ></div>
                      <div 
                        className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-amber-500 border-2 border-white"
                        style={{ transform: 'translate(50%, 50%)' }}
                      ></div>
                      <div 
                        className="absolute bottom-0 left-0 w-5 h-5 rounded-full bg-red-500 border-2 border-white"
                        style={{ transform: 'translate(-50%, 50%)' }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-center space-x-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span>Target Hit</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                      <span>In Progress</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span>Stopped Out</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="byPick" className="space-y-4">
              <TabsList>
                <TabsTrigger value="byPick">Performance by Pick</TabsTrigger>
                <TabsTrigger value="bySector">Performance by Sector</TabsTrigger>
                <TabsTrigger value="byStrategy">Performance by Strategy</TabsTrigger>
              </TabsList>
              
              <TabsContent value="byPick" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Stock Picks</CardTitle>
                    <CardDescription>Highest performing stock alerts based on percentage gain</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <div className="grid grid-cols-7 font-medium text-sm bg-muted p-3 border-b">
                        <div>Symbol</div>
                        <div>Gain %</div>
                        <div>Days to Target</div>
                        <div>Entry Zone</div>
                        <div>Targets Hit</div>
                        <div>Status</div>
                        <div>Issue Date</div>
                      </div>
                      <div className="divide-y">
                        {topPicks.map((pick, index) => (
                          <div key={index} className="grid grid-cols-7 py-3 px-3 text-sm">
                            <div className="font-medium">{pick.symbol}</div>
                            <div className="text-green-600">+{pick.gain}%</div>
                            <div>{pick.daysToTarget}</div>
                            <div>$120-$130</div>
                            <div className="flex space-x-1">
                              {pick.targets.map((target, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {target}
                                </Badge>
                              ))}
                            </div>
                            <div>
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                Closed
                              </Badge>
                            </div>
                            <div>Apr 12, 2025</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Alert Performance</CardTitle>
                    <CardDescription>Performance metrics for the most recent stock alerts</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <div className="grid grid-cols-8 font-medium text-sm bg-muted p-3 border-b">
                        <div>Symbol</div>
                        <div>Current vs Entry</div>
                        <div>Buy Zone</div>
                        <div>Current Price</div>
                        <div>Target 1</div>
                        <div>Target 2</div>
                        <div>Target 3</div>
                        <div>Status</div>
                      </div>
                      <div className="divide-y">
                        <div className="grid grid-cols-8 py-3 px-3 text-sm">
                          <div className="font-medium">AAPL</div>
                          <div className="text-red-600">-2.5%</div>
                          <div>$175-$185</div>
                          <div>$171.45</div>
                          <div>$195</div>
                          <div>$210</div>
                          <div>$225</div>
                          <div>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-8 py-3 px-3 text-sm">
                          <div className="font-medium">MSFT</div>
                          <div className="text-green-600">+3.1%</div>
                          <div>$395-$415</div>
                          <div>$407.98</div>
                          <div>$430</div>
                          <div>$450</div>
                          <div>$475</div>
                          <div>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-8 py-3 px-3 text-sm">
                          <div className="font-medium">NVDA</div>
                          <div className="text-green-600">+7.6%</div>
                          <div>$900-$950</div>
                          <div>$968.23</div>
                          <div className="text-green-600">$995 ✓</div>
                          <div>$1050</div>
                          <div>$1100</div>
                          <div>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-8 py-3 px-3 text-sm">
                          <div className="font-medium">META</div>
                          <div className="text-green-600">+5.1%</div>
                          <div>$450-$480</div>
                          <div>$489.36</div>
                          <div className="text-green-600">$490 ✓</div>
                          <div>$510</div>
                          <div>$530</div>
                          <div>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              Active
                            </Badge>
                          </div>
                        </div>
                        <div className="grid grid-cols-8 py-3 px-3 text-sm">
                          <div className="font-medium">DIS</div>
                          <div className="text-green-600">+16.1%</div>
                          <div>$110-$120</div>
                          <div>$130.23</div>
                          <div className="text-green-600">$130 ✓</div>
                          <div>$140</div>
                          <div>$150</div>
                          <div>
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              Active
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="bySector" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Performance by Sector</CardTitle>
                    <CardDescription>Comparative performance metrics across different market sectors</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <div className="grid grid-cols-5 font-medium text-sm bg-muted p-3 border-b">
                        <div>Sector</div>
                        <div>Alerts Issued</div>
                        <div>Average Gain</div>
                        <div>Success Rate</div>
                        <div>Performance Rating</div>
                      </div>
                      <div className="divide-y">
                        {sectorPerformance.map((sector, index) => (
                          <div key={index} className="grid grid-cols-5 py-3 px-3 text-sm">
                            <div className="font-medium">{sector.sector}</div>
                            <div>{sector.alertCount}</div>
                            <div className="text-green-600">+{sector.avgGain}%</div>
                            <div>{sector.successRate}%</div>
                            <div>
                              <div className="flex items-center">
                                <div className="w-24 h-2 bg-muted rounded-full">
                                  <div 
                                    className="h-2 bg-primary rounded-full" 
                                    style={{ width: `${(sector.successRate/100) * 24}px` }}
                                  ></div>
                                </div>
                                <span className="ml-2">{Math.floor(sector.successRate/20)}/5</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Sector Breakdown</CardTitle>
                      <CardDescription>Distribution of alerts across market sectors</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                      <div className="h-60 w-60 rounded-full border-8 border-muted relative flex items-center justify-center">
                        <div className="flex items-center justify-center h-full">
                          <PieChart className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <div 
                          className="absolute top-0 h-1/4 w-1/4 rounded-full bg-primary" 
                          style={{ left: '38%', top: '5%' }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-primary-foreground font-medium">28%</span>
                        </div>
                        <div 
                          className="absolute h-1/5 w-1/5 rounded-full bg-blue-500" 
                          style={{ right: '20%', top: '30%' }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">18%</span>
                        </div>
                        <div 
                          className="absolute h-1/5 w-1/5 rounded-full bg-green-500" 
                          style={{ right: '30%', bottom: '20%' }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">22%</span>
                        </div>
                        <div 
                          className="absolute h-1/6 w-1/6 rounded-full bg-amber-500" 
                          style={{ left: '25%', bottom: '30%' }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">15%</span>
                        </div>
                        <div 
                          className="absolute h-1/6 w-1/6 rounded-full bg-purple-500" 
                          style={{ left: '15%', top: '35%' }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-white font-medium">17%</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-center text-sm">
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                          <span>Technology</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                          <span>Healthcare</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                          <span>Financial</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                          <span>Consumer</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                          <span>Energy</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                          <span>Others</span>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Sector Performance Trend</CardTitle>
                      <CardDescription>Performance changes over time by sector</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px] flex items-center justify-center">
                      <div className="text-center">
                        <LineChart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Trend visualization would appear here in production environment
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              
              <TabsContent value="byStrategy" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Effectiveness</CardTitle>
                    <CardDescription>Comparative analysis of different trading strategies</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md">
                      <div className="grid grid-cols-6 font-medium text-sm bg-muted p-3 border-b">
                        <div className="col-span-2">Strategy</div>
                        <div>Alerts</div>
                        <div>Avg. Gain</div>
                        <div>Success Rate</div>
                        <div>Avg. Hold Time</div>
                      </div>
                      <div className="divide-y">
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="col-span-2 font-medium">Momentum Breakouts</div>
                          <div>24</div>
                          <div className="text-green-600">+23.8%</div>
                          <div>87%</div>
                          <div>36 days</div>
                        </div>
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="col-span-2 font-medium">Support Reversals</div>
                          <div>19</div>
                          <div className="text-green-600">+16.4%</div>
                          <div>78%</div>
                          <div>42 days</div>
                        </div>
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="col-span-2 font-medium">Trend Following</div>
                          <div>22</div>
                          <div className="text-green-600">+19.7%</div>
                          <div>81%</div>
                          <div>45 days</div>
                        </div>
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="col-span-2 font-medium">Gap Fill</div>
                          <div>12</div>
                          <div className="text-green-600">+11.3%</div>
                          <div>67%</div>
                          <div>28 days</div>
                        </div>
                        <div className="grid grid-cols-6 py-3 px-3 text-sm">
                          <div className="col-span-2 font-medium">Mean Reversion</div>
                          <div>10</div>
                          <div className="text-green-600">+13.5%</div>
                          <div>70%</div>
                          <div>21 days</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Strategy Success by Market Condition</CardTitle>
                      <CardDescription>Performance across different market environments</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Bull Market</span>
                            <span className="font-medium">91% Success</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="h-2 bg-green-500 rounded-full" style={{ width: '91%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Range-Bound</span>
                            <span className="font-medium">76% Success</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="h-2 bg-amber-500 rounded-full" style={{ width: '76%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Bear Market</span>
                            <span className="font-medium">62% Success</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="h-2 bg-red-500 rounded-full" style={{ width: '62%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>High Volatility</span>
                            <span className="font-medium">68% Success</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="h-2 bg-blue-500 rounded-full" style={{ width: '68%' }}></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Low Volatility</span>
                            <span className="font-medium">87% Success</span>
                          </div>
                          <div className="w-full h-2 bg-muted rounded-full">
                            <div className="h-2 bg-purple-500 rounded-full" style={{ width: '87%' }}></div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Strategy Recommendations</CardTitle>
                      <CardDescription>AI-powered strategy recommendations based on current market conditions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-green-800">Momentum Breakouts</h3>
                            <p className="text-sm text-green-700">Highly effective in current market conditions. Focus on technology and healthcare sectors.</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-start">
                          <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-blue-800">Support Reversals</h3>
                            <p className="text-sm text-blue-700">Effective for value plays. Look for stocks with strong fundamentals that are oversold.</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
                          <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-amber-800">Gap Fill</h3>
                            <p className="text-sm text-amber-700">Use with caution in current volatile market. Best for stocks with predictable trading patterns.</p>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-start">
                          <XCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-medium text-red-800">Mean Reversion</h3>
                            <p className="text-sm text-red-700">Not recommended during current trend. Wait for more stable market conditions.</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <div className="text-center py-16 border rounded-md bg-muted/10">
            <div className="flex flex-col items-center">
              <LineChart className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Performance Data Available</h3>
              <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
                Once you've created stock alerts and they've been active for a period of time, 
                performance metrics will be calculated and displayed here.
              </p>
              <Button asChild>
                <Link href="/admin/create-alert">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Alert
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}