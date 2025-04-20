import { StockAlert } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, BarChart2, Award } from "lucide-react";

interface ClosedAlertCardProps {
  alert: StockAlert;
  className?: string;
}

export default function ClosedAlertCard({ alert, className = "" }: ClosedAlertCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate max gain percentage
  const maxGainPercent = alert.maxPrice ? 
    ((alert.maxPrice / Math.min(alert.buyZoneMin, Math.max(alert.buyZoneMin, alert.buyZoneMax)) - 1) * 100).toFixed(1) : 
    "N/A";

  // Determine which targets were hit
  const isTarget1Hit = alert.maxPrice && alert.maxPrice >= alert.target1;
  const isTarget2Hit = alert.maxPrice && alert.maxPrice >= alert.target2;
  const isTarget3Hit = alert.maxPrice && alert.maxPrice >= alert.target3;

  // Get the highest target hit
  const getHighestTargetHit = () => {
    if (isTarget3Hit) return "Target 3";
    if (isTarget2Hit) return "Target 2";
    if (isTarget1Hit) return "Target 1";
    return "Target 1"; // Closed alerts always hit at least target 1
  };

  return (
    <div className={`bg-white p-4 rounded-lg shadow transition-all duration-200 hover:-translate-y-1 hover:shadow-md border border-blue-300 ${className}`}>
      <div className="flex justify-between">
        <div>
          <div className="flex items-center flex-wrap">
            <h3 className="font-bold text-lg">{alert.symbol}</h3>
            <span className="ml-2 text-neutral-600">{alert.companyName}</span>
            <div className="flex gap-1 ml-2">
              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                Closed Alert
              </Badge>
              {isTarget3Hit && (
                <Badge variant="outline" className="bg-purple-100 text-purple-800 text-xs">
                  All Targets Hit
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-600">Buy Zone</p>
          <p className="font-medium font-mono">${alert.buyZoneMin} - ${alert.buyZoneMax}</p>
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
              <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${alert.buyZoneMin}</div>
            </div>
            
            {/* Buy Zone Max indicator */}
            <div className="absolute w-0.5 h-6 bg-green-700 top-0" style={{ left: "30%" }}>
              <div className="absolute top-6 -translate-x-1/2 text-xs font-medium text-green-700 text-center">${alert.buyZoneMax}</div>
            </div>
            
            {/* Target 1 indicator */}
            <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
              left: (() => {
                // Calculate position proportionally in the 55% target zone space (30% to 85%)
                const targetZoneWidth = alert.target3 - alert.buyZoneMax;
                const t1Position = (alert.target1 - alert.buyZoneMax) / targetZoneWidth;
                return `${30 + (t1Position * 55)}%`;
              })()
            }}>
              <div className="absolute top-6 -ml-16 w-32 text-center">
                <span className="text-xs font-medium text-primary">Target 1</span>
                <span className="block text-xs font-medium font-mono">${alert.target1}</span>
                <span className={`block text-xs ${isTarget1Hit ? "text-green-600 font-bold" : "text-gray-500"}`}>
                  {isTarget1Hit ? "✓ Hit" : "Not Hit"}
                </span>
              </div>
            </div>
            
            {/* Target 2 indicator */}
            <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ 
              left: (() => {
                // Calculate position proportionally in the 55% target zone space (30% to 85%)
                const targetZoneWidth = alert.target3 - alert.buyZoneMax;
                const t2Position = (alert.target2 - alert.buyZoneMax) / targetZoneWidth;
                return `${30 + (t2Position * 55)}%`;
              })()
            }}>
              <div className="absolute top-6 -ml-16 w-32 text-center">
                <span className="text-xs font-medium text-primary">Target 2</span>
                <span className="block text-xs font-medium font-mono">${alert.target2}</span>
                <span className={`block text-xs ${isTarget2Hit ? "text-green-600 font-bold" : "text-gray-500"}`}>
                  {isTarget2Hit ? "✓ Hit" : "Not Hit"}
                </span>
              </div>
            </div>
            
            {/* Target 3 indicator */}
            <div className="absolute w-0.5 h-6 bg-primary top-0" style={{ left: "85%" }}>
              <div className="absolute top-6 -ml-16 w-32 text-center">
                <span className="text-xs font-medium text-primary">Target 3</span>
                <span className="block text-xs font-medium font-mono">${alert.target3}</span>
                <span className={`block text-xs ${isTarget3Hit ? "text-green-600 font-bold" : "text-gray-500"}`}>
                  {isTarget3Hit ? "✓ Hit" : "Not Hit"}
                </span>
              </div>
            </div>

            {/* Max Price indicator (thicker) */}
            <div className="absolute w-1 h-8 bg-blue-600 -top-2 z-10" style={{ 
              left: (() => {
                if (!alert.maxPrice) return "30%"; // Default to buy zone max if no max price

                if (alert.maxPrice < alert.buyZoneMin * 0.9) {
                  return "0%"; // Below high risk zone
                } else if (alert.maxPrice < alert.buyZoneMin) {
                  // In high risk zone (0-15%)
                  const riskRange = alert.buyZoneMin - (alert.buyZoneMin * 0.9);
                  const posInRange = (alert.maxPrice - (alert.buyZoneMin * 0.9)) / riskRange;
                  return `${posInRange * 15}%`;
                } else if (alert.maxPrice <= alert.buyZoneMax) {
                  // In buy zone (15-30%)
                  const buyRange = alert.buyZoneMax - alert.buyZoneMin;
                  const posInRange = (alert.maxPrice - alert.buyZoneMin) / buyRange;
                  return `${15 + (posInRange * 15)}%`;
                } else if (alert.maxPrice <= alert.target3) {
                  // Between buy zone max and target 3 (30-85%)
                  const targetZoneWidth = alert.target3 - alert.buyZoneMax;
                  const posInRange = (alert.maxPrice - alert.buyZoneMax) / targetZoneWidth;
                  return `${30 + (posInRange * 55)}%`;
                } else {
                  // In overperform zone or beyond
                  const overRange = alert.target3 * 1.1 - alert.target3;
                  const posInRange = Math.min((alert.maxPrice - alert.target3) / overRange, 1);
                  return `${85 + (posInRange * 15)}%`;
                }
              })()
            }}>
              <div className="absolute -top-14 -translate-x-1/2 text-center w-24">
                <span className="text-[10px] font-medium block text-blue-600">Maximum Price</span>
                <span className="text-xs font-medium block font-mono text-blue-700">
                  ${alert.maxPrice?.toFixed(2) || 'N/A'}
                </span>
                <span className="text-[10px] text-green-600 font-bold block">
                  +{maxGainPercent}%
                </span>
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
      
      {/* Chart Image (Expandable) */}
      {isExpanded && (
        <div className="mt-6 mb-4 bg-gray-50 p-2 rounded">
          <div className="aspect-w-16 aspect-h-9 rounded overflow-hidden">
            {alert.chartImageUrl ? (
              <img 
                src={alert.chartImageUrl} 
                alt={`${alert.symbol} Stock Chart`} 
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
        <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex flex-col items-center justify-center">
            <Award className="h-5 w-5 text-green-600 mb-1" />
            <div className="text-xs font-medium text-green-800">Max Gain</div>
            <div className="text-sm font-bold text-green-700">+{maxGainPercent}%</div>
          </div>
          <Link href={`/stock-detail/${alert.symbol}`} className="w-full">
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
        <div className="text-right">
          <p className="text-xs font-medium text-black">Closed Date</p>
          <p className="text-sm font-medium text-black font-mono">
            {format(new Date(alert.updatedAt || alert.createdAt), 'MM/dd/yy')}
          </p>
        </div>
      </div>
    </div>
  );
}