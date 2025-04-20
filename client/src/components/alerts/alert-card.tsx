import { useMutation, useQueryClient } from "@tanstack/react-query";
import { StockAlert } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AlertCardProps {
  alert: StockAlert;
  className?: string;
}

export default function AlertCard({ alert, className = "" }: AlertCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Calculate the position on the progress bar (0-100%)
  const calculatePricePosition = (price: number, min: number, max: number) => {
    // Create a scale from min to max, mapping to 0-100%
    const range = max - min;
    const position = ((price - min) / range) * 100;
    return Math.min(Math.max(position, 0), 100);
  };

  // Calculate price status category
  const getPriceStatus = () => {
    const highRiskMin = alert.buyZoneMin * 0.9;
    
    if (alert.currentPrice < highRiskMin) {
      return "below-high-risk"; // Below high risk/reward zone
    } else if (alert.currentPrice < alert.buyZoneMin) {
      return "high-risk"; // In high risk/reward zone
    } else if (alert.currentPrice <= alert.buyZoneMax) {
      return "buy-zone"; // In buy zone
    } else if (alert.currentPrice <= alert.target1) {
      return "above-buy-zone"; // Between buy zone and target 1
    } else if (alert.currentPrice <= alert.target2) {
      return "target-1"; // Between target 1 and target 2
    } else if (alert.currentPrice <= alert.target3) {
      return "target-2"; // Between target 2 and target 3
    } else {
      return "above-target-3"; // Above target 3
    }
  };
  
  const priceStatus = getPriceStatus();

  // Calculate target percentages
  const target1Percent = ((alert.target1 / alert.currentPrice) - 1) * 100;
  const target2Percent = ((alert.target2 / alert.currentPrice) - 1) * 100;
  const target3Percent = ((alert.target3 / alert.currentPrice) - 1) * 100;

  // Get friendly date display
  const alertDate = new Date(alert.createdAt);
  const isNew = Date.now() - alertDate.getTime() < 24 * 60 * 60 * 1000;
  const daysAgo = Math.floor((Date.now() - alertDate.getTime()) / (24 * 60 * 60 * 1000));
  const dateDisplay = isNew ? 'New Alert' : `${daysAgo} days ago`;

  // Add to portfolio mutation
  const addToPortfolio = useMutation({
    mutationFn: async () => {
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
        description: `${alert.symbol} has been added to your portfolio.`,
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

  return (
    <>
      <div className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-md border ${
        priceStatus === "high-risk" 
          ? "border-amber-500" 
          : priceStatus === "buy-zone"
            ? "border-green-500"
            : "border-gray-200"
      } ${className}`}>
        <div className="flex justify-between">
          <div>
            <div className="flex items-center flex-wrap">
              <h3 className="font-bold text-lg">{alert.symbol}</h3>
              <span className="ml-2 text-neutral-600">{alert.companyName}</span>
              <div className="flex gap-1 ml-2">
                {isNew && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                    New Alert
                  </Badge>
                )}
                {priceStatus === "buy-zone" && (
                  <Badge variant="outline" className="bg-green-100 text-green-800 text-xs">
                    Buy Zone
                  </Badge>
                )}
                {priceStatus === "high-risk" && (
                  <Badge variant="outline" className="bg-orange-100 text-amber-800 text-xs">
                    High R/R
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Buy Zone</p>
            <p className="font-medium font-mono">${alert.buyZoneMin} - ${alert.buyZoneMax}</p>
          </div>
        </div>
        
        {/* Advanced Price Visualization */}
        <div className="mt-12 mb-6">
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
        
        {/* Action Buttons and Date */}
        <div className="mt-8">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <Button 
              className="py-6 w-full bg-primary hover:bg-primary/90"
              onClick={() => setIsAddingToPortfolio(true)}
            >
              Add to Portfolio
            </Button>
            <Link href={`/stock-detail/${alert.symbol}`} className="w-full">
              <Button 
                variant="outline" 
                className="py-6 w-full h-full border-primary text-primary hover:bg-primary/10"
              >
                View Details
              </Button>
            </Link>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-black">Alert Date</p>
            <p className="text-sm font-medium text-black">
              {format(new Date(alert.createdAt), 'MM/dd/yy')}
            </p>
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
    </>
  );
}
