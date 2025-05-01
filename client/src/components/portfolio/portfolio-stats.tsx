import { Card, CardContent } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "wouter";

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
              <Link to="/stock-alerts" className="text-primary text-sm font-medium hover:underline">
                Add more from Stock Alerts
              </Link>
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


    </div>
  );
}
