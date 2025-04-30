import { PortfolioItem, StockAlert } from "@shared/schema";
import PortfolioItemComponent from "./portfolio-item";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    // Closed positions table
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Buy Price</TableHead>
              <TableHead>Sell Price</TableHead>
              <TableHead>Buy Date</TableHead>
              <TableHead>Sell Date</TableHead>
              <TableHead className="text-right">Profit/Loss</TableHead>
              <TableHead className="text-right">% Return</TableHead>
              <TableHead className="text-right">Hold Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map(item => {
              // Calculate profit/loss
              const buyValue = item.quantity * item.boughtPrice;
              const sellValue = item.quantity * (item.soldPrice || 0);
              const profit = sellValue - buyValue;
              const percentProfit = (profit / buyValue) * 100;
              
              // Calculate hold time in days
              // Using a try/catch to handle any invalid dates
              let holdDays = 30; // Default value
              let buyDateFormatted = "N/A";
              let sellDateFormatted = "N/A";
              
              try {
                const buyDate = new Date(item.createdAt);
                buyDateFormatted = format(buyDate, "MMM d, yyyy");
                
                if (item.soldAt) {
                  const sellDate = new Date(item.soldAt);
                  sellDateFormatted = format(sellDate, "MMM d, yyyy");
                  holdDays = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
                } else {
                  const today = new Date();
                  holdDays = Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
                }
                
                // Sanity check
                if (isNaN(holdDays) || holdDays < 0) {
                  holdDays = 0;
                }
              } catch (error) {
                console.error("Date formatting error:", error);
                buyDateFormatted = "N/A";
                sellDateFormatted = "N/A";
              }
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.stockAlert.symbol}</TableCell>
                  <TableCell>{item.stockAlert.companyName}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>${item.boughtPrice.toFixed(2)}</TableCell>
                  <TableCell>${item.soldPrice?.toFixed(2) || "N/A"}</TableCell>
                  <TableCell>{buyDateFormatted}</TableCell>
                  <TableCell>{sellDateFormatted}</TableCell>
                  <TableCell className={`text-right ${profit >= 0 ? "text-profit" : "text-loss"}`}>
                    ${profit.toFixed(2)}
                  </TableCell>
                  <TableCell className={`text-right ${percentProfit >= 0 ? "text-profit" : "text-loss"}`}>
                    {percentProfit.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-right">{holdDays} days</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  }
}
