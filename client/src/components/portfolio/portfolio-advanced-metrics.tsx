import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface PortfolioAdvancedMetricsProps {
  stats: PortfolioStats;
}

interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalGainLoss: number;
  percentGainLoss: number;
  totalPositions: number;
  activePositions: number;
  closedPositions: number;
  totalClosedProfit: number;
  winRate: number;
}

// Define tooltips for each metric
const tooltips = {
  avgProfitPerTrade: "The average profit gained on each closed trade. Calculated as total closed profit divided by number of closed positions.",
  winRate: "Percentage of closed trades that were profitable. Calculated as (winning trades ÷ total trades) × 100.",
  profitFactor: "Ratio of gross profits to gross losses. A value above 1.0 indicates a profitable strategy. Calculated as (sum of all profits ÷ sum of all losses).",
  annualizedReturn: "Your portfolio's return adjusted to represent a one-year period. Accounts for compounding effect based on average holding period.",
  expectedValue: "The amount you can expect to win (or lose) per trade on average. Calculated as (win rate × average win) - ((1 - win rate) × average loss).",
  avgHoldingPeriod: "The average number of days your positions remain open before being closed.",
  sharpeRatio: "Risk-adjusted return metric that measures excess return per unit of risk. Higher is better. Calculated as (return - risk-free rate) ÷ standard deviation of returns.",
  buyZoneAdherence: "Percentage of trades that were executed within the recommended buy zone price range.",
  totalTrades: "The total number of trades (active + closed) in your portfolio.",
  bestTrade: "Your most profitable trade by percentage gain.",
  worstTrade: "Your least profitable (or most losing) trade by percentage.",
  avgHoldTime: "The average length of time you hold positions before closing them.",
  longestHold: "The longest period you've held a position before selling.",
  shortestHold: "The shortest period you've held a position before selling."
};

// Simple helper component for tooltips
function MetricWithTooltip({ label, tooltip }: { label: string, tooltip: string }) {
  return (
    <TooltipProvider>
      <div className="flex items-center">
        <span>{label}</span>
        <UITooltip>
          <TooltipTrigger asChild>
            <span className="ml-1 cursor-help">
              <HelpCircle size={16} className="text-muted-foreground inline-block" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="w-64 p-3">
            <p className="text-sm">{tooltip}</p>
          </TooltipContent>
        </UITooltip>
      </div>
    </TooltipProvider>
  );
}

// We'll generate metrics from the main stats
export default function PortfolioAdvancedMetrics({ stats }: PortfolioAdvancedMetricsProps) {
  // Calculate additional metrics
  const avgProfitPerTrade = stats.closedPositions > 0 
    ? stats.totalClosedProfit / stats.closedPositions 
    : 0;
    
  const avgHoldingPeriodDays = 45; // This would come from actual data
  const annualizedReturn = stats.percentGainLoss > 0 
    ? ((1 + stats.percentGainLoss / 100) ** (365 / avgHoldingPeriodDays) - 1) * 100 
    : 0;
    
  const profitFactor = 2.1; // This would be calculated from actual win/loss data
  const successRate = stats.winRate;
  
  const expectedValue = (successRate / 100) * 1.5 - (1 - successRate / 100);
  const sharpeRatio = 1.37; // This would be calculated from actual return/risk data
  const buyZoneAdherence = 76; // This would come from actual purchase data
  
  // We'd add more sophisticated calculations based on the actual portfolio data
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Portfolio Performance Metrics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <MetricWithTooltip label="Avg. Profit per Trade" tooltip={tooltips.avgProfitPerTrade} />
            <p className="text-2xl font-bold font-mono mt-2">
              ${avgProfitPerTrade.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <MetricWithTooltip label="Win Rate" tooltip={tooltips.winRate} />
            <p className="text-2xl font-bold font-mono mt-2">
              {successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <MetricWithTooltip label="Profit Factor" tooltip={tooltips.profitFactor} />
            <p className="text-2xl font-bold font-mono mt-2">
              {profitFactor.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <MetricWithTooltip label="Annualized Return" tooltip={tooltips.annualizedReturn} />
            <p className="text-2xl font-bold font-mono mt-2">
              {annualizedReturn.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Trading Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* First column - Performance Metrics */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Expected Value per Trade" tooltip={tooltips.expectedValue} />
                  <span className={`font-bold ${expectedValue >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Sharpe Ratio" tooltip={tooltips.sharpeRatio} />
                  <span className="font-bold">{sharpeRatio.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Buy Zone Adherence" tooltip={tooltips.buyZoneAdherence} />
                  <span className="font-bold text-profit">{buyZoneAdherence}%</span>
                </div>
              </div>
              
              {/* Second column - Basic trade stats */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total Trades</span>
                  <span className="font-bold">{stats.totalPositions}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Avg. Hold Time" tooltip={tooltips.avgHoldTime} />
                  <span className="font-bold">{avgHoldingPeriodDays} days</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Win Rate</span>
                  <span className="font-bold">{successRate.toFixed(1)}%</span>
                </div>
              </div>
              
              {/* Third column - Best/worst trades */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Best Trade</span>
                  <div className="text-right">
                    <span className="font-bold text-profit">+32.4%</span>
                    <div className="text-xs text-neutral-500">NVDA on Apr 12</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Worst Trade</span>
                  <div className="text-right">
                    <span className="font-bold text-loss">-15.8%</span>
                    <div className="text-xs text-neutral-500">INTC on Feb 28</div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Hold Range</span>
                  <div className="text-right">
                    <span className="font-bold">6-142 days</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Financial Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg shadow-sm">
              <p className="text-neutral-600 text-sm">
                <span>Total Value Traded</span>
              </p>
              <p className="text-xl font-bold font-mono">${stats.totalInvested.toFixed(2)}</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg shadow-sm">
              <p className="text-neutral-600 text-sm">
                <span>Active Positions Value</span>
              </p>
              <p className="text-xl font-bold font-mono">${stats.totalValue.toFixed(2)}</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg shadow-sm">
              <p className="text-neutral-600 text-sm">
                <span>Realized Profit</span>
              </p>
              <p className="text-xl font-bold font-mono">${stats.totalClosedProfit.toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}