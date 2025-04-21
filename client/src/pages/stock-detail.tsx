import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { StockAlert } from "@shared/schema";

// Extended stock alert props for detail view
interface StockAlertWithExtras {
  changePercent?: string;
}
import { Loader2, ArrowLeft, ChartLine, Target, TrendingUp, AlertCircle, Info, Calendar, BarChart4, TrendingDown, BadgeAlert } from "lucide-react";
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

export default function StockDetail() {
  const [, params] = useRoute("/stock/:id");
  const stockSymbol = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { connected } = useWebSocket();

  // Fetch all stock alerts
  const { data: allAlerts, isLoading: isLoadingAlerts } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts"],
  });

  // Find the specific alert for this symbol
  const alert = allAlerts?.find(a => a.symbol === stockSymbol);

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

  if (isLoadingAlerts || !alert) {
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
            <div className="flex items-center justify-end">
              <p className="text-2xl font-bold">${alert.currentPrice.toFixed(2)}</p>
              {/* Placeholder for change percent - would come from a real API */}
              <span className="ml-2 text-sm font-semibold text-green-600">
                +2.3%
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Last updated: {new Date(alert.updatedAt).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <h3 className="font-medium mb-2">Buy Zone</h3>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>${alert.buyZoneMin.toFixed(2)}</span>
                <span>${alert.buyZoneMax.toFixed(2)}</span>
              </div>
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full" 
                    style={{ width: `${pricePosition}%` }}
                  ></div>
                </div>
                <div 
                  className="absolute w-0.5 h-4 bg-black -mt-3" 
                  style={{ left: `${pricePosition}%` }}
                ></div>
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
                <p>{alert.status}</p>
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
                  <img 
                    src={alert.chartImageUrl} 
                    alt={`${alert.symbol} Daily Chart`} 
                    className="object-contain w-full h-full"
                  />
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
                <div className="flex items-center justify-center h-full text-gray-400">
                  <BarChart4 className="h-8 w-8 mr-2" />
                  <span>Weekly chart not available</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investment Thesis */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center mb-4">
          <Target className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Investment Thesis</h2>
        </div>
        
        <Tabs defaultValue="reasons">
          <TabsList>
            <TabsTrigger value="reasons">Why Buy</TabsTrigger>
            <TabsTrigger value="risks">Risk Factors</TabsTrigger>
            <TabsTrigger value="narrative">Stock Narrative</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reasons">
            <div className="py-4">
              <div className="space-y-4">
                {(Array.isArray(alert.technicalReasons) ? alert.technicalReasons : []).map((reason, index) => (
                  <div key={index} className="flex items-start">
                    <TrendingUp className="h-5 w-5 text-primary mt-1 mr-2" />
                    <div>
                      <p className="font-medium">{reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {getTechnicalReasonDescription(reason)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="risks">
            <div className="py-4">
              <div className="space-y-4">
                <div className="flex items-start">
                  <TrendingDown className="h-5 w-5 text-red-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">Market Volatility</p>
                    <p className="text-sm text-muted-foreground">
                      General market conditions could affect stock performance regardless of company fundamentals.
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <BadgeAlert className="h-5 w-5 text-amber-500 mt-1 mr-2" />
                  <div>
                    <p className="font-medium">Competitive Pressure</p>
                    <p className="text-sm text-muted-foreground">
                      Increased competition in the sector may impact growth and profitability.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="narrative">
            <div className="py-4">
              <div className="prose prose-blue">
                <p className="text-muted-foreground">
                  {alert.symbol} ({alert.companyName}) is currently trading at ${alert.currentPrice.toFixed(2)}. 
                  Our analysis suggests a buy zone between ${alert.buyZoneMin.toFixed(2)} and ${alert.buyZoneMax.toFixed(2)}, 
                  with targets at ${alert.target1.toFixed(2)}, ${alert.target2.toFixed(2)}, and ${alert.target3.toFixed(2)}.
                  {Array.isArray(alert.technicalReasons) && alert.technicalReasons.length > 0 && (
                    <span> The recommendation is based on {alert.technicalReasons.join(", ")}.</span>
                  )}
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
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
    "Support Level": "The stock has reached a price level where historical trading shows buyer interest, suggesting a potential rebound.",
    "Oversold RSI": "The Relative Strength Index indicates the stock may be undervalued after recent selling pressure.",
    "Earnings Beat": "The company reported quarterly earnings that exceeded analyst expectations.",
    "Breakout Pattern": "The stock has broken through a significant resistance level with increased volume.",
    "Upward Trend": "The stock is demonstrating a consistent pattern of higher highs and higher lows.",
    "Sector Momentum": "The industry sector is showing strong performance and positive momentum.",
    "Volume Increase": "Trading volume has increased significantly, indicating strong buyer interest.",
    "Revenue Growth": "The company has demonstrated strong revenue growth in recent financial reports.",
    "Bullish Pattern": "Technical chart patterns indicate a potential upward price movement.",
  };
  
  return descriptions[reason] || "Additional technical analysis indicates a favorable entry point.";
}