import { useState } from "react";
import { PortfolioItem, StockAlert } from "@shared/schema";
import { BarChart2, ChevronDown, ChevronUp, Link } from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ClosedPortfolioItemProps {
  item: PortfolioItem & { stockAlert: StockAlert };
}

export default function ClosedPortfolioItem({ item }: ClosedPortfolioItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate profit/loss
  const buyValue = item.quantity * item.boughtPrice;
  const sellValue = item.quantity * (item.soldPrice || 0);
  const profit = sellValue - buyValue;
  const percentProfit = (profit / buyValue) * 100;
  
  // Calculate hold time in days
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
  }

  return (
    <div className="p-6 mb-4 bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="flex justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">{item.stockAlert.symbol}</h3>
          <p className="text-sm text-neutral-600">{item.stockAlert.companyName}</p>
        </div>
        <div className="flex flex-col items-end">
          <span className={`text-sm font-medium ${percentProfit >= 0 ? 'text-profit' : 'text-loss'}`}>
            {percentProfit >= 0 ? '+' : ''}{percentProfit.toFixed(2)}%
          </span>
          <span className="text-xs text-neutral-600">{holdDays} days</span>
        </div>
      </div>
      
      {/* Price Movement Visualization */}
      <div className="mt-4">
        <div className="mb-8 relative">
          <div className="relative">
            {/* Main Progress Bar */}
            <Progress 
              value={100} 
              className="h-2" 
            />
            
            {/* Buy Zone and Target Zone Markers */}
            <div className="absolute bottom-0 left-0 w-full flex">
              <div className="w-[15%] border-r border-dashed border-amber-500 h-2"></div>
              <div className="w-[15%] border-r border-dashed border-green-500 h-2"></div>
              <div className="w-[55%] border-r border-dashed border-blue-500 h-2"></div>
              <div className="w-[15%]"></div>
            </div>
            
            {/* BUY Price Marker */}
            <div className="absolute" style={{ 
              left: (() => {
                const buyZoneWidth = item.stockAlert.buyZoneMax - item.stockAlert.buyZoneMin;
                const buyPriceRelativePos = item.boughtPrice - item.stockAlert.buyZoneMin;
                
                if (item.boughtPrice <= item.stockAlert.buyZoneMin) {
                  // In high risk zone or below (0-15%)
                  return '7.5%';
                } else if (item.boughtPrice <= item.stockAlert.buyZoneMax) {
                  // In buy zone (15-30%)
                  const posInRange = buyPriceRelativePos / buyZoneWidth;
                  return `${15 + (posInRange * 15)}%`;
                } else if (item.boughtPrice <= item.stockAlert.target3) {
                  // Between buy zone max and target 3 (30-85%)
                  const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                  const posInRange = (item.boughtPrice - item.stockAlert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (posInRange * 55)}%`;
                } else {
                  // In overperform zone or beyond
                  return '90%';
                }
              })()
            }}>
              <div className="-translate-x-1/2 -top-4 absolute">
                <div className="text-[10px] font-bold text-amber-700">BUY</div>
              </div>
            </div>
            
            {/* SOLD Marker and Price Bubble */}
            <div className="absolute" style={{ 
              left: (() => {
                const range = item.stockAlert.target3 - item.stockAlert.buyZoneMin;
                
                if (!item.soldPrice) return '50%';
                
                if (item.soldPrice <= item.stockAlert.buyZoneMin) {
                  // In high risk zone or below (0-15%)
                  const highRiskWidth = item.stockAlert.buyZoneMin * 0.1;
                  const posInRange = Math.max(0, (item.soldPrice - (item.stockAlert.buyZoneMin - highRiskWidth)) / highRiskWidth);
                  return `${posInRange * 15}%`;
                } else if (item.soldPrice <= item.stockAlert.buyZoneMax) {
                  // In buy zone (15-30%)
                  const buyZoneWidth = item.stockAlert.buyZoneMax - item.stockAlert.buyZoneMin;
                  const posInRange = (item.soldPrice - item.stockAlert.buyZoneMin) / buyZoneWidth;
                  return `${15 + (posInRange * 15)}%`;
                } else if (item.soldPrice <= item.stockAlert.target3) {
                  // Between buy zone max and target 3 (30-85%)
                  const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                  const posInRange = (item.soldPrice - item.stockAlert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (posInRange * 55)}%`;
                } else {
                  // In overperform zone or beyond
                  const overRange = item.stockAlert.target3 * 1.1 - item.stockAlert.target3;
                  const posInRange = Math.min((item.soldPrice - item.stockAlert.target3) / overRange, 1);
                  return `${85 + (posInRange * 15)}%`;
                }
              })()
            }}>
              <div className="absolute -top-8 -translate-x-1/2 text-center">
                <div className={`${percentProfit >= 0 ? 'bg-green-100 border-green-300' : 'bg-red-100 border-red-300'} px-2 py-1 border rounded shadow-sm`}>
                  <div className="flex items-center space-x-1">
                    <span className="text-[8px] font-medium">SOLD:</span>
                    <span className={`text-xs font-bold font-mono ${percentProfit >= 0 ? 'text-green-700' : 'text-red-700'} whitespace-nowrap`}>
                      ${item.soldPrice?.toFixed(2)}
                    </span>
                    <span className={`text-[9px] ${percentProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ({percentProfit >= 0 ? '+' : ''}{percentProfit.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Zone labels below progress bar */}
          <div className="absolute top-14 left-0 w-full flex text-[10px]">
            <div className="w-[15%] text-center text-amber-700">High Risk/Reward</div>
            <div className="w-[15%] text-center text-green-700">Buy Zone</div>
            <div className="w-[55%]"></div>
            <div className="w-[15%] text-center text-blue-700">Overperform</div>
          </div>
        </div>
      </div>
      
      {/* Ownership Information */}
      <div className="mt-4 grid grid-cols-5 gap-4 p-2 bg-blue-50 rounded border border-blue-100">
        <div>
          <p className="text-xs text-neutral-600">Quantity</p>
          <p className="font-medium font-mono">{item.quantity}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-600">Buy Price</p>
          <p className="font-medium font-mono">${item.boughtPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-600">Sell Price</p>
          <p className="font-medium font-mono">${item.soldPrice?.toFixed(2) || "N/A"}</p>
        </div>
        <div>
          <p className="text-xs text-neutral-600">P/L ($)</p>
          <p className={`font-medium font-mono ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${profit.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-600">P/L (%)</p>
          <p className={`font-medium font-mono ${percentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {percentProfit >= 0 ? '+' : ''}{percentProfit.toFixed(2)}%
          </p>
        </div>
      </div>
      
      {/* Chart Image (Expandable) */}
      {isExpanded && (
        <div className="mt-6 mb-4 bg-gray-50 p-2 rounded">
          <div className="aspect-w-16 aspect-h-9 rounded overflow-hidden">
            {item.stockAlert.chartImageUrl ? (
              <img 
                src={item.stockAlert.chartImageUrl} 
                alt={`${item.stockAlert.symbol} Stock Chart`} 
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-100 text-gray-400">
                <BarChart2 size={48} />
                <span className="ml-2">Chart image not available</span>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Action Buttons and Date */}
      <div className="flex justify-between items-end mt-8">
        <div className="grid grid-cols-2 gap-4 flex-1 mr-4">
          <Link href={`/stock-detail/${item.stockAlert.id}`} className="w-full">
            <Button 
              variant="outline" 
              className="py-4 w-full h-full"
            >
              View Details
            </Button>
          </Link>
          <Button
            variant="outline"
            className="py-4 w-full"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-2" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Expand
              </>
            )}
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-4 text-right">
          <div>
            <p className="text-xs font-medium text-black">Purchase Date</p>
            <p className="text-sm font-medium text-black font-mono">{buyDateFormatted}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-black">Sell Date</p>
            <p className="text-sm font-medium text-black font-mono">{sellDateFormatted}</p>
          </div>
        </div>
      </div>
    </div>
  );
}