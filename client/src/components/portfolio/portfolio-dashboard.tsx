import { Link } from "wouter";
import { Activity, ArrowUpRight, BarChart3, DollarSign, PieChart, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Line, LineChart, ResponsiveContainer, Area, AreaChart, Tooltip, XAxis, YAxis } from "recharts";

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

// Mock data for the portfolio value chart
const valueData = [
  { date: "Apr 25", value: 22500 },
  { date: "Apr 26", value: 23000 },
  { date: "Apr 27", value: 22800 },
  { date: "Apr 28", value: 23500 },
  { date: "Apr 29", value: 24200 },
  { date: "Apr 30", value: 24500 },
  { date: "May 1", value: 24892.50 },
];

// Mock data for the profit chart (would come from real data)
const profitData = [
  { date: "Apr 25", value: 120 },
  { date: "Apr 26", value: 280 },
  { date: "Apr 27", value: 350 },
  { date: "Apr 28", value: 275 },
  { date: "Apr 29", value: 450 },
  { date: "Apr 30", value: 520 },
  { date: "May 1", value: 675 },
];

// Helper component for rendering chart sections with title and value
function ChartSection({ 
  title, 
  value, 
  chart, 
  valueClass = "", 
  icon,
  children
}: { 
  title: string, 
  value: string, 
  chart?: React.ReactNode,
  valueClass?: string,
  icon: React.ReactNode,
  children?: React.ReactNode
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">
          {title}
        </CardTitle>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">
          <span className={valueClass}>{value}</span>
        </div>
        {children}
        {chart && (
          <div className="h-[80px] mt-4">
            {chart}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function PortfolioDashboard({ stats }: { stats: PortfolioStats }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Current Value + Chart */}
        <ChartSection 
          title="Portfolio Value" 
          value={`$${stats.totalValue.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={valueData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E88E5" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#1E88E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1E88E5" 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Value
                              </span>
                              <span className="font-bold text-xs">
                                ${payload[0].value}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Date
                              </span>
                              <span className="font-bold text-xs">
                                {payload[0].payload.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          }
        >
          <div className="flex items-center mt-1">
            <span className={`text-sm font-medium ${stats.totalGainLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
              {stats.totalGainLoss >= 0 ? '+' : ''}${stats.totalGainLoss.toFixed(2)} ({stats.percentGainLoss.toFixed(1)}%)
            </span>
            <span className="text-xs text-muted-foreground ml-1">all time</span>
          </div>
        </ChartSection>

        {/* Positions */}
        <ChartSection 
          title="Positions"
          value={`${stats.totalPositions}`}
          icon={<PieChart className="h-4 w-4" />}
        >
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Active</span>
              <span className="font-bold font-mono">{stats.activePositions}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Closed</span>
              <span className="font-bold font-mono">{stats.closedPositions}</span>
            </div>
            <div className="col-span-2 mt-1">
              <Link to="/stock-alerts" className="text-primary text-sm font-medium hover:underline inline-flex items-center">
                Add from Stock Alerts
                <ArrowUpRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </div>
        </ChartSection>

        {/* Realized Profit */}
        <ChartSection 
          title="Realized Profit" 
          value={`$${stats.totalClosedProfit.toFixed(2)}`}
          valueClass={stats.totalClosedProfit > 0 ? "text-profit" : stats.totalClosedProfit < 0 ? "text-loss" : ""}
          icon={<TrendingUp className="h-4 w-4" />}
          chart={
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={profitData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00C853" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#00C853" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#00C853" 
                  fillOpacity={1} 
                  fill="url(#colorProfit)" 
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Profit
                              </span>
                              <span className="font-bold text-xs text-profit">
                                +${payload[0].value}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Date
                              </span>
                              <span className="font-bold text-xs">
                                {payload[0].payload.date}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          }
        >
          <div className="text-xs text-muted-foreground mt-1">
            From {stats.closedPositions} closed positions
          </div>
        </ChartSection>

        {/* Performance */}
        <ChartSection 
          title="Performance" 
          value={`${stats.winRate.toFixed(1)}%`}
          valueClass={stats.winRate > 50 ? "text-profit" : stats.winRate < 50 ? "text-loss" : ""}
          icon={<Activity className="h-4 w-4" />}
        >
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Profit Factor</span>
              <span className="font-bold font-mono">2.1</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Avg. Profit</span>
              <span className="font-bold font-mono">
                ${stats.totalClosedProfit > 0 && stats.closedPositions > 0 
                  ? (stats.totalClosedProfit / stats.closedPositions).toFixed(2) 
                  : "0.00"}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Avg. Hold</span>
              <span className="font-bold font-mono">45 days</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Buy Zone</span>
              <span className="font-bold font-mono">76%</span>
            </div>
          </div>
        </ChartSection>
      </div>
    </div>
  );
}