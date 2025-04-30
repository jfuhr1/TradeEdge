import { PortfolioItem, StockAlert } from "@shared/schema";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

interface ClosedPortfolioItemProps {
  item: PortfolioItem & { stockAlert: StockAlert };
}

export default function ClosedPortfolioItem({ item }: ClosedPortfolioItemProps) {
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

  // Calculate position of price marker on the progress bar
  const range = item.stockAlert.target3 - item.stockAlert.buyZoneMin;
  const soldPricePos = ((item.soldPrice || 0) - item.stockAlert.buyZoneMin) / range;
  const buyPricePos = (item.boughtPrice - item.stockAlert.buyZoneMin) / range;
  
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
      
      {/* Price Movement and Buy/Sell Visualization */}
      <div className="mt-4">
        <div className="mb-8 relative">
          <div className="relative">
            {/* Progress bar showing price movement */}
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
            <div className="absolute -top-4" style={{ left: `${Math.max(2, Math.min(98, buyPricePos * 100))}%` }}>
              <div className="flex items-center justify-center w-12 h-5">
                <div className="text-[9px] font-bold text-center text-amber-700">BUY</div>
              </div>
            </div>
            
            {/* SELL Price Marker with Price Bubble */}
            <div className="absolute" style={{
              left: `${Math.max(2, Math.min(98, soldPricePos * 100))}%`,
              bottom: "4px"
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
          <div className="absolute top-6 left-0 w-full flex text-[10px]">
            <div className="w-[15%] text-center text-amber-700">High Risk/Reward</div>
            <div className="w-[15%] text-center text-green-700">Buy Zone</div>
            <div className="w-[55%]"></div>
            <div className="w-[15%] text-center text-blue-700">Overperform</div>
          </div>
        </div>
      </div>
      
      {/* Transaction Details */}
      <div className="mt-6 grid grid-cols-4 gap-4 p-2 bg-neutral-50 rounded border border-neutral-100">
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
          <p className="text-xs text-neutral-600">Total Profit/Loss</p>
          <p className={`font-medium font-mono ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${profit.toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Purchase/Sell Dates */}
      <div className="mt-4 flex justify-between">
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
  );
}