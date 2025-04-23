import { useLocation } from "wouter";
import { 
  ArrowLeftIcon, 
  ArrowUpIcon, 
  LineChartIcon, 
  TrendingUpIcon, 
  LandmarkIcon, 
  LucideShieldCheck, 
  TargetIcon,
  BarChart3Icon 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

export default function SampleStockPickPage() {
  const [_, setLocation] = useLocation();

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <Button 
          variant="ghost" 
          className="mb-6 flex items-center gap-2" 
          onClick={handleBack}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Home
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader className="space-y-1">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                    Target 1 & 2 Hit
                  </Badge>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Technology</Badge>
                    <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">Growth</Badge>
                  </div>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold mb-1">NVIDIA (NVDA)</CardTitle>
                    <CardDescription className="text-lg">NVIDIA Corporation</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600 flex items-center">
                      +37.2% <ArrowUpIcon className="h-5 w-5 ml-1" />
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Alert duration: 42 days
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="aspect-video bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1614770596508-de1d826c3765?q=80&w=1600&auto=format&fit=crop" 
                    alt="NVIDIA stock chart" 
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-muted-foreground text-sm">Buy Zone</div>
                    <div className="font-bold">$720 - $750</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="text-muted-foreground text-sm">Current Price</div>
                    <div className="font-bold">$926.75</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-muted-foreground text-sm">Target 1 (Hit)</div>
                    <div className="font-bold text-green-600">$850 (+15.5%)</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-md">
                    <div className="text-muted-foreground text-sm">Target 2 (Hit)</div>
                    <div className="font-bold text-green-600">$920 (+26.8%)</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-3 rounded-md col-span-1">
                    <div className="text-muted-foreground text-sm">Target 3</div>
                    <div className="font-bold text-blue-600">$990 (+37.2%)</div>
                    <Progress value={92} className="h-2 mt-2" />
                    <div className="text-xs mt-1 text-right">
                      92% Complete
                    </div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-md col-span-1">
                    <div className="text-muted-foreground text-sm">Stop Loss</div>
                    <div className="font-bold text-red-600">$670 (-8.2%)</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md col-span-1">
                    <div className="text-muted-foreground text-sm">Risk/Reward</div>
                    <div className="font-bold">1:4.5</div>
                    <div className="text-xs mt-1">
                      Excellent ratio
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="analysis">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="analysis">Technical Analysis</TabsTrigger>
                    <TabsTrigger value="catalyst">Catalysts</TabsTrigger>
                    <TabsTrigger value="updates">Updates</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="analysis" className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Technical Analysis</h3>
                      <p>
                        NVIDIA has formed a strong support level around $720, with increasing volume indicating accumulation. 
                        The stock has been consolidating after its recent breakout and shows a bullish cup and handle pattern 
                        on the daily chart. The RSI is at 62, indicating room for continued upward movement without being 
                        overbought.
                      </p>
                      
                      <h4 className="font-medium">Key Technical Indicators:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Strong support at $720 with increasing volume</li>
                        <li>Multiple successful tests of the 50-day moving average</li>
                        <li>Cup and handle pattern completion</li>
                        <li>RSI at 62 - strong momentum without being overbought</li>
                        <li>MACD showing positive divergence</li>
                      </ul>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="bg-gray-50">
                          <LineChartIcon className="h-3 w-3 mr-1" /> Cup and Handle
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
                          <BarChart3Icon className="h-3 w-3 mr-1" /> Support Level
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
                          <TrendingUpIcon className="h-3 w-3 mr-1" /> Upward Trend
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="catalyst" className="space-y-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Catalysts</h3>
                      <p>
                        NVIDIA continues to dominate the AI chip market with significant growth potential from data center expansion 
                        and the increasing adoption of generative AI technologies. Their upcoming product launch and potential new 
                        partnerships could further accelerate growth.
                      </p>
                      
                      <h4 className="font-medium">Key Catalysts:</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Upcoming Blackwell GPU architecture launch</li>
                        <li>Expanding partnerships with cloud service providers</li>
                        <li>Continued AI adoption across enterprise customers</li>
                        <li>Data center growth estimated at 45% year-over-year</li>
                        <li>Potential new gaming GPUs announcement in Q3</li>
                      </ul>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" className="bg-gray-50">
                          <LandmarkIcon className="h-3 w-3 mr-1" /> Earnings Growth
                        </Badge>
                        <Badge variant="outline" className="bg-gray-50">
                          <LucideShieldCheck className="h-3 w-3 mr-1" /> Market Leader
                        </Badge>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="updates" className="space-y-4">
                    <div className="space-y-4">
                      <div className="border-l-2 border-green-500 pl-4 py-2">
                        <div className="text-sm text-muted-foreground">June 14, 2025</div>
                        <h4 className="font-medium text-green-600">Target 2 Hit! 🎯</h4>
                        <p className="text-sm">
                          NVIDIA has reached our second target of $920, representing a gain of 26.8% from the buy zone. 
                          Consider taking partial profits here while holding remaining position for Target 3.
                        </p>
                      </div>
                      
                      <div className="border-l-2 border-green-500 pl-4 py-2">
                        <div className="text-sm text-muted-foreground">May 28, 2025</div>
                        <h4 className="font-medium text-green-600">Target 1 Hit! 🎯</h4>
                        <p className="text-sm">
                          NVIDIA has successfully reached our first target of $850, representing a gain of 15.5% from 
                          the buy zone. Implement trailing stop loss strategy as discussed in alert.
                        </p>
                      </div>
                      
                      <div className="border-l-2 border-blue-500 pl-4 py-2">
                        <div className="text-sm text-muted-foreground">May 16, 2025</div>
                        <h4 className="font-medium">Position Update</h4>
                        <p className="text-sm">
                          NVIDIA is showing strong momentum following better-than-expected earnings. Stock is up 8% and 
                          approaching our first target. Maintain position with stop loss at $670.
                        </p>
                      </div>
                      
                      <div className="border-l-2 border-primary pl-4 py-2">
                        <div className="text-sm text-muted-foreground">May 5, 2025</div>
                        <h4 className="font-medium">Alert Issued</h4>
                        <p className="text-sm">
                          New stock alert for NVIDIA (NVDA). Buy zone identified at $720-$750 with excellent risk/reward 
                          profile of 1:4.5. Set up your position with appropriate allocation.
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Trading Strategy</CardTitle>
                <CardDescription>Recommended approach for this alert</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <TargetIcon className="h-4 w-4 text-primary" /> Entry Strategy
                  </h4>
                  <p className="text-sm mt-1">
                    Purchase in the buy zone of $720-$750. Consider scaling in with 1/3 positions if concerned about volatility.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <LucideShieldCheck className="h-4 w-4 text-primary" /> Risk Management
                  </h4>
                  <p className="text-sm mt-1">
                    Set stop loss at $670, representing a maximum risk of 8.2%. This allows protection against unexpected downside.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <TrendingUpIcon className="h-4 w-4 text-primary" /> Exit Plan
                  </h4>
                  <p className="text-sm mt-1">
                    <span className="text-green-600 font-medium">Target 1:</span> $850 - Take 30% profit<br />
                    <span className="text-green-600 font-medium">Target 2:</span> $920 - Take 30% profit<br />
                    <span className="text-blue-600 font-medium">Target 3:</span> $990 - Take remaining position
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm">Suggested Position Size</h4>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Conservative</div>
                      <div className="font-medium">2-3%</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Moderate</div>
                      <div className="font-medium">4-5%</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Aggressive</div>
                      <div className="font-medium">6-8%</div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Percentages refer to allocation of total portfolio value
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Why This Alert Works</CardTitle>
                <CardDescription>Our analysis methodology</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">
                  This stock alert demonstrates the key qualities we look for in all TradeEdge Pro recommendations:
                </p>
                <ul className="text-sm space-y-2">
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <span><strong>Clear entry and exit points</strong> - specific buy zone and three defined targets</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <span><strong>Excellent risk-reward ratio</strong> - potential upside of 37.2% vs downside of 8.2%</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <span><strong>Technical analysis confirmation</strong> - support levels, pattern recognition, and momentum indicators</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <span><strong>Fundamental catalysts</strong> - upcoming product launches and market growth projections</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="min-w-4 mt-1">
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    </div>
                    <span><strong>Ongoing monitoring</strong> - regular updates and position management guidance</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleBack}>
                  Join TradeEdge Pro
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}