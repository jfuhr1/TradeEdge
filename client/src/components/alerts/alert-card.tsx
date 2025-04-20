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

interface AlertCardProps {
  alert: StockAlert;
  className?: string;
}

export default function AlertCard({ alert, className = "" }: AlertCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingToPortfolio, setIsAddingToPortfolio] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Calculate current price position in buy zone (as percentage)
  const buyZoneRange = alert.buyZoneMax - alert.buyZoneMin;
  const pricePosition = Math.min(
    Math.max(
      ((alert.currentPrice - alert.buyZoneMin) / buyZoneRange) * 100,
      0
    ),
    100
  );

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
      <div className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-md ${className}`}>
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
        
        {/* Buy Zone Visualization */}
        <div className="mt-4 mb-2">
          <div className="flex justify-between text-xs text-neutral-500 mb-1">
            <span>${alert.buyZoneMin}</span>
            <span>${alert.buyZoneMax}</span>
          </div>
          <div className="relative">
            <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full" 
                style={{ width: `${pricePosition}%` }}
              ></div>
            </div>
            <div 
              className="absolute w-0.5 h-4 bg-black -mt-2.5" 
              style={{ left: `${pricePosition}%` }}
            ></div>
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
