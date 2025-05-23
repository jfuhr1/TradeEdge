import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, CartesianGrid, LabelList, Legend, PieChart, Pie, Sector } from "recharts";

interface StatsZoneProps {
  portfolioStats: {
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    percentGainLoss: number;
    totalPositions: number;
    activePositions: number;
    closedPositions: number;
    totalClosedProfit: number;
    winRate: number;
  };
  purchaseMetrics: {
    totalAlertsBought: number;
    buyZonePercentage: number;
    highRiskPercentage: number;
    aboveBuyZonePercentage: number;
    monthlyPurchases: { month: string; count: number; }[];
  };
}

// Define tooltips for metrics
const tooltips = {
  avgProfitPerTrade: "The average profit gained on each closed trade. Calculated as total closed profit divided by number of closed positions.",
  winRate: "Percentage of all-time closed trades that were profitable. Calculated as (winning trades ÷ total trades) × 100.",
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

export default function PortfolioStatsZone({ portfolioStats, purchaseMetrics }: StatsZoneProps) {
  const [activeStatTab, setActiveStatTab] = useState("performance");
  
  // Calculate additional metrics based on portfolio stats
  const avgProfitPerTrade = portfolioStats.closedPositions > 0 
    ? portfolioStats.totalClosedProfit / portfolioStats.closedPositions 
    : 0;
    
  const avgHoldingPeriodDays = 45; // This would come from actual data
  const annualizedReturn = portfolioStats.percentGainLoss > 0 
    ? ((1 + portfolioStats.percentGainLoss / 100) ** (365 / avgHoldingPeriodDays) - 1) * 100 
    : 0;
    
  const profitFactor = 2.1; // This would be calculated from actual win/loss data
  const successRate = portfolioStats.winRate;
  
  const expectedValue = (successRate / 100) * 1.5 - (1 - successRate / 100);
  const sharpeRatio = 1.37; // This would be calculated from actual return/risk data
  const buyZoneAdherence = purchaseMetrics.buyZonePercentage; 
  
  // For the purchase zone chart
  const purchaseZoneData = [
    { name: 'Buy Zone', value: purchaseMetrics.buyZonePercentage, color: '#00C853' },
    { name: 'High Risk', value: purchaseMetrics.highRiskPercentage, color: '#FFB300' },
    { name: 'Above Zone', value: purchaseMetrics.aboveBuyZonePercentage, color: '#FF3D00' },
  ];
  
  // For the monthly purchase trends
  const monthlyPurchaseData = purchaseMetrics.monthlyPurchases;
  
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Portfolio Stats Zone</h2>
      </div>
      
      <Tabs value={activeStatTab} onValueChange={setActiveStatTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="metrics">Advanced Metrics</TabsTrigger>
        </TabsList>
      
        <TabsContent value="performance">
          {/* Buy Zone Analytics - Full size */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Buy Zone Analytics</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="flex flex-col items-center">
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary">
                    {purchaseMetrics.totalAlertsBought}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Total Alerts Purchased
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                  <div className="bg-green-50 rounded-lg p-6 shadow-sm text-center border border-green-100">
                    <div className="text-4xl font-bold text-green-600 mb-2">{purchaseMetrics.buyZonePercentage}%</div>
                    <div className="text-lg font-medium text-green-800">In Buy Zone</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Purchases made within the optimal buying range, offering the best risk-reward ratio.
                    </div>
                    <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${purchaseMetrics.buyZonePercentage}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 rounded-lg p-6 shadow-sm text-center border border-amber-100">
                    <div className="text-4xl font-bold text-amber-600 mb-2">{purchaseMetrics.highRiskPercentage}%</div>
                    <div className="text-lg font-medium text-amber-800">High Risk/Reward</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Higher risk trades with potential for higher returns, but less margin of safety.
                    </div>
                    <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${purchaseMetrics.highRiskPercentage}%` }}></div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 rounded-lg p-6 shadow-sm text-center border border-red-100">
                    <div className="text-4xl font-bold text-red-600 mb-2">{purchaseMetrics.aboveBuyZonePercentage}%</div>
                    <div className="text-lg font-medium text-red-800">Above Buy Zone</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Purchases made above recommended entry points, with reduced margin of safety.
                    </div>
                    <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${purchaseMetrics.aboveBuyZonePercentage}%` }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-md text-sm text-blue-600">
                  <p className="text-center">
                    <span className="font-semibold">Pro Tip:</span> Aim to have at least 70% of your purchases within the buy zone to maximize profit potential and reduce risk.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Trade Examples - Best, Worst only */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Trade Highlights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Best Trade</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">NVDA</span>
                    <div className="text-right">
                      <span className="text-profit font-semibold">+32.4%</span>
                      <span className="text-profit text-sm ml-2">(+$300)</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Bought at $925 on Apr 12, 2025</p>
                  <p className="text-xs text-muted-foreground">Sold at $1,225 on May 24, 2025</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Worst Trade</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">INTC</span>
                    <div className="text-right">
                      <span className="text-loss font-semibold">-15.8%</span>
                      <span className="text-loss text-sm ml-2">(-$6.64)</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Bought at $42 on Feb 28, 2025</p>
                  <p className="text-xs text-muted-foreground">Sold at $35.36 on Mar 15, 2025</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics">
          {/* Financial Breakdown */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Financial Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-neutral-50 rounded-lg shadow-sm">
                  <p className="text-neutral-600 text-sm">
                    <span>Total Value Traded</span>
                  </p>
                  <p className="text-xl font-bold font-mono">${portfolioStats.totalInvested.toFixed(2)}</p>
                </div>
                
                <div className="p-4 bg-neutral-50 rounded-lg shadow-sm">
                  <p className="text-neutral-600 text-sm">
                    <span>Active Positions Value</span>
                  </p>
                  <p className="text-xl font-bold font-mono">${portfolioStats.totalValue.toFixed(2)}</p>
                </div>
                
                <div className="p-4 bg-neutral-50 rounded-lg shadow-sm">
                  <p className="text-neutral-600 text-sm">
                    <span>Realized Profit</span>
                  </p>
                  <p className="text-xl font-bold font-mono">${portfolioStats.totalClosedProfit.toFixed(2)}</p>
                </div>
                
                <div className="p-4 bg-neutral-50 rounded-lg shadow-sm">
                  <p className="text-neutral-600 text-sm">
                    <span>Unrealized Gain/Loss</span>
                  </p>
                  <p className={`text-xl font-bold font-mono ${portfolioStats.totalGainLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                    ${portfolioStats.totalGainLoss.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Advanced Trading Metrics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Advanced Trading Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Column 1 - Position Stats */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Positions</span>
                    <span className="font-bold">{portfolioStats.totalPositions}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Active Positions</span>
                    <span className="font-bold">{portfolioStats.activePositions}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Closed Positions</span>
                    <span className="font-bold">{portfolioStats.closedPositions}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <MetricWithTooltip label="Win Rate (All Time)" tooltip={tooltips.winRate} />
                    <span className={`font-bold ${portfolioStats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                      {portfolioStats.winRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                
                {/* Column 2 - Time & Adherence */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Avg. Holding Period</span>
                    <span className="font-bold">{avgHoldingPeriodDays} days</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Holding Period Range</span>
                    <span className="font-bold">6-142 days</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <MetricWithTooltip label="Buy Zone Adherence" tooltip={tooltips.buyZoneAdherence} />
                    <span className="font-bold text-profit">{buyZoneAdherence}%</span>
                  </div>
                </div>
                
                {/* Column 3 - Performance Metrics */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Avg. Profit per Trade</span>
                    <span className={`font-bold ${avgProfitPerTrade >= 0 ? 'text-profit' : 'text-loss'}`}>
                      ${avgProfitPerTrade.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <MetricWithTooltip label="Profit Factor" tooltip={tooltips.profitFactor} />
                    <span className="font-bold">{profitFactor.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <MetricWithTooltip label="Sharpe Ratio" tooltip={tooltips.sharpeRatio} />
                    <span className="font-bold">{sharpeRatio.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <MetricWithTooltip label="Annualized Return" tooltip={tooltips.annualizedReturn} />
                    <span className={`font-bold ${annualizedReturn >= 0 ? 'text-profit' : 'text-loss'}`}>
                      {annualizedReturn.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}