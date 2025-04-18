import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockAlert } from "@shared/schema";

interface TargetCardProps {
  stock: StockAlert & { targetLevel?: number };
  targetLevel: number;
}

export default function TargetCard({ stock, targetLevel }: TargetCardProps) {
  // Get the target price based on level
  const targetPrice = targetLevel === 1
    ? stock.target1
    : targetLevel === 2
      ? stock.target2
      : stock.target3;
  
  // Calculate percentage to target
  const percentToTarget = (stock.currentPrice / targetPrice) * 100;
  
  return (
    <Card className="transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <h3 className="font-bold">{stock.symbol}</h3>
              <Badge 
                variant="outline"
                className={`ml-2 text-xs ${
                  targetLevel === 1 
                    ? "bg-green-100 text-profit" 
                    : "bg-neutral-100 text-neutral-700"
                }`}
              >
                Target {targetLevel}
              </Badge>
            </div>
            <p className="text-sm text-neutral-600">{stock.companyName}</p>
          </div>
          <div className="text-right">
            <p className="font-bold font-mono">${stock.currentPrice.toFixed(2)}</p>
            <p className="text-profit text-sm">
              {/* Assuming 1% daily gain for display purpose */}
              +1.2%
            </p>
          </div>
        </div>
        
        <div className="mt-4 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${targetLevel === 1 ? 'bg-premium' : 'bg-primary'}`}
            style={{ width: `${percentToTarget}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-1">
          <p className="text-xs">Target: <span className="font-medium font-mono">${targetPrice}</span></p>
          <p className="text-xs">{Math.round(percentToTarget)}% there</p>
        </div>
        
        <Button 
          variant="outline" 
          className="mt-4 w-full text-primary"
        >
          View Position
        </Button>
      </CardContent>
    </Card>
  );
}
