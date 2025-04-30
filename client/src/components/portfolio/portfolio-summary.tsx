import { PortfolioItem, StockAlert } from "@shared/schema";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState, useMemo } from "react";
import { 
  Filter, 
  ArrowUpDown, 
  Check, 
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type EnrichedPortfolioItem = PortfolioItem & { stockAlert: StockAlert };

interface PortfolioSummaryProps {
  items: EnrichedPortfolioItem[];
}

type SortableField = 
  | "symbol" 
  | "status" 
  | "buyZone" 
  | "buyPrice" 
  | "currentOrSellPrice" 
  | "gainDollar" 
  | "gainPercent"
  | "duration";

type SortDirection = "asc" | "desc";

type FilterState = {
  status: "all" | "active" | "closed";
  buyZone: {
    inZone: boolean;
    belowZone: boolean;
    aboveZone: boolean;
  };
  hitTarget1: boolean | null;
  hitTarget2: boolean | null;
  hitTarget3: boolean | null;
};

export default function PortfolioSummary({ items }: PortfolioSummaryProps) {
  // State for filters and sorting
  const [sortField, setSortField] = useState<SortableField>("symbol");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [filters, setFilters] = useState<FilterState>({
    status: "all",
    buyZone: {
      inZone: false,
      belowZone: false,
      aboveZone: false
    },
    hitTarget1: null,
    hitTarget2: null,
    hitTarget3: null,
  });

  // Toggle sort field and direction
  const toggleSort = (field: SortableField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Count how many buy zone filters are active
  const activeBuyZoneFilters = 
    (filters.buyZone.inZone ? 1 : 0) + 
    (filters.buyZone.belowZone ? 1 : 0) + 
    (filters.buyZone.aboveZone ? 1 : 0);

  // Buy zone filter label
  const buyZoneFilterLabel = activeBuyZoneFilters === 0 
    ? "Buy Zone"
    : `Buy Zone (${activeBuyZoneFilters})`;

  // Toggle a buy zone filter
  const toggleBuyZoneFilter = (zone: 'inZone' | 'belowZone' | 'aboveZone') => {
    setFilters({
      ...filters,
      buyZone: {
        ...filters.buyZone,
        [zone]: !filters.buyZone[zone]
      }
    });
  };

  // Apply all filters and sorting
  const filteredAndSortedItems = useMemo(() => {
    // Start with all items
    let result = [...items];
    
    // Apply status filter
    if (filters.status !== "all") {
      result = result.filter(item => 
        filters.status === "active" ? !item.sold : item.sold
      );
    }
    
    // Apply buy zone filters
    const anyBuyZoneFilterActive = 
      filters.buyZone.inZone || 
      filters.buyZone.belowZone || 
      filters.buyZone.aboveZone;
    
    if (anyBuyZoneFilterActive) {
      result = result.filter(item => {
        const isInZone = item.boughtPrice >= item.stockAlert.buyZoneMin && 
                         item.boughtPrice <= item.stockAlert.buyZoneMax;
        const isBelowZone = item.boughtPrice < item.stockAlert.buyZoneMin;
        const isAboveZone = item.boughtPrice > item.stockAlert.buyZoneMax;
        
        return (
          (filters.buyZone.inZone && isInZone) ||
          (filters.buyZone.belowZone && isBelowZone) ||
          (filters.buyZone.aboveZone && isAboveZone)
        );
      });
    }
    
    // Filter by target hits
    if (filters.hitTarget1 !== null) {
      result = result.filter(item => {
        const priceToCheck = item.sold && item.soldPrice ? item.soldPrice : item.stockAlert.currentPrice;
        const hitTarget = priceToCheck >= item.stockAlert.target1;
        return filters.hitTarget1 ? hitTarget : !hitTarget;
      });
    }
    
    if (filters.hitTarget2 !== null) {
      result = result.filter(item => {
        const priceToCheck = item.sold && item.soldPrice ? item.soldPrice : item.stockAlert.currentPrice;
        const hitTarget = priceToCheck >= item.stockAlert.target2;
        return filters.hitTarget2 ? hitTarget : !hitTarget;
      });
    }
    
    if (filters.hitTarget3 !== null) {
      result = result.filter(item => {
        const priceToCheck = item.sold && item.soldPrice ? item.soldPrice : item.stockAlert.currentPrice;
        const hitTarget = priceToCheck >= item.stockAlert.target3;
        return filters.hitTarget3 ? hitTarget : !hitTarget;
      });
    }
    
    // Sort the items
    return result.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // Extract the appropriate values based on sort field
      switch (sortField) {
        case "symbol":
          aValue = a.stockAlert.symbol;
          bValue = b.stockAlert.symbol;
          break;
        case "status":
          aValue = a.sold ? "closed" : "active";
          bValue = b.sold ? "closed" : "active";
          break;
        case "buyZone":
          // Categorize buy zone for sorting
          const getZoneValue = (item: EnrichedPortfolioItem) => {
            if (item.boughtPrice < item.stockAlert.buyZoneMin) return 0; // Below zone
            if (item.boughtPrice <= item.stockAlert.buyZoneMax) return 1; // In zone
            return 2; // Above zone
          };
          aValue = getZoneValue(a);
          bValue = getZoneValue(b);
          break;
        case "buyPrice":
          aValue = a.boughtPrice;
          bValue = b.boughtPrice;
          break;
        case "currentOrSellPrice":
          aValue = a.sold && a.soldPrice ? a.soldPrice : a.stockAlert.currentPrice;
          bValue = b.sold && b.soldPrice ? b.soldPrice : b.stockAlert.currentPrice;
          break;
        case "gainDollar":
          // Calculate dollar gain
          const aCurrentOrSell = a.sold && a.soldPrice ? a.soldPrice : a.stockAlert.currentPrice;
          const bCurrentOrSell = b.sold && b.soldPrice ? b.soldPrice : b.stockAlert.currentPrice;
          aValue = (aCurrentOrSell - a.boughtPrice) * a.quantity;
          bValue = (bCurrentOrSell - b.boughtPrice) * b.quantity;
          break;
        case "gainPercent":
          // Calculate percent gain
          const aCurrentOrSellPercent = a.sold && a.soldPrice ? a.soldPrice : a.stockAlert.currentPrice;
          const bCurrentOrSellPercent = b.sold && b.soldPrice ? b.soldPrice : b.stockAlert.currentPrice;
          aValue = ((aCurrentOrSellPercent - a.boughtPrice) / a.boughtPrice) * 100;
          bValue = ((bCurrentOrSellPercent - b.boughtPrice) / b.boughtPrice) * 100;
          break;
        case "duration":
          // Calculate hold time
          const calculateHoldDays = (item: EnrichedPortfolioItem) => {
            try {
              const buyDate = new Date(item.createdAt);
              const endDate = item.soldAt ? new Date(item.soldAt) : new Date();
              return Math.floor((endDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
            } catch (error) {
              return 0;
            }
          };
          aValue = calculateHoldDays(a);
          bValue = calculateHoldDays(b);
          break;
        default:
          return 0;
      }
      
      // Compare the values based on sort direction
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortDirection === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue);
      } else {
        return sortDirection === "asc" 
          ? (aValue > bValue ? 1 : -1) 
          : (bValue > aValue ? 1 : -1);
      }
    });
  }, [items, filters, sortField, sortDirection]);

  // Function to calculate and display buy zone status
  const getBuyZoneStatus = (item: EnrichedPortfolioItem) => {
    if (item.boughtPrice >= item.stockAlert.buyZoneMin && item.boughtPrice <= item.stockAlert.buyZoneMax) {
      return { status: "In Buy Zone", class: "bg-green-100 text-green-700" };
    } else if (item.boughtPrice < item.stockAlert.buyZoneMin) {
      return { status: "High Risk/Reward", class: "bg-amber-100 text-amber-700" };
    } else {
      return { status: "Above Buy Zone", class: "bg-red-100 text-red-700" };
    }
  };

  // Function to check if target was hit
  const wasTargetHit = (item: EnrichedPortfolioItem, targetPrice: number) => {
    const maxPrice = item.sold && item.soldPrice 
      ? Math.max(item.soldPrice, item.stockAlert.maxPrice || 0) 
      : item.stockAlert.maxPrice || item.stockAlert.currentPrice;
    
    return maxPrice >= targetPrice;
  };

  // Reset all filters
  const resetAllFilters = () => {
    setFilters({
      status: "all",
      buyZone: {
        inZone: false,
        belowZone: false,
        aboveZone: false
      },
      hitTarget1: null,
      hitTarget2: null,
      hitTarget3: null,
    });
  };

  return (
    <div className="space-y-4">
      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Status Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              Status
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setFilters({...filters, status: "all"})}>
                {filters.status === "all" && <Check className="w-4 h-4 mr-2" />}
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, status: "active"})}>
                {filters.status === "active" && <Check className="w-4 h-4 mr-2" />}
                Active
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, status: "closed"})}>
                {filters.status === "closed" && <Check className="w-4 h-4 mr-2" />}
                Closed
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Buy Zone Filter - Multi-select */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              {buyZoneFilterLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuCheckboxItem
                checked={filters.buyZone.inZone}
                onCheckedChange={() => toggleBuyZoneFilter('inZone')}
              >
                In Buy Zone
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.buyZone.belowZone}
                onCheckedChange={() => toggleBuyZoneFilter('belowZone')}
              >
                High Risk/Reward
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filters.buyZone.aboveZone}
                onCheckedChange={() => toggleBuyZoneFilter('aboveZone')}
              >
                Above Buy Zone
              </DropdownMenuCheckboxItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Target 1 Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              Target 1
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget1: null})}>
                {filters.hitTarget1 === null && <Check className="w-4 h-4 mr-2" />}
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget1: true})}>
                {filters.hitTarget1 === true && <Check className="w-4 h-4 mr-2" />}
                Hit Target
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget1: false})}>
                {filters.hitTarget1 === false && <Check className="w-4 h-4 mr-2" />}
                Didn't Hit Target
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Target 2 Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              Target 2
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget2: null})}>
                {filters.hitTarget2 === null && <Check className="w-4 h-4 mr-2" />}
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget2: true})}>
                {filters.hitTarget2 === true && <Check className="w-4 h-4 mr-2" />}
                Hit Target
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget2: false})}>
                {filters.hitTarget2 === false && <Check className="w-4 h-4 mr-2" />}
                Didn't Hit Target
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Target 3 Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1">
              <Filter className="h-3.5 w-3.5" />
              Target 3
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget3: null})}>
                {filters.hitTarget3 === null && <Check className="w-4 h-4 mr-2" />}
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget3: true})}>
                {filters.hitTarget3 === true && <Check className="w-4 h-4 mr-2" />}
                Hit Target
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters({...filters, hitTarget3: false})}>
                {filters.hitTarget3 === false && <Check className="w-4 h-4 mr-2" />}
                Didn't Hit Target
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* Reset Filters Button */}
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8"
          onClick={resetAllFilters}
        >
          Reset Filters
        </Button>
      </div>
      
      {/* Results Counter */}
      <div className="text-sm text-neutral-500 mb-2">
        Showing {filteredAndSortedItems.length} of {items.length} positions
      </div>
      
      {/* Data Table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Symbol</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("symbol")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "symbol" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Status</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("status")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "status" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Buy Zone</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("buyZone")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "buyZone" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Buy Price</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("buyPrice")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "buyPrice" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Current/Sell Price</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("currentOrSellPrice")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "currentOrSellPrice" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Gain $</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("gainDollar")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "gainDollar" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Gain %</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("gainPercent")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "gainPercent" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead>
                <div className="flex flex-col items-center">
                  <span className="font-semibold">Duration</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="px-1 h-6 mt-1"
                    onClick={() => toggleSort("duration")}
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {sortField === "duration" && (
                      sortDirection === "asc" 
                        ? <ChevronUp className="ml-1 h-3 w-3" /> 
                        : <ChevronDown className="ml-1 h-3 w-3" />
                    )}
                  </Button>
                </div>
              </TableHead>
              <TableHead className="text-center font-semibold">Target 1</TableHead>
              <TableHead className="text-center font-semibold">Target 2</TableHead>
              <TableHead className="text-center font-semibold">Target 3</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedItems.map(item => {
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
              let holdDays = 0;
              let holdDaysFormatted = "N/A";
              
              try {
                const buyDate = new Date(item.createdAt);
                
                if (item.soldAt) {
                  const sellDate = new Date(item.soldAt);
                  holdDays = Math.floor((sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
                } else {
                  const today = new Date();
                  holdDays = Math.floor((today.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
                }
                
                // Format duration for display
                if (holdDays >= 365) {
                  const years = Math.floor(holdDays / 365);
                  const remainingDays = holdDays % 365;
                  holdDaysFormatted = `${years}y ${remainingDays}d`;
                } else if (holdDays >= 30) {
                  const months = Math.floor(holdDays / 30);
                  const remainingDays = holdDays % 30;
                  holdDaysFormatted = `${months}m ${remainingDays}d`;
                } else {
                  holdDaysFormatted = `${holdDays}d`;
                }
                
                // Sanity check
                if (isNaN(holdDays) || holdDays < 0) {
                  holdDays = 0;
                  holdDaysFormatted = "0d";
                }
              } catch (error) {
                console.error("Date formatting error:", error);
              }
              
              // Determine buy zone status
              const buyZoneInfo = getBuyZoneStatus(item);
              
              // Check if targets were hit
              const hitTarget1 = wasTargetHit(item, item.stockAlert.target1);
              const hitTarget2 = wasTargetHit(item, item.stockAlert.target2);
              const hitTarget3 = wasTargetHit(item, item.stockAlert.target3);
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold">{item.stockAlert.symbol}</TableCell>
                  <TableCell>
                    {item.sold ? (
                      <Badge variant="outline" className="bg-neutral-100">Closed</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-blue-100 text-primary">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={buyZoneInfo.class}>
                      {buyZoneInfo.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">${item.boughtPrice.toFixed(2)}</TableCell>
                  <TableCell className={`font-mono ${item.sold ? "font-bold" : ""}`}>
                    ${currentOrSellPrice.toFixed(2)}
                  </TableCell>
                  <TableCell className={`font-mono ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profit.toFixed(2)}
                  </TableCell>
                  <TableCell className={`font-mono ${percentProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {percentProfit >= 0 ? '+' : ''}{percentProfit.toFixed(2)}%
                  </TableCell>
                  <TableCell>
                    {holdDaysFormatted}
                  </TableCell>
                  <TableCell className="text-center">
                    {hitTarget1 ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {hitTarget2 ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {hitTarget3 ? (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    ) : (
                      <span className="text-neutral-300">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            
            {filteredAndSortedItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-6 text-neutral-500">
                  No positions found matching the selected filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}