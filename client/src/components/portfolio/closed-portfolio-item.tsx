import { PortfolioItem, StockAlert } from "@shared/schema";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Link } from "wouter";
import { ChevronDown, ChevronUp, BarChart2 } from "lucide-react";

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
    // For buy date, use the createdAt timestamp (when the position was added to portfolio)
    const buyDate = new Date(item.createdAt);
    buyDateFormatted = format(buyDate, "MMM d, yyyy");
    
    // For sell date, use the soldAt timestamp that was recorded when sold
    if (item.soldAt) {
      const sellDate = new Date(item.soldAt);
      sellDateFormatted = format(sellDate, "MMM d, yyyy");
      // Calculate holding period in days between buy and sell
      holdDays = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
    } else {
      // If no soldAt timestamp (shouldn't happen for closed positions), use current date
      const today = new Date();
      holdDays = Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
      sellDateFormatted = "N/A";
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
  
  // Calculate price status category
  const getPriceStatus = () => {
    const highRiskMin = item.stockAlert.buyZoneMin * 0.9;
    
    if ((item.soldPrice || 0) < highRiskMin) {
      return "below-high-risk"; // Below high risk/reward zone
    } else if ((item.soldPrice || 0) < item.stockAlert.buyZoneMin) {
      return "high-risk"; // In high risk/reward zone
    } else if ((item.soldPrice || 0) <= item.stockAlert.buyZoneMax) {
      return "buy-zone"; // In buy zone
    } else if ((item.soldPrice || 0) <= item.stockAlert.target1) {
      return "above-buy-zone"; // Between buy zone and target 1
    } else if ((item.soldPrice || 0) <= item.stockAlert.target2) {
      return "target-1"; // Between target 1 and target 2
    } else if ((item.soldPrice || 0) <= item.stockAlert.target3) {
      return "target-2"; // Between target 2 and target 3
    } else {
      return "above-target-3"; // Above target 3
    }
  };
  
  const priceStatus = getPriceStatus();

  return (
    <>
      <div className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-md border mb-4 ${
        priceStatus === "high-risk" 
          ? "border-amber-500" 
          : priceStatus === "buy-zone"
            ? "border-green-500"
            : "border-gray-200"
      }`}>
        <div className="flex justify-between">
          <div>
            <div className="flex items-center flex-wrap">
              <h3 className="font-bold text-lg">{item.stockAlert.symbol}</h3>
              <span className="ml-2 text-neutral-600">{item.stockAlert.companyName}</span>
              <div className="flex gap-1 ml-2">
                <Badge variant="outline" className="bg-gray-100 text-gray-700 text-xs">
                  Closed
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-600">Buy Zone</p>
            <p className="font-medium font-mono">${item.stockAlert.buyZoneMin} - ${item.stockAlert.buyZoneMax}</p>
          </div>
        </div>
        
        {/* Advanced Price Visualization */}
        <div className="mt-12 mb-6">
          <div className="relative h-16 mb-10">
            {/* Main progress bar container */}
            <div className="absolute top-0 w-full h-4 bg-gray-100 rounded-full overflow-visible">
              {/* High Risk/Reward Zone (10% below buy zone - fixed width) */}
              <div 
                className="absolute h-full bg-orange-100 rounded-l-full"
                style={{ 
                  width: "15%",
                  left: "0%"
                }}
              ></div>

              {/* Buy Zone */}
              <div 
                className="absolute h-full bg-green-100"
                style={{ 
                  width: "15%",
                  left: "15%"
                }}
              ></div>

              {/* Target Zone - from buy zone max to target 3 */}
              <div 
                className="absolute h-full bg-gray-100"
                style={{ 
                  width: "55%",
                  left: "30%"
                }}
              ></div>

              {/* Overperform Zone - beyond target 3 */}
              <div 
                className="absolute h-full bg-blue-50 rounded-r-full"
                style={{ 
                  width: "15%",
                  left: "85%"
                }}
              ></div>

              {/* Buy Zone Min indicator */}
              <div className="absolute w-0.5 h-6 bg-green-700 top-0" style={{ left: "15%" }}>
                <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${item.stockAlert.buyZoneMin}</div>
              </div>
              
              {/* Buy Zone Max indicator */}
              <div className="absolute w-0.5 h-6 bg-green-700 top-0" style={{ left: "30%" }}>
                <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${item.stockAlert.buyZoneMax}</div>
              </div>
              
              {/* Target 1 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
                left: (() => {
                  // Calculate position proportionally in the 55% target zone space (30% to 85%)
                  const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                  const t1Position = (item.stockAlert.target1 - item.stockAlert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (t1Position * 55)}%`;
                })()
              }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 1</span>
                  <span className="block text-xs font-medium font-mono">${item.stockAlert.target1}</span>
                </div>
              </div>
              
              {/* Target 2 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
                left: (() => {
                  // Calculate position proportionally in the 55% target zone space (30% to 85%)
                  const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                  const t2Position = (item.stockAlert.target2 - item.stockAlert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (t2Position * 55)}%`;
                })()
              }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 2</span>
                  <span className="block text-xs font-medium font-mono">${item.stockAlert.target2}</span>
                </div>
              </div>
              
              {/* Target 3 indicator */}
              <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ left: "85%" }}>
                <div className="absolute top-6 -ml-16 w-32 text-center">
                  <span className="text-xs font-medium text-primary">Target 3</span>
                  <span className="block text-xs font-medium font-mono">${item.stockAlert.target3}</span>
                </div>
              </div>

              {/* Buy price indicator as vertical text */}
              <div style={{ 
                position: 'absolute',
                left: (() => {
                  if (item.boughtPrice < item.stockAlert.buyZoneMin * 0.9) {
                    return "0%"; 
                  } else if (item.boughtPrice < item.stockAlert.buyZoneMin) {
                    const riskRange = item.stockAlert.buyZoneMin - (item.stockAlert.buyZoneMin * 0.9);
                    const posInRange = (item.boughtPrice - (item.stockAlert.buyZoneMin * 0.9)) / riskRange;
                    return `${posInRange * 15}%`;
                  } else if (item.boughtPrice <= item.stockAlert.buyZoneMax) {
                    const buyRange = item.stockAlert.buyZoneMax - item.stockAlert.buyZoneMin;
                    const posInRange = (item.boughtPrice - item.stockAlert.buyZoneMin) / buyRange;
                    return `${15 + (posInRange * 15)}%`;
                  } else if (item.boughtPrice <= item.stockAlert.target3) {
                    const targetZoneWidth = item.stockAlert.target3 - item.stockAlert.buyZoneMax;
                    const posInRange = (item.boughtPrice - item.stockAlert.buyZoneMax) / targetZoneWidth;
                    return `${30 + (posInRange * 55)}%`;
                  } else {
                    const overRange = item.stockAlert.target3 * 1.1 - item.stockAlert.target3;
                    const posInRange = Math.min((item.boughtPrice - item.stockAlert.target3) / overRange, 1);
                    return `${85 + (posInRange * 15)}%`;
                  }
                })(),
                top: '-12px',
                transform: 'translateX(-50%)',
                zIndex: 20
              }}>
                <div className="flex flex-col items-center">
                  <span className="font-bold text-[10px] text-amber-700">B</span>
                  <span className="font-bold text-[10px] text-amber-700">U</span>
                  <span className="font-bold text-[10px] text-amber-700">Y</span>
                </div>
              </div>

              {/* Sold price indicator (thicker) */}
              <div className="absolute w-1 h-8 bg-black -top-2 z-10" style={{ 
                left: (() => {
                  if (!item.soldPrice) return "50%";
                  
                  if (item.soldPrice < item.stockAlert.buyZoneMin * 0.9) {
                    return "0%"; // Below high risk zone
                  } else if (item.soldPrice < item.stockAlert.buyZoneMin) {
                    // In high risk zone (0-15%)
                    const riskRange = item.stockAlert.buyZoneMin - (item.stockAlert.buyZoneMin * 0.9);
                    const posInRange = (item.soldPrice - (item.stockAlert.buyZoneMin * 0.9)) / riskRange;
                    return `${posInRange * 15}%`;
                  } else if (item.soldPrice <= item.stockAlert.buyZoneMax) {
                    // In buy zone (15-30%)
                    const buyRange = item.stockAlert.buyZoneMax - item.stockAlert.buyZoneMin;
                    const posInRange = (item.soldPrice - item.stockAlert.buyZoneMin) / buyRange;
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
                        ${item.soldPrice?.toFixed(2) || "0.00"}
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
    </>
  );
}