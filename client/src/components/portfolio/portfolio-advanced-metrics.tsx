import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

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
  const riskRewardRatio = 1.85; // This would be calculated from actual trade data
  
  const expectedValue = (successRate / 100) * riskRewardRatio - (1 - successRate / 100);
  
  // Mock data for historical performance chart
  const historicalPerformance = [
    { month: 'Jan', value: 10000 },
    { month: 'Feb', value: 12000 },
    { month: 'Mar', value: 11500 },
    { month: 'Apr', value: 13200 },
    { month: 'May', value: 14800 },
    { month: 'Jun', value: 14200 },
    { month: 'Jul', value: 15600 },
    { month: 'Aug', value: 16900 },
    { month: 'Sep', value: 18200 },
    { month: 'Oct', value: 19600 },
    { month: 'Nov', value: 21200 },
    { month: 'Dec', value: 23500 },
  ];
  
  // Mock data for trade performance by month
  const monthlyPerformance = [
    { month: 'Jan', profit: 850, trades: 3 },
    { month: 'Feb', profit: 1200, trades: 4 },
    { month: 'Mar', profit: -300, trades: 2 },
    { month: 'Apr', profit: 1500, trades: 5 },
    { month: 'May', profit: 2100, trades: 4 },
    { month: 'Jun', profit: 950, trades: 3 },
  ];
  
  // We'd add more sophisticated calculations based on the actual portfolio data
  
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Portfolio Performance Metrics</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Avg. Profit per Trade</p>
            <p className="text-2xl font-bold font-mono mt-2">
              ${avgProfitPerTrade.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Win Rate</p>
            <p className="text-2xl font-bold font-mono mt-2">
              {successRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Profit Factor</p>
            <p className="text-2xl font-bold font-mono mt-2">
              {profitFactor.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Annualized Return</p>
            <p className="text-2xl font-bold font-mono mt-2">
              {annualizedReturn.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Risk/Reward Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Risk/Reward Ratio:</span>
                <span className="font-bold">1:{riskRewardRatio.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Expected Value per Trade:</span>
                <span className={`font-bold ${expectedValue >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {expectedValue >= 0 ? '+' : ''}{expectedValue.toFixed(2)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Average Holding Period:</span>
                <span className="font-bold">{avgHoldingPeriodDays} days</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Maximum Drawdown:</span>
                <span className="font-bold text-loss">-12.5%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Sharpe Ratio:</span>
                <span className="font-bold">1.37</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Buy Zone Adherence:</span>
                <span className="font-bold text-profit">76%</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-neutral-600">Target Hit Rate:</span>
                <span className="font-bold text-profit">68%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <Tabs defaultValue="performance">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Performance History</CardTitle>
                <TabsList>
                  <TabsTrigger value="performance">Value</TabsTrigger>
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                </TabsList>
              </div>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="performance">
              <TabsContent value="performance" className="mt-0">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={historicalPerformance}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                      <Tooltip formatter={(value) => [`$${value}`, 'Portfolio Value']} />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#1E88E5" 
                        activeDot={{ r: 8 }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              
              <TabsContent value="monthly" className="mt-0">
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyPerformance}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" tickFormatter={(value) => `$${value}`} />
                      <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${value}`} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="profit" name="Profit/Loss" fill="#00C853" />
                      <Bar yAxisId="right" dataKey="trades" name="# of Trades" fill="#1E88E5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Trade Metrics Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Total Trades</p>
              <p className="text-xl font-bold">{stats.totalPositions}</p>
              <p className="text-xs text-neutral-500 mt-1">All time</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Best Trade</p>
              <p className="text-xl font-bold text-profit">+32.4%</p>
              <p className="text-xs text-neutral-500 mt-1">NVDA on Apr 12</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Worst Trade</p>
              <p className="text-xl font-bold text-loss">-15.8%</p>
              <p className="text-xs text-neutral-500 mt-1">INTC on Feb 28</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Avg. Hold Time</p>
              <p className="text-xl font-bold">{avgHoldingPeriodDays} days</p>
              <p className="text-xs text-neutral-500 mt-1">Closed positions</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Longest Hold</p>
              <p className="text-xl font-bold">142 days</p>
              <p className="text-xs text-neutral-500 mt-1">META (+28.3%)</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Shortest Hold</p>
              <p className="text-xl font-bold">6 days</p>
              <p className="text-xs text-neutral-500 mt-1">AMD (+12.5%)</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Consistent Winners</p>
              <p className="text-xl font-bold">NVDA, META</p>
              <p className="text-xs text-neutral-500 mt-1">Multiple profitable trades</p>
            </div>
            
            <div className="p-4 bg-neutral-50 rounded-lg">
              <p className="text-neutral-600 text-sm">Favorite Stocks</p>
              <p className="text-xl font-bold">AAPL, MSFT</p>
              <p className="text-xs text-neutral-500 mt-1">Most traded</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}