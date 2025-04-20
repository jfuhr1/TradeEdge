import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { StockAlert } from "@shared/schema";

// Extended stock alert type for detail view
interface DetailStockAlert extends StockAlert {
  changePercent?: string;
}
import { Loader2, ArrowLeft, ChartLine, Target, TrendingUp, AlertCircle } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function StockDetail() {
  const [, params] = useRoute("/stock/:id");
  const stockId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const { connected } = useWebSocket();

  // Fetch stock alert details
  const { data: alert, isLoading } = useQuery<DetailStockAlert>({
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

  if (isLoading || !alert) {
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
              {alert.changePercent && (
                <span className={`ml-2 text-sm font-semibold ${parseFloat(alert.changePercent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {parseFloat(alert.changePercent) >= 0 ? '+' : ''}{alert.changePercent}%
                </span>
              )}
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
            
            <div className="mt-4">
              <Button 
                className="w-full"
                onClick={() => setIsAddingToPortfolio(true)}
              >
                Add to Portfolio
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Technical Analysis */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center mb-4">
          <ChartLine className="mr-2 h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Technical Analysis</h2>
        </div>
        
        <Tabs defaultValue="reasons">
          <TabsList>
            <TabsTrigger value="reasons">Technical Reasons</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reasons">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-3">Why We Recommend This Stock</h3>
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
          
          <TabsContent value="analysis">
            <div className="py-4">
              <h3 className="text-lg font-medium mb-3">Detailed Analysis</h3>
              <p>Detailed technical analysis for {alert.symbol} will be available in the next update.</p>
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