import { PortfolioItem, StockAlert } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

interface PortfolioItemProps {
  item: PortfolioItem & { stockAlert: StockAlert };
}

export default function PortfolioItemComponent({ item }: PortfolioItemProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSelling, setIsSelling] = useState(false);
  const [sellPrice, setSellPrice] = useState(item.stockAlert.currentPrice);
  
  // Calculate current profit/loss
  const buyValue = item.quantity * item.boughtPrice;
  let currentValue = 0;
  let profit = 0;
  let percentProfit = 0;
  
  if (item.sold && item.soldPrice) {
    currentValue = item.quantity * item.soldPrice;
    profit = currentValue - buyValue;
    percentProfit = (profit / buyValue) * 100;
  } else {
    currentValue = item.quantity * item.stockAlert.currentPrice;
    profit = currentValue - buyValue;
    percentProfit = (profit / buyValue) * 100;
  }
  
  // Calculate percentages to targets
  const percentToTarget1 = (item.stockAlert.currentPrice / item.stockAlert.target1) * 100;
  const percentToTarget2 = (item.stockAlert.currentPrice / item.stockAlert.target2) * 100;
  const percentToTarget3 = (item.stockAlert.currentPrice / item.stockAlert.target3) * 100;
  
  // Find closest target
  let closestTarget = "target1";
  let closestPercent = percentToTarget1;
  
  if (Math.abs(100 - percentToTarget2) < Math.abs(100 - closestPercent)) {
    closestTarget = "target2";
    closestPercent = percentToTarget2;
  }
  
  if (Math.abs(100 - percentToTarget3) < Math.abs(100 - closestPercent)) {
    closestTarget = "target3";
    closestPercent = percentToTarget3;
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
      <Card className="mb-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <div className="flex items-center">
                <h3 className="font-bold text-lg">{item.stockAlert.symbol}</h3>
                <span className="ml-2 text-neutral-600">{item.stockAlert.companyName}</span>
                
                {item.sold ? (
                  <Badge variant="outline" className="ml-2 bg-neutral-100 text-neutral-600">
                    Closed
                  </Badge>
                ) : (
                  percentToTarget1 >= 90 || percentToTarget2 >= 90 || percentToTarget3 >= 90 ? (
                    <Badge variant="outline" className="ml-2 bg-green-100 text-profit">
                      Nearing Target
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="ml-2 bg-blue-100 text-primary">
                      Active
                    </Badge>
                  )
                )}
              </div>
              
              <div className="mt-1 flex items-center">
                <span className="text-lg font-bold font-mono">
                  ${item.stockAlert.currentPrice.toFixed(2)}
                </span>
                <span className={profit >= 0 ? "text-profit text-sm ml-1" : "text-loss text-sm ml-1"}>
                  {profit >= 0 ? "+" : ""}{percentProfit.toFixed(2)}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-sm">
                  <span className="text-neutral-600">Quantity: </span>
                  <span className="font-medium font-mono">{item.quantity}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600">Bought: </span>
                  <span className="font-medium font-mono">${item.boughtPrice.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600">Value: </span>
                  <span className="font-medium font-mono">${currentValue.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {item.sold ? (
              <div className="mt-4 md:mt-0 text-right">
                <div className="text-sm mb-1">
                  <span className="text-neutral-600">Sold: </span>
                  <span className="font-medium font-mono">${item.soldPrice?.toFixed(2)}</span>
                </div>
                <div className="text-sm mb-1">
                  <span className="text-neutral-600">Date: </span>
                  <span className="font-medium">
                    {item.soldAt ? format(new Date(item.soldAt), "MMM d, yyyy") : "N/A"}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-neutral-600">Profit: </span>
                  <span className={`font-medium ${profit >= 0 ? "text-profit" : "text-loss"}`}>
                    ${profit.toFixed(2)} ({percentProfit.toFixed(2)}%)
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-4 md:mt-0">
                <Button 
                  className="w-full md:w-auto"
                  onClick={() => setIsSelling(true)}
                >
                  Sell Position
                </Button>
              </div>
            )}
          </div>
          
          {!item.sold && (
            <>
              {/* Progress and Targets */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-neutral-600 mb-1">
                  <span>Buy Zone</span>
                  <span>Target 1</span>
                  <span>Target 2</span>
                  <span>Target 3</span>
                </div>
                
                {/* Progress bar */}
                <div className="relative">
                  <div className="w-full bg-neutral-200 h-4 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full" 
                      style={{ width: `${Math.min(percentToTarget3 * 0.8, 100)}%` }}
                    ></div>
                  </div>
                  
                  {/* Buy Zone marker */}
                  <div className="absolute top-0 left-0 h-4" style={{ width: `${(item.stockAlert.buyZoneMax / item.stockAlert.target3) * 100 * 0.8}%` }}>
                    <div className="absolute right-0 top-0 w-px h-4 bg-neutral-400"></div>
                    <div className="absolute right-0 bottom-4 text-[10px] text-neutral-500">Buy Zone</div>
                  </div>
                  
                  {/* Target 1 marker */}
                  <div className="absolute top-0 left-0 h-4" style={{ width: `${(item.stockAlert.target1 / item.stockAlert.target3) * 100 * 0.8}%` }}>
                    <div className="absolute right-0 top-0 w-px h-4 bg-neutral-400"></div>
                    <div className="absolute right-0 bottom-4 text-[10px] text-neutral-500">T1</div>
                  </div>
                  
                  {/* Target 2 marker */}
                  <div className="absolute top-0 left-0 h-4" style={{ width: `${(item.stockAlert.target2 / item.stockAlert.target3) * 100 * 0.8}%` }}>
                    <div className="absolute right-0 top-0 w-px h-4 bg-neutral-400"></div>
                    <div className="absolute right-0 bottom-4 text-[10px] text-neutral-500">T2</div>
                  </div>
                  
                  {/* Target 3 marker */}
                  <div className="absolute top-0 left-0 h-4" style={{ width: `${(item.stockAlert.target3 / item.stockAlert.target3) * 100 * 0.8}%` }}>
                    <div className="absolute right-0 top-0 w-px h-4 bg-neutral-400"></div>
                    <div className="absolute right-0 bottom-4 text-[10px] text-neutral-500">T3</div>
                  </div>
                  
                  {/* Buy price marker */}
                  <div className="absolute top-0 left-0 h-4" style={{ width: `${(item.boughtPrice / item.stockAlert.target3) * 100 * 0.8}%` }}>
                    <div className="absolute right-0 top-0 w-1 h-4 bg-amber-500"></div>
                    <div className="absolute right-0 bottom-4 text-[10px] text-amber-600 font-bold">Buy</div>
                  </div>
                  
                  {/* Current price marker */}
                  <div className="absolute top-0 left-0 h-4" style={{ width: `${(item.stockAlert.currentPrice / item.stockAlert.target3) * 100 * 0.8}%` }}>
                    <div className="absolute right-0 top-0 w-1 h-4 bg-green-500"></div>
                    <div className="absolute right-0 top-4 text-[10px] text-green-600 font-bold">Current</div>
                  </div>
                </div>
                
                {/* Target Values */}
                <div className="flex justify-between text-xs font-mono mt-6">
                  <div>
                    <span className="font-medium">${item.stockAlert.buyZoneMax}</span>
                  </div>
                  <div>
                    <span className="font-medium">${item.stockAlert.target1}</span>
                    <span className="text-profit ml-1">{((item.stockAlert.target1 / item.stockAlert.currentPrice - 1) * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">${item.stockAlert.target2}</span>
                    <span className="text-profit ml-1">{((item.stockAlert.target2 / item.stockAlert.currentPrice - 1) * 100).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="font-medium">${item.stockAlert.target3}</span>
                    <span className="text-profit ml-1">{((item.stockAlert.target3 / item.stockAlert.currentPrice - 1) * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              {/* Notification Preferences */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant={item.notifyTarget1 ? "default" : "outline"} className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  Target 1 {item.notifyTarget1 ? "✓" : ""}
                </Badge>
                <Badge variant={item.notifyTarget2 ? "default" : "outline"} className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  Target 2 {item.notifyTarget2 ? "✓" : ""}
                </Badge>
                <Badge variant={item.notifyTarget3 ? "default" : "outline"} className="bg-neutral-100 text-neutral-700 hover:bg-neutral-200">
                  Target 3 {item.notifyTarget3 ? "✓" : ""}
                </Badge>
                {item.customTargetPercent && (
                  <Badge variant="default" className="bg-neutral-100 text-neutral-700">
                    Custom: {item.customTargetPercent}%
                  </Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
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
