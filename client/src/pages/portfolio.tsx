import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { PortfolioItem, StockAlert } from "@shared/schema";
import { Loader2 } from "lucide-react";
import PortfolioStats from "@/components/portfolio/portfolio-stats";
import PortfolioList from "@/components/portfolio/portfolio-list";
import PortfolioMetrics from "@/components/portfolio/portfolio-metrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EnrichedPortfolioItem = PortfolioItem & {
  stockAlert: StockAlert;
};

interface PortfolioMetricsData {
  totalAlertsBought: number;
  buyZonePercentage: number;
  highRiskPercentage: number;
  aboveBuyZonePercentage: number;
  monthlyPurchases: { month: string; count: number; }[];
}

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState("active");
  
  // Demo login function for testing
  const demoLogin = async () => {
    try {
      // This is just for testing - in a real app, we'd have proper auth flow
      await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'demo',
          password: 'password123'
        }),
      });
      
      // Reload data after login
      window.location.reload();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };
  
  const { data: portfolioItems, isLoading: loadingPortfolio, error: portfolioError } = useQuery<EnrichedPortfolioItem[]>({
    queryKey: ["/api/portfolio"],
    retry: false,
  });
  
  const { data: portfolioMetrics, isLoading: loadingMetrics, error: metricsError } = useQuery<PortfolioMetricsData>({
    queryKey: ["/api/portfolio/metrics"],
    retry: false, // Don't keep retrying on 401 errors
  });
  
  // Check if we need to display login prompt
  const authError = portfolioError?.message === "Authentication required" || 
                    metricsError?.message === "Authentication required";

  const isLoading = loadingPortfolio || loadingMetrics;

  if (isLoading) {
    return (
      <MainLayout title="My Portfolio">
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // Handle authentication error
  if (authError) {
    return (
      <MainLayout title="My Portfolio">
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 max-w-md text-center">
            <h2 className="text-xl font-semibold text-orange-800 mb-2">Authentication Required</h2>
            <p className="text-orange-700 mb-4">
              You need to log in to view your portfolio and metrics.
            </p>
            <button 
              onClick={demoLogin}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Login with Demo Account
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  const activeItems = portfolioItems?.filter(item => !item.sold) || [];
  const closedItems = portfolioItems?.filter(item => item.sold) || [];
  
  // Calculate total portfolio values
  const totalInvestment = activeItems.reduce(
    (sum, item) => sum + (item.quantity * item.boughtPrice),
    0
  );
  
  const currentValue = activeItems.reduce(
    (sum, item) => sum + (item.quantity * item.stockAlert.currentPrice),
    0
  );
  
  const totalGainLoss = currentValue - totalInvestment;
  const percentGainLoss = totalInvestment > 0 
    ? (totalGainLoss / totalInvestment) * 100 
    : 0;
  
  // Calculate closed positions performance
  const totalClosedProfit = closedItems.reduce((sum, item) => {
    if (!item.soldPrice) return sum;
    const profit = (item.soldPrice - item.boughtPrice) * item.quantity;
    return sum + profit;
  }, 0);
  
  return (
    <MainLayout 
      title="My Portfolio" 
      description="Track your stock positions and performance"
    >
      {/* Portfolio Stats Summary */}
      <PortfolioStats 
        activePositions={activeItems.length}
        currentValue={currentValue}
        totalGainLoss={totalGainLoss}
        percentGainLoss={percentGainLoss}
        closedProfit={totalClosedProfit}
      />
      
      {/* Portfolio Items Tabs */}
      {/* Portfolio Metrics */}
      {portfolioMetrics && (
        <PortfolioMetrics
          totalAlertsBought={portfolioMetrics.totalAlertsBought}
          buyZonePercentage={portfolioMetrics.buyZonePercentage}
          highRiskPercentage={portfolioMetrics.highRiskPercentage}
          aboveBuyZonePercentage={portfolioMetrics.aboveBuyZonePercentage}
          monthlyPurchases={portfolioMetrics.monthlyPurchases}
        />
      )}
      
      <div className="mt-8">
        <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="active">
                Active Positions ({activeItems.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed Positions ({closedItems.length})
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="active">
            {activeItems.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-neutral-600">You don't have any active positions yet.</p>
                <p className="text-neutral-600 mt-2">Add stocks to your portfolio from the Stock Alerts page.</p>
              </div>
            ) : (
              <PortfolioList items={activeItems} status="active" />
            )}
          </TabsContent>
          
          <TabsContent value="closed">
            {closedItems.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-neutral-600">You don't have any closed positions yet.</p>
              </div>
            ) : (
              <PortfolioList items={closedItems} status="closed" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
