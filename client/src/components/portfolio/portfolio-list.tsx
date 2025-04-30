import { PortfolioItem, StockAlert } from "@shared/schema";
import PortfolioItemComponent from "./portfolio-item";
import ClosedPortfolioItem from "./closed-portfolio-item";

interface PortfolioListProps {
  items: (PortfolioItem & { stockAlert: StockAlert })[];
  status: "active" | "closed";
}

export default function PortfolioList({ items, status }: PortfolioListProps) {
  // Sort active items by nearing targets first
  const sortedItems = [...items].sort((a, b) => {
    if (status === "active") {
      // Calculate how close each item is to its nearest target
      const aCurrentPrice = a.stockAlert.currentPrice;
      const bCurrentPrice = b.stockAlert.currentPrice;
      
      const aTarget1Percent = aCurrentPrice / a.stockAlert.target1;
      const aTarget2Percent = aCurrentPrice / a.stockAlert.target2;
      const aTarget3Percent = aCurrentPrice / a.stockAlert.target3;
      
      const bTarget1Percent = bCurrentPrice / b.stockAlert.target1;
      const bTarget2Percent = bCurrentPrice / b.stockAlert.target2;
      const bTarget3Percent = bCurrentPrice / b.stockAlert.target3;
      
      // Find distance to closest target
      const aClosest = Math.max(aTarget1Percent, aTarget2Percent, aTarget3Percent);
      const bClosest = Math.max(bTarget1Percent, bTarget2Percent, bTarget3Percent);
      
      // Sort by closest to target (descending)
      return bClosest - aClosest;
    } else {
      // Sort closed positions by date sold (if available)
      if (a.soldAt && b.soldAt) {
        return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
      }
      return 0;
    }
  });
  
  if (status === "active") {
    return (
      <div>
        {sortedItems.map(item => (
          <PortfolioItemComponent key={item.id} item={item} />
        ))}
      </div>
    );
  } else {
    // Closed positions with visual cards (similar to active positions)
    return (
      <div>
        {sortedItems.map(item => (
          <ClosedPortfolioItem key={item.id} item={item} />
        ))}
      </div>
    );
  }
}
