import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface PortfolioMetricsProps {
  totalAlertsBought: number;
  buyZonePercentage: number;
  highRiskPercentage: number;
  aboveBuyZonePercentage: number;
  monthlyPurchases?: { month: string; count: number; }[];
}

export default function PortfolioMetrics({
  totalAlertsBought,
  buyZonePercentage,
  highRiskPercentage,
  aboveBuyZonePercentage,
  monthlyPurchases = [],
}: PortfolioMetricsProps) {
  // Data for the purchase distribution pie chart
  const purchaseDistribution = [
    { name: "In Buy Zone", value: buyZonePercentage, color: "#00C853" },
    { name: "High Risk/Reward", value: highRiskPercentage, color: "#FFB300" },
    { name: "Above Buy Zone", value: aboveBuyZonePercentage, color: "#FF3D00" },
  ];

  // Use provided monthly purchases data or empty array
  const monthlyPurchasesData = monthlyPurchases.length > 0 
    ? monthlyPurchases 
    : [
        { month: "Jan", count: 0 },
        { month: "Feb", count: 0 },
        { month: "Mar", count: 0 },
        { month: "Apr", count: 0 },
        { month: "May", count: 0 },
        { month: "Jun", count: 0 },
      ];
  
  return (
    <div className="grid grid-cols-1 gap-6 mt-6">
      {/* Purchase Zone Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Purchase Zone Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-primary">
                  {totalAlertsBought}
                </div>
                <div className="text-muted-foreground text-sm">
                  Total Alerts Purchased
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-50 rounded-md p-2">
                  <div className="text-xs text-muted-foreground">In Buy Zone</div>
                  <div className="font-semibold text-green-600">{buyZonePercentage}%</div>
                </div>
                <div className="bg-amber-50 rounded-md p-2">
                  <div className="text-xs text-muted-foreground">High Risk</div>
                  <div className="font-semibold text-amber-600">{highRiskPercentage}%</div>
                </div>
                <div className="bg-red-50 rounded-md p-2">
                  <div className="text-xs text-muted-foreground">Above Zone</div>
                  <div className="font-semibold text-red-600">{aboveBuyZonePercentage}%</div>
                </div>
              </div>
            </div>
            
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={purchaseDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {purchaseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${value.toFixed(1)}%`} 
                    labelFormatter={(label) => label as string}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p>
                <span className="font-medium text-green-600">{buyZonePercentage}%</span> of your purchases were made in the optimal buy zone, which is ideal for maximizing profit potential.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Purchase Trends Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Alert Purchase Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyPurchasesData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" name="Alerts Purchased" fill="#1E88E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}