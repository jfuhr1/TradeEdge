import { Card, CardContent } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface PortfolioStatsProps {
  activePositions: number;
  currentValue: number;
  totalGainLoss: number;
  percentGainLoss: number;
  closedProfit: number;
}

// Mock data for chart - in a real app this would come from the API
const mockData = [
  { day: "Mon", value: 22500 },
  { day: "Tue", value: 23000 },
  { day: "Wed", value: 22800 },
  { day: "Thu", value: 23500 },
  { day: "Fri", value: 24200 },
  { day: "Sat", value: 24500 },
  { day: "Sun", value: 24892.50 },
];

export default function PortfolioStats({
  activePositions,
  currentValue,
  totalGainLoss,
  percentGainLoss,
  closedProfit
}: PortfolioStatsProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Value */}
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Alert Investment Value</p>
            <p className="text-2xl font-bold font-mono mt-2">
              ${currentValue.toFixed(2)}
            </p>
            <div className="flex items-center mt-1">
              <span className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-profit' : 'text-loss'}`}>
                {totalGainLoss >= 0 ? '+' : ''}${totalGainLoss.toFixed(2)} ({percentGainLoss.toFixed(1)}%)
              </span>
              <span className="text-xs text-neutral-500 ml-1">all time</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Positions */}
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Active Positions</p>
            <p className="text-2xl font-bold font-mono mt-2">{activePositions}</p>
            <div className="flex items-center mt-1">
              <a href="/stock-alerts" className="text-primary text-sm font-medium hover:underline">
                Add more from Stock Alerts
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Closed Profits */}
        <Card>
          <CardContent className="p-4">
            <p className="text-neutral-600 text-sm">Realized Gains</p>
            <p className="text-2xl font-bold font-mono mt-2">${closedProfit.toFixed(2)}</p>
            <div className="flex items-center mt-1">
              <span className={`text-sm font-medium ${closedProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                Closed positions
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Value Chart */}
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">Portfolio Value Trend</h3>
            <div className="flex text-sm">
              <span className="text-neutral-500 mr-4">7 days</span>
              <span className="text-primary font-medium">30 days</span>
              <span className="text-neutral-500 ml-4">All time</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={mockData}
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  formatter={(value) => [`$${value}`, 'Portfolio Value']}
                  labelFormatter={(label) => `${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1E88E5" 
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
