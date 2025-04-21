import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { StockAlert } from "@shared/schema";

// Extended stock alert props for detail view
interface StockAlertWithExtras {
  changePercent?: string;
}
import { Loader2, ArrowLeft, ChartLine, Target, TrendingUp, AlertCircle, Info, Calendar, BarChart4, TrendingDown, BadgeAlert, ArrowDownToLine, CheckCircle, Check, Activity, CheckSquare } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { useWebSocket } from "@/hooks/use-websocket";
import { format } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function StockDetail() {
  const [, params] = useRoute("/stock-detail/:id");
  const stockId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { connected } = useWebSocket();

  // Fetch stock alert details by ID
  const { data: alert, isLoading: isLoadingAlert } = useQuery<StockAlert>({
    queryKey: [`/api/stock-alerts/${stockId}`],
    enabled: !!stockId,
  });

  // Add to portfolio mutation
  const addToPortfolio = useMutation({
    mutationFn: async () => {
      if (!alert) throw new Error("Stock alert not found");
      
      const portfolioItem = {
        stockAlertId: alert.id,
        boughtPrice: alert.currentPrice,
        quantity,
        notifyTarget1: true,
        notifyTarget2: true,
        notifyTarget3: true,
        customTargetPercent: null,
      };
      
      const res = await apiRequest("POST", "/api/portfolio", portfolioItem);
      return await res.json();
    },
    onSuccess: () => {
      setIsAddingToPortfolio(false);
      toast({
        title: "Added to portfolio",
        description: `${alert?.symbol} has been added to your portfolio.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add to portfolio",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoadingAlert || !alert) {
    return (
      <MainLayout title="Stock Details">
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  // Calculate various metrics
  const buyZoneRange = alert.buyZoneMax - alert.buyZoneMin;
  const pricePosition = Math.min(
    Math.max(
      ((alert.currentPrice - alert.buyZoneMin) / buyZoneRange) * 100,
      0
    ),
    100
  );

  const target1Percent = ((alert.target1 / alert.currentPrice) - 1) * 100;
  const target2Percent = ((alert.target2 / alert.currentPrice) - 1) * 100;
  const target3Percent = ((alert.target3 / alert.currentPrice) - 1) * 100;

  const inBuyZone = alert.currentPrice >= alert.buyZoneMin && alert.currentPrice <= alert.buyZoneMax;
  
  // Format dates
  const alertDate = new Date(alert.createdAt);
  const formattedDate = alertDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <MainLayout title={`${alert.symbol} - ${alert.companyName}`}>
      {/* Back Button */}
      <Link href="/stock-alerts">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Stock Alerts
        </Button>
      </Link>
      
      {/* Stock Header */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{alert.symbol}</h1>
              <Badge 
                variant={inBuyZone ? "success" : "secondary"}
                className="ml-2"
              >
                {inBuyZone ? "In Buy Zone" : "Outside Buy Zone"}
              </Badge>
              {connected && 
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Live Data
                </Badge>
              }
            </div>
            <p className="text-lg text-muted-foreground">{alert.companyName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-muted-foreground mb-1">Current Price</p>
            <div className="flex items-center justify-end">
              <p className="text-2xl font-bold">${alert.currentPrice.toFixed(2)}</p>
            </div>
            <p className="text-sm text-muted-foreground">Last updated: {new Date(alert.updatedAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-medium mb-2">Buy Zone</h3>
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Buy Zone Min</p>
                      <p className="text-xl font-bold">${alert.buyZoneMin.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Buy Zone Max</p>
                      <p className="text-xl font-bold">${alert.buyZoneMax.toFixed(2)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <h3 className="font-medium mb-2">Alert Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Date Added</p>
                <p>{formattedDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {/* 1. Active - currently active and not marked "closed" */}
                  {alert.status !== "closed" && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 flex items-center gap-1">
                      <Activity className="h-3 w-3" /> Active
                    </Badge>
                  )}
                  
                  {/* 2. Buy zone - currently active and price is between buy zone high and low */}
                  {alert.status !== "closed" && inBuyZone && (
                    <Badge variant="success" className="flex items-center gap-1">
                      <ArrowDownToLine className="h-3 w-3" /> Buy Zone
                    </Badge>
                  )}
                  
                  {/* 3. High risk/reward - currently active and price has dropped below the buy zone low */}
                  {alert.status !== "closed" && alert.currentPrice < alert.buyZoneMin && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" /> High Risk/Reward
                    </Badge>
                  )}
                  
                  {/* 4. Nearing targets - can be either active or closed, but is within 10% of any of the listed targets AND above buy zone */}
                  {alert.currentPrice > alert.buyZoneMax && 
                   ((alert.currentPrice >= alert.target1 * 0.9 && alert.currentPrice < alert.target1) ||
                    (alert.currentPrice >= alert.target2 * 0.9 && alert.currentPrice < alert.target2) ||
                    (alert.currentPrice >= alert.target3 * 0.9 && alert.currentPrice < alert.target3)) && (
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 flex items-center gap-1">
                      <Target className="h-3 w-3" /> Nearing Targets
                    </Badge>
                  )}
                  
                  {/* 5. Hit targets - recently hit one of the targets */}
                  {((alert.currentPrice >= alert.target1) || 
                    (alert.currentPrice >= alert.target2) || 
                    (alert.currentPrice >= alert.target3)) && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
                      <CheckSquare className="h-3 w-3" /> Target Hit
                    </Badge>
                  )}
                  
                  {/* 6. Closed - has hit target 1 at some point and is now considered closed */}
                  {alert.status === "closed" && (
                    <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Closed
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Price Targets</h3>
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Target 1</p>
                    <p className="text-xl font-bold">${alert.target1.toFixed(2)}</p>
                    <p className="text-sm text-green-600">+{target1Percent.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Target 2</p>
                    <p className="text-xl font-bold">${alert.target2.toFixed(2)}</p>
                    <p className="text-sm text-green-600">+{target2Percent.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Target 3</p>
                    <p className="text-xl font-bold">${alert.target3.toFixed(2)}</p>
                    <p className="text-sm text-green-600">+{target3Percent.toFixed(1)}%</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-4 space-y-2">
              <Button 
                className="w-full"
                onClick={() => setIsAddingToPortfolio(true)}
              >
                Add to Portfolio
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                asChild
              >
                <Link href={`/alert-settings?stock=${alert.id}`}>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Customize Alerts
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Advanced Price Visualization */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center mb-4">
          <ChartLine className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Price Analysis</h2>
        </div>

        <div className="mt-4 mb-8">
          <div className="relative h-16 mb-10">
            {/* Main progress bar container */}
            <div className="absolute top-0 w-full h-4 bg-gray-100 rounded-full overflow-visible">
              {/* High Risk/Reward Zone (10% below buy zone - fixed width) */}
              <div 
                className="absolute h-full bg-orange-100 rounded-l-full"
                style={{ 
                  width: "15%",
                  left: "0%"
                }}
              ></div>

              {/* Buy Zone */}
              <div 
                className="absolute h-full bg-green-100"
                style={{ 
                  width: "15%",
                  left: "15%"
                }}
              ></div>

              {/* Target Zone - from buy zone max to target 3 */}
              <div 
                className="absolute h-full bg-gray-100"
                style={{ 
                  width: "55%",
                  left: "30%"
                }}
              ></div>

              {/* Overperform Zone - beyond target 3 */}
              <div 
                className="absolute h-full bg-blue-50 rounded-r-full"
                style={{ 
                  width: "15%",
                  left: "85%"
                }}
              ></div>

              {/* Buy Zone Min indicator */}
              <div className="absolute w-0.5 h-6 bg-green-700 top-0" style={{ left: "15%" }}>
                <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${alert.buyZoneMin}</div>
              </div>
              
              {/* Buy Zone Max indicator */}
              <div className="absolute w-0.5 h-6 bg-green-700 top-0" style={{ left: "30%" }}>
                <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${alert.buyZoneMax}</div>
              </div>
              
              {/* Target 1 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
                left: (() => {
                  // Calculate position proportionally in the 55% target zone space (30% to 85%)
                  const targetZoneWidth = alert.target3 - alert.buyZoneMax;
                  const t1Position = (alert.target1 - alert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (t1Position * 55)}%`;
                })()
              }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 1</span>
                  <span className="block text-xs font-medium font-mono">${alert.target1}</span>
                  <span className="block text-xs text-green-600">+{(((alert.target1 / alert.currentPrice) - 1) * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Target 2 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
                left: (() => {
                  // Calculate position proportionally in the 55% target zone space (30% to 85%)
                  const targetZoneWidth = alert.target3 - alert.buyZoneMax;
                  const t2Position = (alert.target2 - alert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (t2Position * 55)}%`;
                })()
              }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 2</span>
                  <span className="block text-xs font-medium font-mono">${alert.target2}</span>
                  <span className="block text-xs text-green-600">+{(((alert.target2 / alert.currentPrice) - 1) * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Target 3 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ left: "85%" }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 3</span>
                  <span className="block text-xs font-medium font-mono">${alert.target3}</span>
                  <span className="block text-xs text-green-600">+{(((alert.target3 / alert.currentPrice) - 1) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Current price indicator (thicker) */}
              <div className="absolute w-1 h-8 bg-black -top-2 z-10" style={{ 
                left: (() => {
                  if (alert.currentPrice < alert.buyZoneMin * 0.9) {
                    return "0%"; // Below high risk zone
                  } else if (alert.currentPrice < alert.buyZoneMin) {
                    // In high risk zone (0-15%)
                    const riskRange = alert.buyZoneMin - (alert.buyZoneMin * 0.9);
                    const posInRange = (alert.currentPrice - (alert.buyZoneMin * 0.9)) / riskRange;
                    return `${posInRange * 15}%`;
                  } else if (alert.currentPrice <= alert.buyZoneMax) {
                    // In buy zone (15-30%)
                    const buyRange = alert.buyZoneMax - alert.buyZoneMin;
                    const posInRange = (alert.currentPrice - alert.buyZoneMin) / buyRange;
                    return `${15 + (posInRange * 15)}%`;
                  } else if (alert.currentPrice <= alert.target3) {
                    // Between buy zone max and target 3 (30-85%)
                    const targetZoneWidth = alert.target3 - alert.buyZoneMax;
                    const posInRange = (alert.currentPrice - alert.buyZoneMax) / targetZoneWidth;
                    return `${30 + (posInRange * 55)}%`;
                  } else {
                    // In overperform zone or beyond
                    const overRange = alert.target3 * 1.1 - alert.target3;
                    const posInRange = Math.min((alert.currentPrice - alert.target3) / overRange, 1);
                    return `${85 + (posInRange * 15)}%`;
                  }
                })()
              }}>
                <div className="absolute -top-14 -translate-x-1/2 text-center w-24">
                  <span className="text-[10px] font-medium block">Current Price</span>
                  <span className="text-xs font-medium block font-mono">${alert.currentPrice.toFixed(2)}</span>
                  {alert.currentPrice > alert.buyZoneMax && (
                    <span className="text-[10px] text-green-600 block">
                      +{(((alert.currentPrice / alert.buyZoneMax) - 1) * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Zone labels below progress bar */}
            <div className="absolute top-14 left-0 w-full flex text-[10px]">
              <div className="w-[15%] text-center text-amber-700">High Risk/Reward</div>
              <div className="w-[15%] text-center text-green-700">Buy Zone</div>
              <div className="w-[55%]"></div>
              <div className="w-[15%] text-center text-blue-700">Overperform</div>
            </div>
          </div>
        </div>

        {/* Chart Images */}
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-3">Chart Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="font-medium text-sm mb-2">Daily Chart</p>
              <div className="border rounded-md overflow-hidden bg-gray-50 aspect-w-16 aspect-h-9">
                {alert.chartImageUrl ? (
                  <a 
                    href={alert.chartImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <img 
                      src={alert.chartImageUrl} 
                      alt={`${alert.symbol} Daily Chart`} 
                      className="object-contain w-full h-full hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-black bg-opacity-50 text-white p-2 rounded-md">
                        Click to enlarge
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <BarChart4 className="h-8 w-8 mr-2" />
                    <span>Chart not available</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <p className="font-medium text-sm mb-2">Weekly Chart</p>
              <div className="border rounded-md overflow-hidden bg-gray-50 aspect-w-16 aspect-h-9">
                {alert.chartImageUrl ? (
                  <a 
                    href={alert.chartImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer"
                  >
                    <img 
                      src={alert.chartImageUrl} 
                      alt={`${alert.symbol} Weekly Chart`} 
                      className="object-contain w-full h-full hover:opacity-90 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="bg-black bg-opacity-50 text-white p-2 rounded-md">
                        Click to enlarge
                      </div>
                    </div>
                  </a>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <BarChart4 className="h-8 w-8 mr-2" />
                    <span>Weekly chart not available</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Thesis */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center mb-6">
          <Target className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Investment Thesis</h2>
        </div>
        
        {/* Target Prices Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Target Prices & Potential Returns</h3>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Current Price</p>
              <p className="text-xl font-bold">${alert.currentPrice.toFixed(2)}</p>
            </div>
          </div>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[8%]">Target</TableHead>
                <TableHead className="w-[8%]">Price</TableHead>
                <TableHead className="w-[12%]">From Current</TableHead>
                <TableHead className="w-[11%]">From Buy Low</TableHead>
                <TableHead className="w-[11%]">From Buy High</TableHead>
                <TableHead className="w-[50%]">Target Reasoning</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Target 1</TableCell>
                <TableCell>${alert.target1.toFixed(2)}</TableCell>
                <TableCell className="text-green-600">+{(((alert.target1 / alert.currentPrice) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-green-600">+{(((alert.target1 / alert.buyZoneMin) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-green-600">+{(((alert.target1 / alert.buyZoneMax) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Initial profit target at first resistance level. Look for momentum and volume to continue.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Target 2</TableCell>
                <TableCell>${alert.target2.toFixed(2)}</TableCell>
                <TableCell className="text-green-600">+{(((alert.target2 / alert.currentPrice) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-green-600">+{(((alert.target2 / alert.buyZoneMin) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-green-600">+{(((alert.target2 / alert.buyZoneMax) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Secondary target based on previous highs. Consider taking partial profits here.
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Target 3</TableCell>
                <TableCell>${alert.target3.toFixed(2)}</TableCell>
                <TableCell className="text-green-600">+{(((alert.target3 / alert.currentPrice) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-green-600">+{(((alert.target3 / alert.buyZoneMin) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-green-600">+{(((alert.target3 / alert.buyZoneMax) - 1) * 100).toFixed(2)}%</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Extended target for longer-term holders. Requires strong breakout and market conditions.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        
        {/* Confluence Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Confluences Supporting the Buy</h3>
          
          {/* Price-Based Confluences */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Price-Based Confluences</h4>
            <div className="space-y-3">
              {["Support Zone Strength", "Resistance Turned Support", "Bullish Trend Line Support", "Trendline Break", "4-Hour Trend Line Break"]
                .filter(reason => Array.isArray(alert.technicalReasons) && alert.technicalReasons.includes(reason))
                .map((reason, index) => (
                  <div key={index} className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                    <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTechnicalReasonDescription(reason)}
                      </p>
                    </div>
                  </div>
                ))}
              
              {/* For demo, show at least one item from each category if there are no matches */}
              {(!Array.isArray(alert.technicalReasons) || !alert.technicalReasons.some(r => 
                ["Support Zone Strength", "Resistance Turned Support", "Bullish Trend Line Support", "Trendline Break", "4-Hour Trend Line Break"].includes(r)
              )) && (
                <div className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                  <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Support Zone Strength</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTechnicalReasonDescription("Support Zone Strength")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Volume-Based Confluences */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Volume-Based Confluences</h4>
            <div className="space-y-3">
              {["Volume Spike/Volume - Buy at the Lows", "High Volume Node"]
                .filter(reason => Array.isArray(alert.technicalReasons) && alert.technicalReasons.includes(reason))
                .map((reason, index) => (
                  <div key={index} className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                    <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTechnicalReasonDescription(reason)}
                      </p>
                    </div>
                  </div>
                ))}
              
              {/* For demo, show at least one item if there are no matches */}
              {(!Array.isArray(alert.technicalReasons) || !alert.technicalReasons.some(r => 
                ["Volume Spike/Volume - Buy at the Lows", "High Volume Node"].includes(r)
              )) && (
                <div className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                  <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">High Volume Node</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTechnicalReasonDescription("High Volume Node")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Momentum Indicators */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Momentum Indicators</h4>
            
            {/* Daily Indicators */}
            <h5 className="text-sm font-medium mb-2 text-muted-foreground">Daily Indicators</h5>
            <div className="space-y-3 mb-4">
              {["Daily MACD Turning Up", "Daily MACD Cross", "Daily MACD Divergence", "Daily RSI Divergence", "Daily RSI Oversold"]
                .filter(reason => Array.isArray(alert.technicalReasons) && alert.technicalReasons.includes(reason))
                .map((reason, index) => (
                  <div key={index} className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                    <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTechnicalReasonDescription(reason)}
                      </p>
                    </div>
                  </div>
                ))}
                
              {/* For demo, show at least one item if there are no matches */}
              {(!Array.isArray(alert.technicalReasons) || !alert.technicalReasons.some(r => 
                ["Daily MACD Turning Up", "Daily MACD Cross", "Daily MACD Divergence", "Daily RSI Divergence", "Daily RSI Oversold"].includes(r)
              )) && (
                <div className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                  <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Daily RSI Oversold</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTechnicalReasonDescription("Daily RSI Oversold")}
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Weekly Indicators */}
            <h5 className="text-sm font-medium mb-2 text-muted-foreground">Weekly Indicators</h5>
            <div className="space-y-3">
              {["Weekly MACD Turning Up", "Weekly MACD Cross", "Weekly MACD Divergence", "Weekly RSI Divergence", "Weekly RSI Oversold"]
                .filter(reason => Array.isArray(alert.technicalReasons) && alert.technicalReasons.includes(reason))
                .map((reason, index) => (
                  <div key={index} className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                    <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTechnicalReasonDescription(reason)}
                      </p>
                    </div>
                  </div>
                ))}
                
              {/* For demo, show at least one item if there are no matches */}
              {(!Array.isArray(alert.technicalReasons) || !alert.technicalReasons.some(r => 
                ["Weekly MACD Turning Up", "Weekly MACD Cross", "Weekly MACD Divergence", "Weekly RSI Divergence", "Weekly RSI Oversold"].includes(r)
              )) && (
                <div className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                  <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Weekly MACD Turning Up</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTechnicalReasonDescription("Weekly MACD Turning Up")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Chart Patterns */}
          <div className="mb-6">
            <h4 className="text-md font-medium mb-3">Chart Patterns</h4>
            <div className="space-y-3">
              {["Wyckoff Pattern", "Weinstein Analysis"]
                .filter(reason => Array.isArray(alert.technicalReasons) && alert.technicalReasons.includes(reason))
                .map((reason, index) => (
                  <div key={index} className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                    <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTechnicalReasonDescription(reason)}
                      </p>
                    </div>
                  </div>
                ))}
                
              {/* For demo, show at least one item if there are no matches */}
              {(!Array.isArray(alert.technicalReasons) || !alert.technicalReasons.some(r => 
                ["Wyckoff Pattern", "Weinstein Analysis"].includes(r)
              )) && (
                <div className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                  <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Wyckoff Pattern</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTechnicalReasonDescription("Wyckoff Pattern")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sentiment & Insider Activity */}
          <div>
            <h4 className="text-md font-medium mb-3">Sentiment & Insider Activity</h4>
            <div className="space-y-3">
              {["Insider Buys", "Dark Pool Print"]
                .filter(reason => Array.isArray(alert.technicalReasons) && alert.technicalReasons.includes(reason))
                .map((reason, index) => (
                  <div key={index} className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                    <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getTechnicalReasonDescription(reason)}
                      </p>
                    </div>
                  </div>
                ))}
                
              {/* For demo, show at least one item if there are no matches */}
              {(!Array.isArray(alert.technicalReasons) || !alert.technicalReasons.some(r => 
                ["Insider Buys", "Dark Pool Print"].includes(r)
              )) && (
                <div className="flex items-start bg-green-50 p-3 rounded-md border border-green-100">
                  <Check className="h-5 w-5 text-green-600 mt-1 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Insider Buys</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {getTechnicalReasonDescription("Insider Buys")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Qualitative Analysis */}
        <div className="mb-8">
          <h3 className="text-lg font-medium mb-4">Qualitative Analysis</h3>
          <div className="prose prose-blue max-w-none bg-gray-50 p-4 rounded-md">
            <p>
              {alert.symbol} ({alert.companyName}) is currently trading at ${alert.currentPrice.toFixed(2)}. 
              Our analysis suggests a buy zone between ${alert.buyZoneMin.toFixed(2)} and ${alert.buyZoneMax.toFixed(2)}, 
              with targets at ${alert.target1.toFixed(2)}, ${alert.target2.toFixed(2)}, and ${alert.target3.toFixed(2)}.
            </p>
            <p>
              {alert.symbol} presents a compelling opportunity based on our technical analysis and market positioning. 
              The stock has shown resilience in recent market conditions and demonstrates potential for continued growth.
              {Array.isArray(alert.technicalReasons) && alert.technicalReasons.length > 0 && (
                <span> Key factors supporting our thesis include {alert.technicalReasons.join(", ")}.</span>
              )}
            </p>
          </div>
        </div>
        
        {/* Risk Factors */}
        <div>
          <h3 className="text-lg font-medium mb-4">Risk Factors</h3>
          <div className="space-y-4">
            <div className="flex items-start bg-amber-50 p-4 rounded-md">
              <BadgeAlert className="h-5 w-5 text-amber-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Market Volatility</p>
                <p className="text-sm text-muted-foreground mt-1">
                  General market conditions could affect stock performance regardless of company fundamentals.
                </p>
              </div>
            </div>
            <div className="flex items-start bg-amber-50 p-4 rounded-md">
              <BadgeAlert className="h-5 w-5 text-amber-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Competitive Pressure</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Increased competition in the sector may impact growth and profitability.
                </p>
              </div>
            </div>
            <div className="flex items-start bg-amber-50 p-4 rounded-md">
              <BadgeAlert className="h-5 w-5 text-amber-500 mt-1 mr-3 flex-shrink-0" />
              <div>
                <p className="font-medium">Earnings Expectations</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Failure to meet earnings expectations in upcoming quarters could result in downward pressure on the stock.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add to Portfolio Dialog */}
      <Dialog open={isAddingToPortfolio} onOpenChange={setIsAddingToPortfolio}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {alert.symbol} to Portfolio</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Price:</span>
              <span className="font-mono">${alert.currentPrice.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={e => setQuantity(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Value:</span>
              <span className="font-mono">${(alert.currentPrice * quantity).toFixed(2)}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddingToPortfolio(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => addToPortfolio.mutate()}
              disabled={quantity <= 0 || addToPortfolio.isPending}
            >
              {addToPortfolio.isPending ? "Adding..." : "Add to Portfolio"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

// Helper function to get descriptions for technical reasons
function getTechnicalReasonDescription(reason: string): string {
  const descriptions: Record<string, string> = {
    // Price-Based Confluences
    "Support Zone Strength": "The stock has repeatedly found support at this price level, indicating strong buyer interest.",
    "Resistance Turned Support": "Previous resistance level has now become support, providing a solid foundation for upward movement.",
    "Bullish Trend Line Support": "The stock is bouncing off an established upward trend line, confirming the trend's strength.",
    "Trendline Break": "The stock has broken above a significant downtrend line, suggesting a potential trend reversal.",
    "4-Hour Trend Line Break": "A break above a short-term trend line on the 4-hour chart indicates building momentum.",
    
    // Volume-Based Confluences
    "Volume Spike/Volume - Buy at the Lows": "Significant volume increase at lower prices suggests institutional accumulation.",
    "High Volume Node": "Price is consolidating at a level with historically high trading volume, indicating strong support.",
    
    // Momentum Indicators
    // Daily Indicators
    "Daily MACD Turning Up": "The Daily MACD indicator is turning upward, signaling potential buying momentum.",
    "Daily MACD Cross": "The MACD line has crossed above the signal line on the daily chart, a bullish signal.",
    "Daily MACD Divergence": "Positive divergence between price and MACD suggests underlying strength despite price action.",
    "Daily RSI Divergence": "RSI is showing positive divergence from price, indicating potential reversal.",
    "Daily RSI Oversold": "The daily RSI indicates the stock is oversold, suggesting a potential bounce.",
    
    // Weekly Indicators
    "Weekly MACD Turning Up": "The Weekly MACD indicator is turning upward, signaling stronger long-term momentum.",
    "Weekly MACD Cross": "The MACD line has crossed above the signal line on the weekly chart, a strong bullish signal.",
    "Weekly MACD Divergence": "Positive divergence between price and MACD on the weekly timeframe suggests strong underlying bullish momentum.",
    "Weekly RSI Divergence": "Weekly RSI shows positive divergence, indicating potential for longer-term reversal.",
    "Weekly RSI Oversold": "The weekly RSI indicates the stock is oversold, suggesting potential for significant recovery.",
    
    // Chart Patterns
    "Wyckoff Pattern": "Price action matches Wyckoff accumulation pattern, suggesting institutional buying.",
    "Weinstein Analysis": "According to Weinstein's stage analysis, the stock is entering or in Stage 2 (advancing phase).",
    
    // Sentiment & Insider Activity
    "Insider Buys": "Company insiders have been purchasing shares, indicating confidence in future prospects.",
    "Dark Pool Print": "Significant dark pool buying activity detected, suggesting institutional accumulation.",
    
    // Legacy items (kept for backward compatibility)
    "Support Level": "The stock has reached a price level where historical trading shows strong buyer interest, suggesting a potential rebound.",
    "Price Consolidation": "The stock is trading within a narrow range, indicating potential energy buildup before the next move.",
    "Oversold Conditions": "Technical indicators suggest the stock is undervalued after recent selling pressure.",
    "Value Play": "Fundamental analysis indicates the stock is trading below its intrinsic value.",
    "Bullish Pattern": "Chart patterns indicate a potential upward price movement in the near future.",
    "Breakout Pattern": "The stock has broken through a significant resistance level with increased volume.",
    "Technical Support": "Multiple technical indicators suggest strong support at current price levels.",
    "Volume Pattern": "Recent volume activity indicates institutional accumulation rather than distribution.",
    "Trend Resumption": "After a brief pullback, the primary upward trend appears to be resuming.",
    "Upward Trend": "The stock is in an established uptrend, demonstrating a pattern of higher highs and higher lows.",
    "Technical Breakout": "The stock has confirmed a break above a significant resistance level.",
    "Revenue Growth": "The company has demonstrated strong and sustainable revenue growth in recent reports.",
    "Earnings Beat": "Recent quarterly earnings significantly exceeded analyst expectations.",
    "Subscriber Growth": "User or subscriber metrics are showing accelerating growth beyond expectations.",
    "Ad Tier Success": "New advertising-based revenue streams are exceeding expectations.",
    "Content Slate": "Upcoming product releases or content offerings are anticipated to drive growth.",
    "Growth Potential": "The company has multiple paths to expand market share and increase revenue.",
    "Sector Momentum": "The entire industry sector is showing strong performance and positive momentum.",
    "Manufacturing Progress": "Production challenges are being resolved faster than anticipated.",
    "Chip Recovery": "Semiconductor shortages or supply chain issues are easing.",
    "Government Incentives": "New policies or subsidies are favorable for the company's growth.",
    "Fintech Recovery": "Digital payment and financial technology sector is showing renewed strength.",
    "AI Integration": "Artificial intelligence implementation is creating new revenue opportunities.",
    "Travel Resurgence": "Post-pandemic travel trends are accelerating beyond expectations.",
    "International Growth": "Expansion into new markets is progressing faster than anticipated.",
    "Turnaround Story": "New management or business strategy is showing early signs of success.",
    "Volume Increase": "Trading volume has increased significantly, indicating strong buyer interest.",
    "Accumulation Phase": "Institutional investors appear to be accumulating shares over time.",
    "Breakout Confirmation": "Recent price action has confirmed a successful breakout from a consolidation pattern.",
    "Sector Strength": "The company's sector is showing exceptional strength against the broader market.",
    "Earnings Growth": "The company has demonstrated consistent earnings growth in recent quarters.",
    "Streaming Growth": "Streaming services show accelerating user adoption and revenue growth.",
  };
  
  return descriptions[reason] || "Additional technical analysis and confluence factors indicate a favorable entry point.";
}