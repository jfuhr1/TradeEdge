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
            <div className="flex items-center">
              <h3 className="font-bold text-lg">{alert.symbol}</h3>
              <span className="ml-2 text-neutral-600">{alert.companyName}</span>
              <Badge 
                variant="outline" 
                className={`ml-2 text-xs ${
                  isNew 
                    ? "bg-green-100 text-profit" 
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                {dateDisplay}
              </Badge>
            </div>
            <div className="mt-1">
              <span className="text-lg font-bold font-mono">${alert.currentPrice.toFixed(2)}</span>
              <span className="text-profit text-sm ml-1">+1.8%</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Buy Zone</p>
            <p className="font-medium font-mono">${alert.buyZoneMin} - ${alert.buyZoneMax}</p>
          </div>
        </div>
        
        {/* Advanced Price Visualization */}
        <div className="mt-4 mb-4">
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    ${(alert.buyZoneMin * 0.9).toFixed(2)}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p>High Risk/Reward Zone (-10%)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="font-medium">${alert.buyZoneMin}</span>
            <span className="font-medium">${alert.buyZoneMax}</span>
            <span>${alert.target1}</span>
            <span>${alert.target2}</span>
            <span>${alert.target3}</span>
          </div>
          
          <div className="relative h-10 mt-2 mb-4">
            {/* Main progress bar container */}
            <div className="absolute top-3 w-full h-4 bg-gray-100 rounded-full overflow-visible">
              {/* High Risk/Reward Zone (10% below buy zone) */}
              <div 
                className="absolute h-full bg-amber-100 rounded-l-full"
                style={{ 
                  width: "20%",
                  left: "0%"
                }}
              ></div>

              {/* Buy Zone */}
              <div 
                className="absolute h-full bg-green-100"
                style={{ 
                  width: "20%",
                  left: "20%"
                }}
              ></div>

              {/* From buy zone to target 1 */}
              <div 
                className="absolute h-full bg-gray-100"
                style={{ 
                  width: "20%",
                  left: "40%"
                }}
              ></div>

              {/* From target 1 to target 2 */}
              <div 
                className="absolute h-full bg-gray-100"
                style={{ 
                  width: "15%",
                  left: "60%"
                }}
              ></div>

              {/* From target 2 to target 3 */}
              <div 
                className="absolute h-full bg-gray-100"
                style={{ 
                  width: "15%",
                  left: "75%"
                }}
              ></div>

              {/* Beyond target 3 */}
              <div 
                className="absolute h-full bg-gray-100 rounded-r-full"
                style={{ 
                  width: "10%",
                  left: "90%"
                }}
              ></div>

              {/* Vertical indicators */}
              {/* Buy Zone Min indicator */}
              <div className="absolute w-0.5 h-6 bg-green-700 -top-1" style={{ left: "20%" }}>
                <div className="absolute -top-4 -ml-3 text-[10px] text-green-700">Min</div>
              </div>
              
              {/* Buy Zone Max indicator */}
              <div className="absolute w-0.5 h-6 bg-green-700 -top-1" style={{ left: "40%" }}>
                <div className="absolute -top-4 -ml-3 text-[10px] text-green-700">Max</div>
              </div>
              
              {/* Target 1 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary -top-1" style={{ left: "60%" }}>
                <div className="absolute -top-4 -ml-3 text-[10px] text-primary">T1</div>
              </div>
              
              {/* Target 2 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary -top-1" style={{ left: "75%" }}>
                <div className="absolute -top-4 -ml-3 text-[10px] text-primary">T2</div>
              </div>
              
              {/* Target 3 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary -top-1" style={{ left: "90%" }}>
                <div className="absolute -top-4 -ml-3 text-[10px] text-primary">T3</div>
              </div>

              {/* Current price indicator (thicker) */}
              <div className="absolute w-1 h-8 bg-black -top-2 z-10" style={{ 
                left: (() => {
                  const lowPrice = alert.buyZoneMin * 0.9;
                  const highPrice = alert.target3 * 1.05;
                  const range = highPrice - lowPrice;
                  const position = ((alert.currentPrice - lowPrice) / range) * 100;
                  return `${Math.min(Math.max(position, 0), 100)}%`;
                })()
              }}>
                <div className="absolute top-8 -ml-7 text-[11px] font-medium">Current: ${alert.currentPrice.toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Target Prices */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="p-2 bg-neutral-100 rounded text-center">
            <p className="text-xs text-neutral-600">Target 1</p>
            <p className="font-bold font-mono">${alert.target1}</p>
            <p className="text-xs text-profit">+{target1Percent.toFixed(1)}%</p>
          </div>
          <div className="p-2 bg-neutral-100 rounded text-center">
            <p className="text-xs text-neutral-600">Target 2</p>
            <p className="font-bold font-mono">${alert.target2}</p>
            <p className="text-xs text-profit">+{target2Percent.toFixed(1)}%</p>
          </div>
          <div className="p-2 bg-neutral-100 rounded text-center">
            <p className="text-xs text-neutral-600">Target 3</p>
            <p className="font-bold font-mono">${alert.target3}</p>
            <p className="text-xs text-profit">+{target3Percent.toFixed(1)}%</p>
          </div>
        </div>
        
        {/* Technical Analysis */}
        <div className="mt-4">
          <p className="text-sm font-medium">Technical Reasons:</p>
          <div className="flex flex-wrap mt-1">
            {(Array.isArray(alert.technicalReasons) ? alert.technicalReasons : []).map((reason, index) => (
              <Badge 
                key={index} 
                variant="outline"
                className="bg-blue-50 text-primary border-0 mr-2 mb-2"
              >
                {reason}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="mt-4 flex justify-between">
          <Button 
            className="flex-1 mr-2"
            onClick={() => setIsAddingToPortfolio(true)}
          >
            Add to Portfolio
          </Button>
          <Link href={`/stock/${alert.id}`}>
            <Button 
              variant="outline" 
              className="flex-1 ml-2"
            >
              View Details
            </Button>
          </Link>
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
