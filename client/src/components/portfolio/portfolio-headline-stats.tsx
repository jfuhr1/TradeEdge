import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowUpRight } from "lucide-react";

interface PortfolioHeadlineStatsProps {
  portfolioValue: number;
  totalGainLoss: number;
  percentGainLoss: number;
  activePositions: number;
  realizedProfit: number;
  averageProfitPercent: number;
}

export default function PortfolioHeadlineStats({
  portfolioValue,
  totalGainLoss,
  percentGainLoss,
  activePositions,
  realizedProfit,
  averageProfitPercent
}: PortfolioHeadlineStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Portfolio Value */}
      <Card>
        <CardContent className="p-4">
          <p className="text-neutral-600 text-sm">Portfolio Value</p>
          <p className="text-2xl font-bold font-mono mt-2">${portfolioValue.toFixed(2)}</p>
          <div className="flex items-center mt-1">
            <span className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
              {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)} ({percentGainLoss.toFixed(1)}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Active Positions */}
      <Card>
        <CardContent className="p-4">
          <p className="text-neutral-600 text-sm">Active Positions</p>
          <p className="text-2xl font-bold font-mono mt-2">{activePositions}</p>
          <div className="flex items-center mt-1">
            <Link to="/stock-alerts" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
              Add from Stock Alerts
              <ArrowUpRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Realized Profit */}
      <Card>
        <CardContent className="p-4">
          <p className="text-neutral-600 text-sm">Realized Profit</p>
          <p className={`text-2xl font-bold font-mono mt-2 ${realizedProfit > 0 ? 'text-profit' : realizedProfit < 0 ? 'text-loss' : ''}`}>
            ${realizedProfit.toFixed(2)}
          </p>
          <div className="flex items-center mt-1">
            <span className="text-sm text-neutral-600">
              From closed positions
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Average Profit */}
      <Card>
        <CardContent className="p-4">
          <p className="text-neutral-600 text-sm">Average Profit</p>
          <p className={`text-2xl font-bold font-mono mt-2 ${averageProfitPercent > 0 ? 'text-profit' : averageProfitPercent < 0 ? 'text-loss' : ''}`}>
            {averageProfitPercent > 0 ? '+' : ''}{averageProfitPercent.toFixed(1)}%
          </p>
          <div className="flex items-center mt-1">
            <span className="text-sm text-neutral-600">
              Per position
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}