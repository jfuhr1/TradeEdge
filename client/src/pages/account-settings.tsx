import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CheckIcon, XIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const TIERS = [
  {
    id: "free",
    name: "Free",
    description: "Basic plan for beginner traders",
    price: "$0",
    period: "forever",
    features: [
      "One free trade idea per month", 
      "Basic education content", 
      "Weekly market summaries",
      "Weekly Intro to TradeEdge coaching",
      "Ability to book coaching calls at full price"
    ],
    limitations: [
      "Limited alerts", 
      "No portfolio tracking", 
      "No custom notifications", 
      "No weekly Q&A sessions"
    ]
  },
  {
    id: "paid",
    name: "Paid",
    description: "Our most popular plan for serious traders",
    price: "$29.99",
    period: "per month",
    features: [
      "All stock alerts",
      "Portfolio tracking",
      "Custom notification settings",
      "Full education library",
      "Weekly 'New Alerts' coaching sessions",
      "All educational coaching sessions",
      "Ability to book coaching calls at full price"
    ],
    limitations: [
      "No weekly Q&A sessions",
      "No discounts on coaching calls"
    ]
  },
  {
    id: "premium",
    name: "Premium",
    description: "For professional traders who want it all",
    price: "$999",
    period: "per year",
    features: [
      "All stock alerts",
      "Priority notifications",
      "Portfolio tracking",
      "Custom notification settings",
      "Full education library",
      "Weekly Premium Member New Alerts and Q&A sessions (See below)",
      "Annual portfolio review included (See below)",
      "Annual 1-hour consultation included (See below)",
      "Ability to book additional coaching calls at 25% off"
    ],
    limitations: []
  },
  {
    id: "mentorship",
    name: "Mentorship",
    description: "For those seeking intensive coaching and guidance",
    price: "$5,000",
    period: "one-time fee",
    features: [
      "All Premium tier benefits",
      "20 weekly coaching sessions structured as:",
      "• 8 weekly sessions (First 2 months)",
      "• 4 bi-weekly sessions (Next 2 months)",
      "• 8 monthly sessions (Next 8 months)",
      "Personalized trading strategy development",
      "Ongoing performance evaluation",
      "Priority support"
    ],
    limitations: []
  }
];

