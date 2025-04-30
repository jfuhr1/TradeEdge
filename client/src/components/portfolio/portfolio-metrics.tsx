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
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-primary">
                {totalAlertsBought}
              </div>
              <div className="text-muted-foreground text-sm">
                Total Alerts Purchased
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              <div className="bg-green-50 rounded-lg p-6 shadow-sm text-center border border-green-100">
                <div className="text-4xl font-bold text-green-600 mb-2">{buyZonePercentage}%</div>
                <div className="text-lg font-medium text-green-800">In Buy Zone</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Purchases made within the optimal buying range, offering the best risk-reward ratio.
                </div>
                <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${buyZonePercentage}%` }}></div>
                </div>
              </div>
              
              <div className="bg-amber-50 rounded-lg p-6 shadow-sm text-center border border-amber-100">
                <div className="text-4xl font-bold text-amber-600 mb-2">{highRiskPercentage}%</div>
                <div className="text-lg font-medium text-amber-800">High Risk/Reward</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Higher risk trades with potential for higher returns, but less margin of safety.
                </div>
                <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${highRiskPercentage}%` }}></div>
                </div>
              </div>
              
              <div className="bg-red-50 rounded-lg p-6 shadow-sm text-center border border-red-100">
                <div className="text-4xl font-bold text-red-600 mb-2">{aboveBuyZonePercentage}%</div>
                <div className="text-lg font-medium text-red-800">Above Buy Zone</div>
                <div className="mt-2 text-sm text-muted-foreground">
                  Purchases made above recommended entry points, with reduced margin of safety.
                </div>
                <div className="mt-4 h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${aboveBuyZonePercentage}%` }}></div>
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