import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { PortfolioItem } from "@shared/schema";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function PortfolioOverview() {
  const { data: portfolio, isLoading } = useQuery<(PortfolioItem & { stockAlert: any })[]>({
    queryKey: ["/api/portfolio"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate portfolio metrics
  const totalValue = portfolio?.reduce((total, item) => {
    if (!item.sold) {
      return total + (item.stockAlert.currentPrice * item.quantity);
    }
    return total;
  }, 0) || 0;

  const initialInvestment = portfolio?.reduce((total, item) => {
    if (!item.sold) {
      return total + (item.boughtPrice * item.quantity);
    }
    return total;
  }, 0) || 0;

  const totalProfit = totalValue - initialInvestment;
  const percentProfit = initialInvestment > 0 ? (totalProfit / initialInvestment) * 100 : 0;

  const activePositions = portfolio?.filter(item => !item.sold).length || 0;
  
  // Calculate wins and losses for win rate
  const completedTrades = portfolio?.filter(item => item.sold) || [];
  const wins = completedTrades.filter(
    item => item.soldPrice && item.soldPrice > item.boughtPrice
  ).length;
  const losses = completedTrades.length - wins;
  const winRate = completedTrades.length > 0 
    ? Math.round((wins / completedTrades.length) * 100) 
    : 0;

  // Count stocks nearing targets
  const stocksNearingTargets = portfolio?.filter(item => {
    if (item.sold) return false;
    
    const percentToTarget1 = (item.stockAlert.currentPrice / item.stockAlert.target1) * 100;
    const percentToTarget2 = (item.stockAlert.currentPrice / item.stockAlert.target2) * 100;
    const percentToTarget3 = (item.stockAlert.currentPrice / item.stockAlert.target3) * 100;
    
    return (
      (percentToTarget1 >= 90 && percentToTarget1 < 100) ||
      (percentToTarget2 >= 90 && percentToTarget2 < 100) ||
      (percentToTarget3 >= 90 && percentToTarget3 < 100)
    );
  }).length || 0;

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Portfolio Overview</h2>
        <Link href="/portfolio" className="text-primary text-sm font-medium">
          View Details
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Value Card */}
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Total Portfolio Value</p>
            <p className="text-2xl font-bold font-mono mt-2">
              ${totalValue.toFixed(2)}
            </p>
            <div className="flex items-center mt-1">
              <span className={`text-sm font-medium ${totalProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)} ({percentProfit.toFixed(1)}%)
              </span>
              <span className="text-xs text-neutral-500 ml-1">30d</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Positions Card */}
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Active Positions</p>
            <p className="text-2xl font-bold font-mono mt-2">{activePositions}</p>
            <div className="flex items-center mt-1">
              <span className="text-primary text-sm font-medium">
                {stocksNearingTargets} nearing targets
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Win Rate Card */}
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Win Rate</p>
            <p className="text-2xl font-bold font-mono mt-2">{winRate}%</p>
            <div className="flex items-center mt-1">
              <span className="text-sm font-medium">
                {wins} wins / {losses} losses
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
