import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";
import { StockAlert } from "@shared/schema";
import TargetCard from "../alerts/target-card";

interface StockTargets {
  target1: StockAlert[];
  target2: StockAlert[];
  target3: StockAlert[];
}

export default function ApproachingTargets() {
  const { data: targets, isLoading } = useQuery<StockTargets>({
    queryKey: ["/api/stock-alerts/targets"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Combine and take the top 3 stocks nearing any target
  const target1Stocks = targets?.target1 || [];
  const target2Stocks = targets?.target2 || [];
  const target3Stocks = targets?.target3 || [];

  const stocksApproachingTargets = [
    ...target1Stocks.map(stock => ({ ...stock, targetLevel: 1 })),
    ...target2Stocks.map(stock => ({ ...stock, targetLevel: 2 })),
    ...target3Stocks.map(stock => ({ ...stock, targetLevel: 3 })),
  ].slice(0, 3);

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Stocks Approaching Targets</h2>
        <Link href="/portfolio" className="text-primary text-sm font-medium">
          View All
        </Link>
      </div>

      {stocksApproachingTargets.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-center">
          <p className="text-neutral-600">No stocks approaching targets right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocksApproachingTargets.map((stock) => (
            <TargetCard 
              key={`${stock.id}-${stock.targetLevel}`} 
              stock={stock} 
              targetLevel={stock.targetLevel} 
            />
          ))}
        </div>
      )}
    </section>
  );
}
