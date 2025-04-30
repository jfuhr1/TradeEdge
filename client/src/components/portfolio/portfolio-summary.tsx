import { PortfolioItem, StockAlert } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type EnrichedPortfolioItem = PortfolioItem & { stockAlert: StockAlert };

interface PortfolioSummaryProps {
  items: EnrichedPortfolioItem[];
}

export default function PortfolioSummary({ items }: PortfolioSummaryProps) {
  // Sort items by gain percentage (descending)
  const sortedItems = [...items].sort((a, b) => {
    const aProfit = a.sold && a.soldPrice 
      ? (a.soldPrice - a.boughtPrice) / a.boughtPrice 
      : (a.stockAlert.currentPrice - a.boughtPrice) / a.boughtPrice;
      
    const bProfit = b.sold && b.soldPrice 
      ? (b.soldPrice - b.boughtPrice) / b.boughtPrice 
      : (b.stockAlert.currentPrice - b.boughtPrice) / b.boughtPrice;
      
    return bProfit - aProfit;
  });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Symbol</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Buy Zone</TableHead>
            <TableHead>Buy Price</TableHead>
            <TableHead>Current/Sell</TableHead>
            <TableHead>Gain $</TableHead>
            <TableHead>Gain %</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead className="text-right">Target Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedItems.map(item => {
            // Calculate profit/loss
            const buyValue = item.quantity * item.boughtPrice;
            let sellValue = 0;
            let profit = 0;
            let percentProfit = 0;
            let currentOrSellPrice = 0;
            
            if (item.sold && item.soldPrice) {
              currentOrSellPrice = item.soldPrice;
              sellValue = item.quantity * item.soldPrice;
            } else {
              currentOrSellPrice = item.stockAlert.currentPrice;
              sellValue = item.quantity * item.stockAlert.currentPrice;
            }
            
            profit = sellValue - buyValue;
            percentProfit = (profit / buyValue) * 100;
            
            // Calculate hold time
            let holdDays = 0; // Default value
            
            try {
              const buyDate = new Date(item.createdAt);
              
              if (item.soldAt) {
                const sellDate = new Date(item.soldAt);
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
            }
            
            // Determine buy zone status
            let buyZoneStatus = "Unknown";
            if (item.boughtPrice >= item.stockAlert.buyZoneMin && item.boughtPrice <= item.stockAlert.buyZoneMax) {
              buyZoneStatus = "In Buy Zone";
            } else if (item.boughtPrice < item.stockAlert.buyZoneMin) {
              buyZoneStatus = "Below Buy Zone";
            } else {
              buyZoneStatus = "Above Buy Zone";
            }
            
            // Determine target status
            let targetStatus = "No Target";
            if (currentOrSellPrice >= item.stockAlert.target3) {
              targetStatus = "Target 3";
            } else if (currentOrSellPrice >= item.stockAlert.target2) {
              targetStatus = "Target 2";
            } else if (currentOrSellPrice >= item.stockAlert.target1) {
              targetStatus = "Target 1";
            }
            
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.stockAlert.symbol}</TableCell>
                <TableCell>
                  {item.sold ? (
                    <Badge variant="outline" className="bg-neutral-100">Closed</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-100 text-primary">Active</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {buyZoneStatus === "In Buy Zone" && (
                    <Badge variant="outline" className="bg-green-100 text-green-700">In Zone</Badge>
                  )}
                  {buyZoneStatus === "Above Buy Zone" && (
                    <Badge variant="outline" className="bg-red-100 text-red-700">Above Zone</Badge>
                  )}
                  {buyZoneStatus === "Below Buy Zone" && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-700">Below Zone</Badge>
                  )}
                </TableCell>
                <TableCell className="font-mono">${item.boughtPrice.toFixed(2)}</TableCell>
                <TableCell className="font-mono">${currentOrSellPrice.toFixed(2)}</TableCell>
                <TableCell className={`font-mono ${profit >= 0 ? 'text-profit' : 'text-loss'}`}>
                  ${profit.toFixed(2)}
                </TableCell>
                <TableCell className={`font-mono ${percentProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {percentProfit >= 0 ? '+' : ''}{percentProfit.toFixed(2)}%
                </TableCell>
                <TableCell>
                  {holdDays} days
                </TableCell>
                <TableCell className="text-right">
                  {targetStatus === "Target 1" && (
                    <Badge className="bg-blue-600">Target 1</Badge>
                  )}
                  {targetStatus === "Target 2" && (
                    <Badge className="bg-blue-700">Target 2</Badge>
                  )}
                  {targetStatus === "Target 3" && (
                    <Badge className="bg-blue-800">Target 3</Badge>
                  )}
                  {targetStatus === "No Target" && (
                    <Badge variant="outline" className="bg-neutral-100">None</Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}