import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { PortfolioItem, StockAlert } from "@shared/schema";
import { Loader2 } from "lucide-react";
import PortfolioDashboard from "@/components/portfolio/portfolio-dashboard";
import PortfolioList from "@/components/portfolio/portfolio-list";
import PortfolioMetrics from "@/components/portfolio/portfolio-metrics";
import PortfolioSummary from "@/components/portfolio/portfolio-summary";
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
  
  const { data: portfolioItems, isLoading: loadingPortfolio } = useQuery<EnrichedPortfolioItem[]>({
    queryKey: ["/api/portfolio"],
  });
  
  const { data: portfolioMetrics, isLoading: loadingMetrics } = useQuery<PortfolioMetricsData>({
    queryKey: ["/api/portfolio/metrics"],
  });

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
  
  // Get win rate (percentage of closed positions that were profitable)
  const totalWins = closedItems.reduce((count, item) => {
    if (!item.soldPrice) return count;
    return (item.soldPrice > item.boughtPrice) ? count + 1 : count;
  }, 0);
  
  const winRate = closedItems.length > 0 
    ? (totalWins / closedItems.length) * 100 
    : 0;
  
  // Prepare data for advanced metrics
  const portfolioStatsData = {
    totalValue: currentValue,
    totalInvested: totalInvestment,
    totalGainLoss: totalGainLoss,
    percentGainLoss: percentGainLoss,
    totalPositions: activeItems.length + closedItems.length,
    activePositions: activeItems.length,
    closedPositions: closedItems.length,
    totalClosedProfit: totalClosedProfit,
    winRate: winRate
  };
  
  return (
    <MainLayout 
      title="My Portfolio" 
      description="Track your stock positions and performance"
    >
      {/* Portfolio Dashboard - Consolidated metrics */}
      <PortfolioDashboard stats={portfolioStatsData} />
      
      {/* Purchase Zone Analytics */}
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
              <TabsTrigger value="summary">
                Summary ({portfolioItems?.length || 0})
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
          
          <TabsContent value="summary">
            {portfolioItems?.length === 0 ? (
              <div className="bg-white p-6 rounded-lg shadow text-center">
                <p className="text-neutral-600">You don't have any positions yet.</p>
                <p className="text-neutral-600 mt-2">Add stocks to your portfolio from the Stock Alerts page.</p>
              </div>
            ) : (
              <PortfolioSummary items={portfolioItems ?? []} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
