import { useState } from "react";
import { useLocation } from "wouter";
import { 
  ArrowRightIcon, 
  CheckIcon, 
  BarChart4Icon, 
  BookOpenIcon, 
  NotebookPenIcon, 
  LightbulbIcon, 
  BellIcon, 
  TrendingUpIcon,
  UsersIcon,
  HeartHandshakeIcon,
  ShieldCheckIcon,
  CalendarClockIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
  const [, navigate] = useLocation();
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  
  const toggleFAQ = (index: number) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };
  
  const handleGetStarted = () => {
    navigate("/signup");
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart4Icon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TradeEdge Pro</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:underline underline-offset-4">Features</a>
            <a href="#success" className="text-sm font-medium hover:underline underline-offset-4">Success Center</a>
            <a href="#pricing" className="text-sm font-medium hover:underline underline-offset-4">Pricing</a>
            <a href="#faq" className="text-sm font-medium hover:underline underline-offset-4">FAQ</a>
            <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
              Login
            </Button>
            <Button size="sm" onClick={handleGetStarted}>
              Sign Up
            </Button>
          </nav>
          <div className="flex md:hidden">
            <Button variant="ghost" size="sm">
              <span className="sr-only">Menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-50 -z-10" />
        <div className="container grid md:grid-cols-2 gap-8 py-20 items-center">
          <div className="space-y-6">
            <Badge className="px-3 py-1 text-sm" variant="secondary">
              Trusted by 1,000+ traders
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Trade Smarter, Not Harder with TradeEdge Pro
            </h1>
            <p className="text-xl text-muted-foreground">
              Curated stock picks, educational resources, and expert coaching to help you build a profitable trading strategy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" onClick={handleGetStarted}>
                Get Started <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
                Log In
              </Button>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex -space-x-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-primary/80 flex items-center justify-center text-white text-xs ring-2 ring-background">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-muted-foreground">
                Join hundreds of successful traders today
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-lg relative">
            <div className="aspect-[16/9] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHRyYWRpbmd8ZW58MHx8MHx8fDA%3D" 
                alt="Stock Trading Dashboard" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute bottom-0 right-0 transform translate-y-1/3">
              <div className="bg-white p-4 rounded-lg shadow-lg flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <TrendingUpIcon className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-medium">AAPL Target Hit</div>
                  <div className="text-xs text-green-600">+15.4% gain</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold mb-4">Everything You Need to Trade Successfully</h2>
            <p className="text-lg text-muted-foreground">
              TradeEdge Pro combines expert stock alerts, educational resources, and personalized coaching to help traders of all levels succeed. Our comprehensive platform provides everything you need in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-16 mb-16">
            {/* Left Column - Stock Alerts Feature */}
            <div className="space-y-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start">
                  <BarChart4Icon className="h-8 w-8 text-primary mr-2" />
                  Curated Stock Alerts
                </h3>
                <p className="text-muted-foreground mb-6">
                  Our expert traders identify high-probability setups with clear entry and exit points, helping you make informed trading decisions.
                </p>
              </div>
              
              <div className="bg-white rounded-xl border shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-medium">Example Stock Alert: AAPL</h4>
                </div>
                <div className="p-4">
                  <div className="flex justify-between mb-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Buy Zone</div>
                      <div className="font-medium">$175 - $185</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Current Price</div>
                      <div className="font-medium">$171.71</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between">
                      <div className="text-sm">Target 1</div>
                      <div className="text-sm font-medium text-green-600">$195 (+11.4%)</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm">Target 2</div>
                      <div className="text-sm font-medium text-green-600">$210 (+20.0%)</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-sm">Target 3</div>
                      <div className="text-sm font-medium text-green-600">$225 (+28.6%)</div>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <div className="text-sm text-muted-foreground mb-1">Technical Reasons</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="bg-blue-50">Support Level</Badge>
                      <Badge variant="outline" className="bg-blue-50">Oversold RSI</Badge>
                      <Badge variant="outline" className="bg-blue-50">Earnings Beat</Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">Clear Entry & Exit</h4>
                    <p className="text-sm text-muted-foreground">
                      Every alert includes defined buy zones, profit targets, and technical analysis.
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">Risk Management</h4>
                    <p className="text-sm text-muted-foreground">
                      We prioritize favorable risk-reward ratios to protect your capital.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Right Column - Education & Coaching */}
            <div className="space-y-8">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-3 flex items-center justify-center md:justify-start">
                  <BookOpenIcon className="h-8 w-8 text-primary mr-2" />
                  Education & Coaching
                </h3>
                <p className="text-muted-foreground mb-6">
                  Build your trading skills with our comprehensive educational resources and personalized coaching options.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Video Tutorials</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Step-by-step guides on technical analysis, chart patterns, and trading psychology.
                    </p>
                    <Badge>20+ Hours</Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Trading Guides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Detailed written resources on market mechanics, strategies, and analysis.
                    </p>
                    <Badge>50+ Articles</Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Group Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Weekly live sessions to analyze new alerts and answer member questions.
                    </p>
                    <Badge>Weekly</Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">1-on-1 Coaching</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-2">
                      Personalized guidance tailored to your trading goals and experience.
                    </p>
                    <Badge>60 Minutes</Badge>
                  </CardContent>
                </Card>
              </div>
              
              <div className="bg-white rounded-xl border shadow-md overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                  <h4 className="font-medium">Portfolio Tools & Tracking</h4>
                </div>
                <div className="p-4">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Performance Analytics</span>
                        <p className="text-sm text-muted-foreground">Track your wins, losses, and overall portfolio performance</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Custom Alerts</span>
                        <p className="text-sm text-muted-foreground">Set email and SMS notifications for price targets</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-medium">Trade Journal</span>
                        <p className="text-sm text-muted-foreground">Document your trading decisions and track improvement</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Center Section */}
      <section id="success" className="py-20 bg-gradient-to-b from-white to-blue-50">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4">Success Center</Badge>
            <h2 className="text-3xl font-bold mb-4">Our Track Record of Results</h2>
            <p className="text-lg text-muted-foreground">
              TradeEdge Pro has a proven history of delivering high-quality stock alerts with impressive results. Here's how our alerts have performed.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <div className="bg-white p-6 rounded-xl border shadow-md text-center">
              <div className="text-primary text-4xl font-bold mb-2">247</div>
              <div className="text-lg font-medium mb-1">Total Alerts</div>
              <p className="text-sm text-muted-foreground">
                Carefully selected stock picks since launch
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-md text-center">
              <div className="text-primary text-4xl font-bold mb-2">12-18</div>
              <div className="text-lg font-medium mb-1">Monthly Alerts</div>
              <p className="text-sm text-muted-foreground">
                New opportunities sent each month
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-md text-center">
              <div className="text-green-600 text-4xl font-bold mb-2">78%</div>
              <div className="text-lg font-medium mb-1">Target 1 Hit Rate</div>
              <p className="text-sm text-muted-foreground">
                Percentage of alerts reaching first target
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-xl border shadow-md text-center">
              <div className="text-green-600 text-4xl font-bold mb-2">+14.3%</div>
              <div className="text-lg font-medium mb-1">Avg. Target 1 Gain</div>
              <p className="text-sm text-muted-foreground">
                Average percentage gain at first target
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-3 bg-white p-6 rounded-xl border shadow-md">
              <h3 className="text-xl font-bold mb-4">Recent Success Stories</h3>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">MSFT</div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">All Targets Hit</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Buy Zone</div>
                      <div>$395-$415</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 1</div>
                      <div className="text-green-600">$430 (+8.9%)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 2</div>
                      <div className="text-green-600">$450 (+13.9%)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 3</div>
                      <div className="text-green-600">$475 (+20.3%)</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">AMZN</div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Target 1 & 2 Hit</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Buy Zone</div>
                      <div>$170-$180</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 1</div>
                      <div className="text-green-600">$195 (+14.7%)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 2</div>
                      <div className="text-green-600">$210 (+23.5%)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 3</div>
                      <div>$225 (+32.4%)</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">NFLX</div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">All Targets Hit</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Buy Zone</div>
                      <div>$580-$610</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 1</div>
                      <div className="text-green-600">$650 (+12.1%)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 2</div>
                      <div className="text-green-600">$680 (+17.2%)</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Target 3</div>
                      <div className="text-green-600">$700 (+20.7%)</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => navigate("/success-center")}>
                  View Detailed Performance
                </Button>
              </div>
            </div>
            
            <div className="md:col-span-2 bg-white p-6 rounded-xl border shadow-md">
              <h3 className="text-xl font-bold mb-4">Member Achievements</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <TrendingUpIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">First Target Hit</div>
                    <div className="text-sm text-muted-foreground">458 members achieved</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <CalendarClockIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">6-Month Consistency</div>
                    <div className="text-sm text-muted-foreground">312 members achieved</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ShieldCheckIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Risk Manager</div>
                    <div className="text-sm text-muted-foreground">267 members achieved</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <LightbulbIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">Education Master</div>
                    <div className="text-sm text-muted-foreground">189 members achieved</div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => navigate("/badges")}>
                  View All Achievements
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4">Pricing</Badge>
            <h2 className="text-3xl font-bold mb-4">Choose the Right Plan for You</h2>
            <p className="text-lg text-muted-foreground">
              From casual traders to serious professionals, we have a membership tier that fits your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Free Tier */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Free</CardTitle>
                <div className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-3xl font-bold tracking-tight">$0</span>
                  <span className="ml-1 text-sm text-muted-foreground">/forever</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>One free trade idea per month</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Basic educational content</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Weekly market summaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Weekly Intro to TradeEdge coaching</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                  Get Started
                </Button>
              </CardFooter>
            </Card>

            {/* Paid Tier */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Paid</CardTitle>
                <div className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-3xl font-bold tracking-tight">$29.99</span>
                  <span className="ml-1 text-sm text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>All stock alerts</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Portfolio tracking</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Custom notification settings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Full education library</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Weekly 'New Alerts' coaching</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleGetStarted}>
                  Subscribe
                </Button>
              </CardFooter>
            </Card>

            {/* Premium Tier */}
            <Card className="border-2 border-primary relative">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-primary hover:bg-primary text-white">Most Popular</Badge>
              </div>
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <div className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-3xl font-bold tracking-tight">$999</span>
                  <span className="ml-1 text-sm text-muted-foreground">/year</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>All Paid tier features</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Priority notifications</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Weekly New Alerts & Q&A sessions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Annual portfolio review</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Annual 1-hour consultation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>25% off additional coaching calls</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90" onClick={handleGetStarted}>
                  Subscribe
                </Button>
              </CardFooter>
            </Card>

            {/* Mentorship Tier */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Mentorship</CardTitle>
                <div className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-3xl font-bold tracking-tight">$5,000</span>
                  <span className="ml-1 text-sm text-muted-foreground">/one-time</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="mt-6 space-y-4">
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>All Premium tier benefits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>20 structured coaching sessions over 12 months</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Personalized trading strategy</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Ongoing performance evaluation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={handleGetStarted}>
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge className="mb-4">FAQs</Badge>
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">
              Get answers to common questions about TradeEdge Pro.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {[
              {
                question: "How many stock alerts will I receive each month?",
                answer: "The number varies based on market conditions, but Paid and Premium members typically receive 5-10 new stock alerts per month. We focus on quality over quantity, only sending alerts with high-probability setups."
              },
              {
                question: "Do I need to be an experienced trader to benefit from TradeEdge Pro?",
                answer: "Not at all. We cater to traders of all experience levels. Beginners can start with our educational resources and gradually implement our trading strategies, while experienced traders can immediately leverage our alerts and coaching."
              },
              {
                question: "Can I upgrade or downgrade my membership tier later?",
                answer: "Yes, you can change your membership tier at any time. Upgrades take effect immediately, while downgrades will be applied at the end of your current billing cycle."
              },
              {
                question: "How do the coaching sessions work?",
                answer: "Depending on your membership tier, coaching sessions are conducted via video calls. Group sessions follow a scheduled calendar, while 1-on-1 sessions can be booked through our platform at times that work for you."
              },
              {
                question: "Is this a 'get rich quick' program?",
                answer: "Absolutely not. TradeEdge Pro provides educational resources, trading alerts, and coaching to help you develop sustainable trading skills. Trading involves risk, and while we help improve your odds, success requires discipline and adherence to risk management principles."
              },
            ].map((faq, index) => (
              <div key={index} className="border-b last:border-0 py-4">
                <button
                  className="flex justify-between items-center w-full text-left py-2 focus:outline-none"
                  onClick={() => toggleFAQ(index)}
                >
                  <h3 className="text-lg font-medium">{faq.question}</h3>
                  <svg
                    className={`h-5 w-5 transform ${activeFAQ === index ? 'rotate-180' : ''} transition-transform`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <div
                  className={`mt-2 ${
                    activeFAQ === index ? 'block' : 'hidden'
                  } text-muted-foreground`}
                >
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-white">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Trading?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join TradeEdge Pro today and get access to expert stock picks, educational resources, and the support you need to succeed.
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            onClick={handleGetStarted}
            className="text-primary font-medium hover:bg-white"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BarChart4Icon className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">TradeEdge Pro</span>
              </div>
              <p className="text-gray-400 mb-4">
                Your partner for smarter trading decisions.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Pages</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Home</a></li>
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="#success" className="text-gray-400 hover:text-white">Success Center</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="text-gray-400 hover:text-white">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Refund Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Financial Disclaimer</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Michigan Regulations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-gray-400">
                  <a href="mailto:support@tradeedgepro.com" className="hover:text-white">support@tradeedgepro.com</a>
                </li>
                <li className="text-gray-400">
                  <a href="tel:+18002265430" className="hover:text-white">1-800-226-5430</a>
                </li>
                <li className="text-gray-400">
                  TradeEdge Pro LLC<br />
                  123 Financial Ave<br />
                  Ann Arbor, MI 48104
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 text-sm">
            <p className="mb-4">
              TradeEdge Pro LLC is not registered as an investment adviser with the Securities and Exchange Commission 
              or the Michigan Department of Licensing and Regulatory Affairs, Securities Division. The information provided 
              is for educational purposes only and should not be construed as investment advice.
            </p>
            <p>
              &copy; {new Date().getFullYear()} TradeEdge Pro LLC. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}