export default function AccountSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<string>(user?.tier || "free");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleTierChange = async () => {
    if (!user || selectedTier === user.tier) return;
    
    setIsUpdating(true);
    
    try {
      // In a real implementation, we would integrate with a payment provider like Stripe
      // for upgrading to a paid tier
      const response = await apiRequest("POST", "/api/user/update-tier", { 
        tier: selectedTier 
      });
      
      if (!response.ok) {
        throw new Error("Failed to update membership tier");
      }
      
      // Update the cached user data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Membership Updated",
        description: `Your membership has been updated to ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)}`,
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "There was an error updating your membership. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account and subscription details
        </p>
      </div>
      
      <div className="grid gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Membership Tier</h2>
          <RadioGroup 
            value={selectedTier} 
            onValueChange={setSelectedTier}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6"
          >
            {TIERS.map((tier) => (
              <div key={tier.id}>
                <RadioGroupItem 
                  value={tier.id} 
                  id={tier.id}
                  className="peer sr-only"
                />
                <Label 
                  htmlFor={tier.id} 
                  className="flex flex-col h-full space-y-3 rounded-xl border-2 border-muted bg-popover p-5 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-xl font-semibold">{tier.name}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {tier.description}
                      </div>
                    </div>
                    {user?.tier === tier.id && (
                      <Badge variant="outline" className="bg-primary/10">Current</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-end gap-1 mt-2">
                    <span className="text-2xl font-bold">{tier.price}</span>
                    <span className="text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                                    
                  <Separator className="my-3" />
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Includes</h4>
                    <ul className="space-y-2">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {tier.limitations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Limitations</h4>
                      <ul className="space-y-2">
                        {tier.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <XIcon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                            <span className="text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
          
          <div className="flex justify-end">
            <Button 
              onClick={handleTierChange} 
              disabled={!user || selectedTier === user.tier || isUpdating}
              className="w-full md:w-auto"
            >
              {isUpdating ? "Updating..." : "Update Membership"}
            </Button>
          </div>
        </div>
        
        <div className="pt-6">
          <h2 className="text-2xl font-semibold mb-6">Membership Benefits Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="py-4 px-4 text-left">Feature</th>
                  <th className="py-4 px-4 text-center">Free</th>
                  <th className="py-4 px-4 text-center">Paid ($29.99/mo)</th>
                  <th className="py-4 px-4 text-center">Premium ($999/yr)</th>
                  <th className="py-4 px-4 text-center">Mentorship ($5,000)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Trade Alerts</td>
                  <td className="py-4 px-4 text-center">1 per month</td>
                  <td className="py-4 px-4 text-center">Unlimited</td>
                  <td className="py-4 px-4 text-center">Unlimited (Priority)</td>
                  <td className="py-4 px-4 text-center">Unlimited (Priority)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Portfolio Tracking</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Custom Notifications</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Educational Content</td>
                  <td className="py-4 px-4 text-center">Basic</td>
                  <td className="py-4 px-4 text-center">Full Access</td>
                  <td className="py-4 px-4 text-center">Full Access</td>
                  <td className="py-4 px-4 text-center">Full Access</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Weekly Market Summaries</td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Weekly 'New Alerts' Coaching</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Premium Q&A Sessions</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /> <span className="text-xs text-primary">See below</span></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Annual Portfolio Review</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /> <span className="text-xs text-primary">See below</span></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Annual Consultation</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /> <span className="text-xs text-primary">See below</span></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Coaching Call Pricing</td>
                  <td className="py-4 px-4 text-center">Full Price</td>
                  <td className="py-4 px-4 text-center">Full Price</td>
                  <td className="py-4 px-4 text-center">25% Discount</td>
                  <td className="py-4 px-4 text-center">20 Sessions Included</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Personalized Trading Strategy</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-6">Premium Membership Benefits Explained</h2>
            
            <div className="grid gap-8 md:grid-cols-2">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Weekly "New Alerts" Coaching Sessions</h3>
                <p className="text-gray-700">
                  These sessions provide in-depth analysis of that week's new stock alerts over a 
                  video call. You'll understand the trade rationale, technical analysis, and strategic 
                  entry/exit points. Perfect for traders who want to understand the "why" behind each alert.
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Premium Members Q&A Sessions</h3>
                <p className="text-gray-700">
                  Weekly exclusive sessions for Premium members featuring detailed trade analysis and 
                  extended Q&A time. With a smaller group of premium-only members, these sessions allow 
                  for more interaction and personalized attention to your specific questions.
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Annual Portfolio Review</h3>
                <p className="text-gray-700">
                  Submit your top 10 holdings via a form one week prior to your scheduled review. 
                  TradeEdge Pro will analyze each position and provide a detailed buy/sell/hold 
                  recommendation during a one-hour call. This comprehensive review helps optimize your 
                  portfolio for maximum performance.
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Consultation Sessions</h3>
                <p className="text-gray-700">
                  Book time with TradeEdge Pro to discuss any trading or investing topic of your choice. 
                  Whether you need help with technical analysis, position sizing, risk management, or 
                  developing a trading plan, these personalized sessions provide targeted guidance for 
                  your specific needs.
                </p>
              </div>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg mt-8">
              <h3 className="text-xl font-semibold mb-3">Mentorship Program Details</h3>
              <p className="text-gray-700 mb-4">
                Our intensive mentorship program is designed to take your trading to the next level 
                through consistent coaching and feedback over a 12-month period:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li><span className="font-medium">First 2 months:</span> Weekly sessions (8 total) to rapidly develop your trading skills and knowledge</li>
                <li><span className="font-medium">Months 3-4:</span> Bi-weekly sessions (4 total) to monitor your progress as you begin trading more independently</li>
                <li><span className="font-medium">Months 5-12:</span> Monthly sessions (8 total) for long-term progress tracking and strategy refinement</li>
              </ul>
              <p className="text-gray-700 mt-4">
                This structured approach ensures you develop a solid foundation, then gradually transition 
                to independence with regular check-ins to address challenges and optimize performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}