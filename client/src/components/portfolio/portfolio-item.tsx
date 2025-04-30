import { PortfolioItem, StockAlert } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, BarChart2 } from "lucide-react";

interface PortfolioItemProps {
  item: PortfolioItem & { stockAlert: StockAlert };
}

export default function PortfolioItemComponent({ item }: PortfolioItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSelling, setIsSelling] = useState(false);
  const [sellPrice, setSellPrice] = useState(item.stockAlert.currentPrice);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate current profit/loss
  const buyValue = item.quantity * item.boughtPrice;
  const currentValue = item.quantity * item.stockAlert.currentPrice;
  const profit = currentValue - buyValue;
  const percentProfit = (profit / buyValue) * 100;
  
  // Calculate price status category
  const getPriceStatus = () => {
    const highRiskMin = item.stockAlert.buyZoneMin * 0.9;
    
    if (item.stockAlert.currentPrice < highRiskMin) {
      return "below-high-risk"; // Below high risk/reward zone
    } else if (item.stockAlert.currentPrice < item.stockAlert.buyZoneMin) {
      return "high-risk"; // In high risk/reward zone
    } else if (item.stockAlert.currentPrice <= item.stockAlert.buyZoneMax) {
      return "buy-zone"; // In buy zone
    } else if (item.stockAlert.currentPrice <= item.stockAlert.target1) {
      return "above-buy-zone"; // Between buy zone and target 1
    } else if (item.stockAlert.currentPrice <= item.stockAlert.target2) {
      return "target-1"; // Between target 1 and target 2
    } else if (item.stockAlert.currentPrice <= item.stockAlert.target3) {
      return "target-2"; // Between target 2 and target 3
    } else {
      return "above-target-3"; // Above target 3
    }
  };
  
  const priceStatus = getPriceStatus();

  // Calculate target percentages
  const target1Percent = ((item.stockAlert.target1 / item.stockAlert.currentPrice) - 1) * 100;
  const target2Percent = ((item.stockAlert.target2 / item.stockAlert.currentPrice) - 1) * 100;
  const target3Percent = ((item.stockAlert.target3 / item.stockAlert.currentPrice) - 1) * 100;

  // Get friendly date display
  let alertDate;
  let daysAgo = 0;
  
  try {
    alertDate = new Date(item.createdAt);
    daysAgo = Math.floor((Date.now() - alertDate.getTime()) / (24 * 60 * 60 * 1000));
  } catch (error) {
    console.error("Error parsing date:", error);
  }
  
  // Sell mutation
  const sellMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PUT", `/api/portfolio/${item.id}/sell`, {
        soldPrice: sellPrice,
      });
      return await res.json();
    },
    onSuccess: () => {
      setIsSelling(false);
      toast({
        title: "Position closed",
        description: `${item.stockAlert.symbol} has been sold successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to sell",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <>
      <div className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-md border mb-4 ${
        priceStatus === "high-risk" 
          ? "border-amber-500" 
          : priceStatus === "buy-zone"
            ? "border-green-500"
            : "border-gray-200"
      }`}>
        <div className="flex justify-between">
          <div>
            <div className="flex items-center flex-wrap">
              <h3 className="font-bold text-lg">{item.stockAlert.symbol}</h3>
              <span className="ml-2 text-neutral-600">{item.stockAlert.companyName}</span>
              <div className="flex gap-1 ml-2">
                <Badge variant="outline" className="bg-blue-100 text-primary text-xs">
                  Owned
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Buy Zone</p>
            <p className="font-medium font-mono">${item.stockAlert.buyZoneMin} - ${item.stockAlert.buyZoneMax}</p>
          </div>
        </div>
        

        
        {/* Advanced Price Visualization */}
        <div className="mt-8 mb-6">
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
                <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${item.stockAlert.buyZoneMin}</div>
              </div>
              
              {/* Buy Zone Max indicator */}
              <div className="absolute w-0.5 h-6 bg-green-700 top-0" style={{ left: "30%" }}>
                <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${item.stockAlert.buyZoneMax}</div>
              </div>
              
              {/* Target 1 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
                left: (() => {
                  // Calculate position proportionally in the 55% target zone space (30% to 85%)
                  const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                  const t1Position = (item.stockAlert.target1 - item.stockAlert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (t1Position * 55)}%`;
                })()
              }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 1</span>
                  <span className="block text-xs font-medium font-mono">${item.stockAlert.target1}</span>
                  <span className="block text-xs text-green-600">+{(((item.stockAlert.target1 / item.stockAlert.currentPrice) - 1) * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Target 2 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
                left: (() => {
                  // Calculate position proportionally in the 55% target zone space (30% to 85%)
                  const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                  const t2Position = (item.stockAlert.target2 - item.stockAlert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (t2Position * 55)}%`;
                })()
              }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 2</span>
                  <span className="block text-xs font-medium font-mono">${item.stockAlert.target2}</span>
                  <span className="block text-xs text-green-600">+{(((item.stockAlert.target2 / item.stockAlert.currentPrice) - 1) * 100).toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Target 3 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ left: "85%" }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 3</span>
                  <span className="block text-xs font-medium font-mono">${item.stockAlert.target3}</span>
                  <span className="block text-xs text-green-600">+{(((item.stockAlert.target3 / item.stockAlert.currentPrice) - 1) * 100).toFixed(1)}%</span>
                </div>
              </div>

              {/* Buy price indicator (amber color for buy) */}
              <div className="absolute w-1 h-10 bg-amber-500 -top-3 z-20" style={{ 
                left: (() => {
                  if (item.boughtPrice < item.stockAlert.buyZoneMin * 0.9) {
                    return "0%"; 
                  } else if (item.boughtPrice < item.stockAlert.buyZoneMin) {
                    const riskRange = item.stockAlert.buyZoneMin - (item.stockAlert.buyZoneMin * 0.9);
                    const posInRange = (item.boughtPrice - (item.stockAlert.buyZoneMin * 0.9)) / riskRange;
                    return `${posInRange * 15}%`;
                  } else if (item.boughtPrice <= item.stockAlert.buyZoneMax) {
                    const buyRange = item.stockAlert.buyZoneMax - item.stockAlert.buyZoneMin;
                    const posInRange = (item.boughtPrice - item.stockAlert.buyZoneMin) / buyRange;
                    return `${15 + (posInRange * 15)}%`;
                  } else if (item.boughtPrice <= item.stockAlert.target3) {
                    const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                    const posInRange = (item.boughtPrice - item.stockAlert.buyZoneMax) / targetZoneWidth;
                    return `${30 + (posInRange * 55)}%`;
                  } else {
                    const overRange = item.stockAlert.target3 * 1.1 - item.stockAlert.target3;
                    const posInRange = Math.min((item.boughtPrice - item.stockAlert.target3) / overRange, 1);
                    return `${85 + (posInRange * 15)}%`;
                  }
                })()
              }}>
                <div className="absolute -top-6 -translate-x-1/2 text-center w-24">
                  <span className="text-[10px] font-medium text-amber-700 block">Your Buy Price</span>
                  <span className="text-xs font-bold block font-mono text-amber-700">${item.boughtPrice.toFixed(2)}</span>
                  <span className="text-[10px] text-amber-700 block">
                    {item.quantity} shares
                  </span>
                </div>
              </div>

              {/* Current price indicator (thicker) */}
              <div className="absolute w-1 h-8 bg-black -top-2 z-10" style={{ 
                left: (() => {
                  if (item.stockAlert.currentPrice < item.stockAlert.buyZoneMin * 0.9) {
                    return "0%"; // Below high risk zone
                  } else if (item.stockAlert.currentPrice < item.stockAlert.buyZoneMin) {
                    // In high risk zone (0-15%)
                    const riskRange = item.stockAlert.buyZoneMin - (item.stockAlert.buyZoneMin * 0.9);
                    const posInRange = (item.stockAlert.currentPrice - (item.stockAlert.buyZoneMin * 0.9)) / riskRange;
                    return `${posInRange * 15}%`;
                  } else if (item.stockAlert.currentPrice <= item.stockAlert.buyZoneMax) {
                    // In buy zone (15-30%)
                    const buyRange = item.stockAlert.buyZoneMax - item.stockAlert.buyZoneMin;
                    const posInRange = (item.stockAlert.currentPrice - item.stockAlert.buyZoneMin) / buyRange;
                    return `${15 + (posInRange * 15)}%`;
                  } else if (item.stockAlert.currentPrice <= item.stockAlert.target3) {
                    // Between buy zone max and target 3 (30-85%)
                    const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                    const posInRange = (item.stockAlert.currentPrice - item.stockAlert.buyZoneMax) / targetZoneWidth;
                    return `${30 + (posInRange * 55)}%`;
                  } else {
                    // In overperform zone or beyond
                    const overRange = item.stockAlert.target3 * 1.1 - item.stockAlert.target3;
                    const posInRange = Math.min((item.stockAlert.currentPrice - item.stockAlert.target3) / overRange, 1);
                    return `${85 + (posInRange * 15)}%`;
                  }
                })()
              }}>
                <div className="absolute -top-14 -translate-x-1/2 text-center w-24">
                  <span className="text-[10px] font-medium block">Current Price</span>
                  <span className="text-xs font-medium block font-mono">${item.stockAlert.currentPrice.toFixed(2)}</span>
                  <span className={`text-[10px] ${percentProfit >= 0 ? 'text-green-600' : 'text-red-600'} block`}>
                    {percentProfit >= 0 ? '+' : ''}{percentProfit.toFixed(1)}%
                  </span>
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
        
        {/* Ownership Information */}
        <div className="mt-4 grid grid-cols-4 gap-4 p-2 bg-blue-50 rounded border border-blue-100">
          <div>
            <p className="text-xs text-neutral-600">Quantity</p>
            <p className="font-medium font-mono">{item.quantity}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-600">Buy Price</p>
            <p className="font-medium font-mono">${item.boughtPrice.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-600">Current Value</p>
            <p className="font-medium font-mono">${currentValue.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-neutral-600">Profit/Loss</p>
            <p className={`font-medium font-mono ${percentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {percentProfit >= 0 ? '+' : ''}{percentProfit.toFixed(2)}%
            </p>
          </div>
        </div>
        
        {/* Chart Image (Expandable) */}
        {isExpanded && (
          <div className="mt-6 mb-4 bg-gray-50 p-2 rounded">
            <div className="aspect-w-16 aspect-h-9 rounded overflow-hidden">
              {item.stockAlert.chartImageUrl ? (
                <img 
                  src={item.stockAlert.chartImageUrl} 
                  alt={`${item.stockAlert.symbol} Stock Chart`} 
                  className="object-cover w-full h-full"
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                  <BarChart2 size={48} />
                  <span className="ml-2">Chart image not available</span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Custom Target (if applicable) */}
        {item.customTargetPercent && (
          <div className="mt-4">
            <Badge variant="default" className="bg-blue-100 text-primary">
              Custom Target: {item.customTargetPercent}%
            </Badge>
          </div>
        )}

        {/* Action Buttons and Date */}
        <div className="flex justify-between items-end mt-8">
          <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
            <Button 
              className="py-4 w-full"
              onClick={() => setIsSelling(true)}
            >
              Sell Position
            </Button>
            <Link href={`/stock-detail/${item.stockAlert.id}`} className="w-full">
              <Button 
                variant="outline" 
                className="py-4 w-full h-full"
              >
                View Details
              </Button>
            </Link>
            <Button
              variant="outline"
              className="py-4 w-full"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Expand
                </>
              )}
            </Button>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-black">Purchase Date</p>
            <p className="text-sm font-medium text-black font-mono">
              {
                (() => {
                  try {
                    return format(new Date(item.createdAt), 'MM/dd/yy');
                  } catch (error) {
                    return "N/A";
                  }
                })()
              }
            </p>
          </div>
        </div>
      </div>
      
      {/* Sell Dialog */}
      <Dialog open={isSelling} onOpenChange={setIsSelling}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sell {item.stockAlert.symbol}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Market Price:</span>
              <span className="font-mono">${item.stockAlert.currentPrice.toFixed(2)}</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price</Label>
              <Input
                id="sellPrice"
                type="number"
                min="0.01"
                step="0.01"
                value={sellPrice}
                onChange={e => setSellPrice(parseFloat(e.target.value) || 0)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Quantity:</span>
              <span className="font-mono">{item.quantity}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Value:</span>
              <span className="font-mono">${(sellPrice * item.quantity).toFixed(2)}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="font-medium">Profit/Loss:</span>
              <span className={`font-mono ${(sellPrice - item.boughtPrice) >= 0 ? 'text-profit' : 'text-loss'}`}>
                ${((sellPrice - item.boughtPrice) * item.quantity).toFixed(2)} 
                ({((sellPrice / item.boughtPrice - 1) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsSelling(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => sellMutation.mutate()}
              disabled={sellPrice <= 0 || sellMutation.isPending}
            >
              {sellMutation.isPending ? "Selling..." : "Confirm Sell"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
