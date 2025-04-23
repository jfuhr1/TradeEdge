import { useState } from "react";
import { useLocation } from "wouter";
import { 
  CheckIcon, 
  ArrowRightIcon, 
  GraduationCapIcon, 
  BellIcon, 
  TrendingUpIcon, 
  CalendarIcon,
  BarChart4Icon,
  ScaleIcon,
  CoinsIcon,
  ClockIcon,
  ShieldIcon,
  BrainIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const TRADING_RULES = [
  {
    id: 1,
    title: "Risk Management First",
    icon: <ScaleIcon className="h-6 w-6 text-primary" />,
    description: "Never risk more than 1-2% of your portfolio on a single trade. Use stop losses for all positions."
  },
  {
    id: 2,
    title: "Buy in Zones, Not at Exact Prices",
    icon: <BarChart4Icon className="h-6 w-6 text-primary" />,
    description: "Our alerts provide buy zones, not exact entry points. Establish positions gradually within these ranges."
  },
  {
    id: 3,
    title: "Scale Out at Targets",
    icon: <TrendingUpIcon className="h-6 w-6 text-primary" />,
    description: "Take partial profits at each target level instead of waiting for the maximum price."
  },
  {
    id: 4,
    title: "Consistent Process Over Results",
    icon: <ClockIcon className="h-6 w-6 text-primary" />,
    description: "Focus on following your trading plan consistently rather than obsessing over individual trades."
  },
  {
    id: 5,
    title: "Size Positions Based on Conviction",
    icon: <CoinsIcon className="h-6 w-6 text-primary" />,
    description: "Adjust position sizes based on your conviction level and the stock's risk/reward profile."
  },
  {
    id: 6,
    title: "Keep a Trading Journal",
    icon: <GraduationCapIcon className="h-6 w-6 text-primary" />,
    description: "Document all trades in our portfolio tracker to learn from both successes and mistakes."
  },
  {
    id: 7,
    title: "Align with Market Trends",
    icon: <TrendingUpIcon className="h-6 w-6 text-primary" />,
    description: "Consider the broader market direction when making individual stock trades."
  },
  {
    id: 8,
    title: "Manage Emotions",
    icon: <BrainIcon className="h-6 w-6 text-primary" />,
    description: "Trade with a clear mind. Never make decisions based on FOMO, greed, or fear."
  },
  {
    id: 9,
    title: "Use Proper Position Sizing",
    icon: <ScaleIcon className="h-6 w-6 text-primary" />,
    description: "Allocate capital based on account size, risk, and conviction level."
  },
  {
    id: 10,
    title: "Protect Your Capital",
    icon: <ShieldIcon className="h-6 w-6 text-primary" />,
    description: "Your primary goal is to preserve capital; profits will follow disciplined trading."
  }
];

export default function WelcomePage() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [rulesConfirmed, setRulesConfirmed] = useState(false);
  
  const goToNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo(0, 0);
    } else {
      navigate("/dashboard");
    }
  };
  
  const progressPercentage = (currentStep / 4) * 100;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart4Icon className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">TradeEdge Pro</span>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={progressPercentage} className="w-40 h-2" />
            <span className="text-sm text-muted-foreground">Step {currentStep} of 4</span>
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          {currentStep === 1 && (
            <div className="space-y-8">
              <div className="text-center">
                <Badge className="mb-4">Welcome</Badge>
                <h1 className="text-3xl font-bold mb-2">Welcome to TradeEdge Pro!</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  We're excited to have you join our community of traders. Let's get you started with a quick tour of the platform.
                </p>
              </div>
              
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>How TradeEdge Pro Works</CardTitle>
                  <CardDescription>Here's a brief overview of our key features and how to use them</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                        <TrendingUpIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Stock Alerts</h3>
                        <p className="text-sm text-muted-foreground">
                          Receive curated stock picks with entry zones, target prices, and technical reasons.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                        <BellIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                          Customize which alerts you receive and how you receive them.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                        <BarChart4Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Portfolio Tracking</h3>
                        <p className="text-sm text-muted-foreground">
                          Log your trades and monitor your performance over time.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                        <GraduationCapIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Education Center</h3>
                        <p className="text-sm text-muted-foreground">
                          Access our extensive library of trading resources and courses.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-12 w-12 flex items-center justify-center shrink-0">
                        <CalendarIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Coaching Sessions</h3>
                        <p className="text-sm text-muted-foreground">
                          Book one-on-one or attend group coaching sessions based on your membership.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={goToNext} className="w-full">
                    Explore the Dashboard <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
          
          {currentStep === 2 && (
            <div className="space-y-8">
              <div className="text-center">
                <Badge className="mb-4">Trading Rules</Badge>
                <h1 className="text-3xl font-bold mb-2">TradeEdge Pro Trading Rules</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  These 10 trading rules will help you maximize your success and minimize risk. Please review them carefully.
                </p>
              </div>
              
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>The 10 Rules of Successful Trading</CardTitle>
                  <CardDescription>Following these rules consistently will improve your trading results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {TRADING_RULES.map((rule) => (
                      <div key={rule.id} className="flex gap-4">
                        <div className="bg-primary/10 rounded-full h-10 w-10 flex items-center justify-center shrink-0">
                          {rule.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold">{rule.title}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                    ))}
                    
                    <Separator className="my-6" />
                    
                    <div className="flex items-start gap-3">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          id="rules-confirmation"
                          checked={rulesConfirmed}
                          onChange={(e) => setRulesConfirmed(e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </div>
                      <label htmlFor="rules-confirmation" className="text-sm">
                        I have read and understood the TradeEdge Pro Trading Rules. I acknowledge that trading involves risk, 
                        and I am responsible for my own trading decisions.
                      </label>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={goToNext} disabled={!rulesConfirmed} className="w-full">
                    I Understand and Agree <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
          
          {currentStep === 3 && (
            <div className="space-y-8">
              <div className="text-center">
                <Badge className="mb-4">Key Features</Badge>
                <h1 className="text-3xl font-bold mb-2">Getting Started</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Here are some recommended first steps to make the most of your TradeEdge Pro membership.
                </p>
              </div>
              
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle>Your First Steps</CardTitle>
                  <CardDescription>Complete these actions to get started quickly</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <span className="font-medium">1</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Set Up Your Notification Preferences</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Customize which alerts you want to receive and how you'd like to be notified.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate("/notification-settings")}>
                          Notification Settings
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <span className="font-medium">2</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Review Current Stock Alerts</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          View our current stock picks and see which ones are in the buy zone.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate("/stock-alerts")}>
                          Stock Alerts
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <span className="font-medium">3</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Explore Educational Resources</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Begin with our foundational courses on technical analysis and risk management.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate("/education")}>
                          Education Center
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <span className="font-medium">4</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Check Upcoming Coaching Sessions</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          View the schedule for group sessions or book a one-on-one coaching call.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate("/coaching")}>
                          Coaching Calendar
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="bg-primary/10 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                        <span className="font-medium">5</span>
                      </div>
                      <div>
                        <h3 className="font-semibold">Setup Your Portfolio</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Start tracking your trades and measuring your performance.
                        </p>
                        <Button variant="outline" size="sm" onClick={() => navigate("/portfolio")}>
                          Portfolio Tracker
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={goToNext} className="w-full">
                    Continue <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
          
          {currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <Badge className="mb-4">All Set!</Badge>
                <h1 className="text-3xl font-bold mb-2">You're Ready to Trade!</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Your TradeEdge Pro account is now fully set up. You're ready to start your trading journey.
                </p>
              </div>
              
              <Card>
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>Welcome to the TradeEdge Pro Community</CardTitle>
                  <CardDescription>You're now part of a community of traders dedicated to improvement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-center">
                    <p className="text-muted-foreground">
                      Your dashboard is the central hub for all TradeEdge Pro features. You'll find your personalized stock alerts, 
                      educational recommendations, and upcoming coaching sessions there.
                    </p>
                    <p className="text-muted-foreground">
                      Remember, consistency and discipline are key to trading success. Follow our trading rules, 
                      use proper risk management, and never hesitate to ask questions during coaching sessions.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button onClick={goToNext} className="w-full">
                    Go to Dashboard <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}