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
        <Tabs value={activeStatTab} onValueChange={setActiveStatTab} className="w-auto">
          <TabsList className="grid w-auto grid-cols-3">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Purchase Trends</TabsTrigger>
            <TabsTrigger value="metrics">Advanced Metrics</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      <TabsContent value="performance" className={activeStatTab === "performance" ? "block" : "hidden"}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trade Stats Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Trade Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Total Positions</span>
                  <p className="text-lg font-semibold">{portfolioStats.totalPositions}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Win Rate</span>
                  <p className={`text-lg font-semibold ${portfolioStats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                    {portfolioStats.winRate.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Profit Factor</span>
                  <p className="text-lg font-semibold">{profitFactor.toFixed(2)}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Avg. Profit per Trade</span>
                  <p className={`text-lg font-semibold ${avgProfitPerTrade >= 0 ? 'text-profit' : 'text-loss'}`}>
                    ${avgProfitPerTrade.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Expected Value</span>
                  <p className={`text-lg font-semibold ${expectedValue >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Annualized Return</span>
                  <p className={`text-lg font-semibold ${annualizedReturn >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {annualizedReturn.toFixed(2)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Purchase Zone Chart */}
          <Card className="col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Purchase Zone Analytics</CardTitle>
            </CardHeader>
            <CardContent className="pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="flex flex-col lg:col-span-1 justify-center">
                  <p className="mb-1 text-sm text-muted-foreground">Total Alerts Purchased</p>
                  <p className="text-3xl font-bold">{purchaseMetrics.totalAlertsBought}</p>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#00C853] mr-2"></div>
                        <span className="text-sm">In Buy Zone</span>
                      </div>
                      <span className="text-sm font-semibold">{purchaseMetrics.buyZonePercentage}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#FFB300] mr-2"></div>
                        <span className="text-sm">High Risk/Reward</span>
                      </div>
                      <span className="text-sm font-semibold">{purchaseMetrics.highRiskPercentage}%</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-[#FF3D00] mr-2"></div>
                        <span className="text-sm">Above Buy Zone</span>
                      </div>
                      <span className="text-sm font-semibold">{purchaseMetrics.aboveBuyZonePercentage}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-[250px] lg:col-span-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={purchaseZoneData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {purchaseZoneData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Trade Examples - Best, Worst, etc. */}
        <Card className="mt-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Trade Highlights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Best Trade</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm">NVDA on Apr 12</span>
                  <span className="text-profit font-semibold">+32.4%</span>
                </div>
                <p className="text-xs text-muted-foreground">Bought at $925, sold at $1,225</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Worst Trade</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm">INTC on Feb 28</span>
                  <span className="text-loss font-semibold">-15.8%</span>
                </div>
                <p className="text-xs text-muted-foreground">Bought at $42, sold at $35.36</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Holding Periods</h3>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average</span>
                  <span className="font-semibold">{avgHoldingPeriodDays} days</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Range</span>
                  <span className="font-semibold">6-142 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="trends" className={activeStatTab === "trends" ? "block" : "hidden"}>
        {/* Monthly Alert Purchase Trends Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Monthly Alert Purchase Trends</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPurchaseData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} alerts`, "Purchased"]} />
                <Bar dataKey="count" fill="#1E88E5">
                  <LabelList dataKey="count" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="metrics" className={activeStatTab === "metrics" ? "block" : "hidden"}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Sharpe Ratio" tooltip={tooltips.sharpeRatio} />
                  <span className="font-bold">{sharpeRatio.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Buy Zone Adherence" tooltip={tooltips.buyZoneAdherence} />
                  <span className="font-bold text-profit">{buyZoneAdherence}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Annualized Return" tooltip={tooltips.annualizedReturn} />
                  <span className={`font-bold ${annualizedReturn >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {annualizedReturn.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Expected Value per Trade" tooltip={tooltips.expectedValue} />
                  <span className={`font-bold ${expectedValue >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Win Rate" tooltip={tooltips.winRate} />
                  <span className={`font-bold ${portfolioStats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
                    {portfolioStats.winRate.toFixed(1)}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Profit Factor" tooltip={tooltips.profitFactor} />
                  <span className="font-bold">{profitFactor.toFixed(2)}</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Avg. Profit per Trade" tooltip={tooltips.avgProfitPerTrade} />
                  <span className={`font-bold ${avgProfitPerTrade > 0 ? 'text-profit' : 'text-loss'}`}>
                    ${avgProfitPerTrade.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <MetricWithTooltip label="Avg. Holding Period" tooltip={tooltips.avgHoldingPeriod} />
                  <span className="font-bold">{avgHoldingPeriodDays} days</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span>Position Count</span>
                  <div className="text-right">
                    <span className="font-bold">{portfolioStats.activePositions} active</span>
                    <span className="text-muted-foreground text-sm ml-1">/ {portfolioStats.closedPositions} closed</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </div>
  );
}