import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { PortfolioItem, StockAlert } from "@shared/schema";
import { Loader2 } from "lucide-react";
import PortfolioStats from "@/components/portfolio/portfolio-stats";
import PortfolioList from "@/components/portfolio/portfolio-list";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type EnrichedPortfolioItem = PortfolioItem & {
  stockAlert: StockAlert;
};

export default function Portfolio() {
  const [activeTab, setActiveTab] = useState("active");
  
  const { data: portfolioItems, isLoading } = useQuery<EnrichedPortfolioItem[]>({
    queryKey: ["/api/portfolio"],
  });

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
