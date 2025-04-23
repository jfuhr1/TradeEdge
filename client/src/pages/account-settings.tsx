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
import { 
  CheckIcon, 
  XIcon, 
  UserIcon, 
  CreditCardIcon, 
  BellIcon, 
  BookOpenIcon, 
  GraduationCapIcon
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from "@/components/ui/form";

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
  
  // Add a state for tracking coaching session credits
  const [coachingCredits, setCoachingCredits] = useState({
    premium: {
      annualReview: { total: 1, used: 0 },
      annualConsultation: { total: 1, used: 0 }
    },
    mentorship: {
      sessions: { total: 20, used: 0 }
    }
  });

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

  const handleProfileUpdate = async (values: any) => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
      variant: "default"
    });
  };

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="mb-10">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account, profile, and subscription details
        </p>
      </div>
      
      <Tabs defaultValue="membership" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="membership" className="flex items-center gap-2">
            <CreditCardIcon className="h-4 w-4" /> Membership
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <BellIcon className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="coaching" className="flex items-center gap-2">
            <GraduationCapIcon className="h-4 w-4" /> Coaching Credits
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="membership" className="space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Membership Tier</h2>
            <RadioGroup 
              value={selectedTier} 
              onValueChange={setSelectedTier}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
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
                  <td className="py-4 px-4 font-medium">Weekly 'New Alerts' Live Coaching</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Premium New Alerts & Q&A Sessions
                  <div className="text-xs text-primary">See below</div>
                  </td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Annual Portfolio Review
                  <div className="text-xs text-primary">See below</div>
                  </td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Annual Consultation
                  <div className="text-xs text-primary">See below</div>
                  </td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Additional Coaching Call Pricing</td>
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
                <h3 className="text-xl font-semibold mb-3">Weekly 'New Alerts' Live Coaching</h3>
                <p className="text-gray-700">
                  These sessions provide in-depth analysis of that week's new stock alerts over a 
                  video call. You'll understand the trade rationale, technical analysis, and strategic 
                  entry/exit points. Perfect for traders who want to understand the "why" behind each alert.
                </p>
              </div>
              
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-3">Premium New Alerts & Q&A Sessions</h3>
                <p className="text-gray-700">
                  Weekly exclusive combined session for Premium members featuring both detailed new alert analysis 
                  and extended Q&A time in one meeting. With a smaller group of premium-only members, these sessions 
                  provide more interaction and personalized attention to your specific questions about the alerts and 
                  other trading topics.
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
        </TabsContent>
        
        <TabsContent value="profile" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Your Profile</h2>
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal information and how we can contact you</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" defaultValue={user?.name || ""} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" defaultValue={user?.username || ""} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" type="email" defaultValue={user?.email || ""} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" defaultValue={user?.phone || ""} className="mt-1" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleProfileUpdate}>Save Changes</Button>
              </CardFooter>
            </Card>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Michigan Financial Advice Disclaimer</CardTitle>
                <CardDescription>Required legal acknowledgment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md">
                  <p className="text-sm text-yellow-800">
                    TradeEdge Pro LLC is not registered as an investment adviser with the Securities and Exchange Commission or 
                    the Michigan Department of Licensing and Regulatory Affairs, Securities Division. The information provided 
                    by TradeEdge Pro LLC is for educational purposes only and should not be construed as 
                    individualized investment advice.
                  </p>
                  <p className="text-sm mt-2 text-yellow-800">
                    You understand that investment decisions should be made based on an evaluation of 
                    your own financial circumstances, investment objectives, risk tolerance, and liquidity needs. 
                    TradeEdge Pro LLC and its representatives are not offering or providing financial planning services.
                  </p>
                  <div className="mt-4">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="disclaimer" 
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                        defaultChecked={true}
                      />
                      <Label htmlFor="disclaimer" className="text-sm font-medium cursor-pointer">
                        I acknowledge that I have read and understand this disclaimer
                      </Label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="notifications" className="space-y-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Notification Preferences</h2>
            <Card>
              <CardHeader>
                <CardTitle>Alert Notifications</CardTitle>
                <CardDescription>Manage how you receive stock alert notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">New Stock Alerts</h3>
                      <p className="text-sm text-muted-foreground">Get notified when new stock alerts are posted</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="new-stock-email" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="new-stock-email" className="text-sm cursor-pointer">Email</Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="new-stock-sms" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={false}
                        />
                        <Label htmlFor="new-stock-sms" className="text-sm cursor-pointer">SMS</Label>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Buy Zone Alerts</h3>
                      <p className="text-sm text-muted-foreground">Get notified when stock prices enter the buy zone</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="buy-zone-email" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="buy-zone-email" className="text-sm cursor-pointer">Email</Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="buy-zone-sms" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="buy-zone-sms" className="text-sm cursor-pointer">SMS</Label>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Target Price Alerts</h3>
                      <p className="text-sm text-muted-foreground">Get notified when stocks reach target prices</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="target-email" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="target-email" className="text-sm cursor-pointer">Email</Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="target-sms" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="target-sms" className="text-sm cursor-pointer">SMS</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Educational & Coaching Notifications</CardTitle>
                <CardDescription>Manage notifications for educational content and coaching sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">New Educational Content</h3>
                      <p className="text-sm text-muted-foreground">Get notified when new educational content is available</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="education-email" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="education-email" className="text-sm cursor-pointer">Email</Label>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Coaching Session Reminders</h3>
                      <p className="text-sm text-muted-foreground">Get reminded about upcoming coaching sessions</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="coaching-email" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="coaching-email" className="text-sm cursor-pointer">Email</Label>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input 
                          type="checkbox" 
                          id="coaching-sms" 
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                          defaultChecked={true}
                        />
                        <Label htmlFor="coaching-sms" className="text-sm cursor-pointer">SMS</Label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button>Save Preferences</Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="coaching" className="space-y-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold mb-6">Coaching Session Credits</h2>
            
            {user?.tier === "premium" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <span>Annual Portfolio Review</span>
                      <Badge variant={coachingCredits.premium.annualReview.used < coachingCredits.premium.annualReview.total ? "default" : "outline"}>
                        {coachingCredits.premium.annualReview.used}/{coachingCredits.premium.annualReview.total}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Submit your top holdings for a comprehensive review</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Our expert traders will analyze your current portfolio holdings and provide detailed buy/sell/hold recommendations during a one-hour call.
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(coachingCredits.premium.annualReview.used/coachingCredits.premium.annualReview.total)*100}%` }}
                      ></div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={coachingCredits.premium.annualReview.used >= coachingCredits.premium.annualReview.total}
                    >
                      Book Review Session
                    </Button>
                  </CardFooter>
                </Card>
                
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <span>Annual Consultation</span>
                      <Badge variant={coachingCredits.premium.annualConsultation.used < coachingCredits.premium.annualConsultation.total ? "default" : "outline"}>
                        {coachingCredits.premium.annualConsultation.used}/{coachingCredits.premium.annualConsultation.total}
                      </Badge>
                    </CardTitle>
                    <CardDescription>One-on-one consultation on any trading topic</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Book time with a TradeEdge Pro expert to discuss any trading or investing topic of your choice, from technical analysis to risk management.
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(coachingCredits.premium.annualConsultation.used/coachingCredits.premium.annualConsultation.total)*100}%` }}
                      ></div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      disabled={coachingCredits.premium.annualConsultation.used >= coachingCredits.premium.annualConsultation.total}
                    >
                      Book Consultation
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            )}
            
            {user?.tier === "mentorship" && (
              <div className="mb-8">
                <Card>
                  <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-lg">
                    <CardTitle className="flex items-center justify-between">
                      <span>Mentorship Sessions</span>
                      <Badge variant={coachingCredits.mentorship.sessions.used < coachingCredits.mentorship.sessions.total ? "default" : "outline"}>
                        {coachingCredits.mentorship.sessions.used}/{coachingCredits.mentorship.sessions.total}
                      </Badge>
                    </CardTitle>
                    <CardDescription>Your structured trading mentorship program</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <p className="text-sm text-gray-600 mb-4">
                      TradeEdge Pro's premium mentorship program with 20 personalized coaching sessions spread over 12 months to develop your trading skills and strategy.
                    </p>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${(coachingCredits.mentorship.sessions.used/coachingCredits.mentorship.sessions.total)*100}%` }}
                      ></div>
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <h4 className="font-medium">Session Structure:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="border rounded-lg p-4">
                          <div className="font-semibold mb-2">Months 1-2</div>
                          <div className="text-sm mb-1">8 Weekly Sessions</div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '25%' }}></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">2/8 complete</div>
                        </div>
                        <div className="border rounded-lg p-4">
                          <div className="font-semibold mb-2">Months 3-4</div>
                          <div className="text-sm mb-1">4 Bi-Weekly Sessions</div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '0%' }}></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">0/4 complete</div>
                        </div>
                        <div className="border rounded-lg p-4">
                          <div className="font-semibold mb-2">Months 5-12</div>
                          <div className="text-sm mb-1">8 Monthly Sessions</div>
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: '0%' }}></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">0/8 complete</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full flex space-x-4">
                      <Button variant="outline" className="flex-1">View Schedule</Button>
                      <Button className="flex-1" disabled={coachingCredits.mentorship.sessions.used >= coachingCredits.mentorship.sessions.total}>
                        Book Next Session
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </div>
            )}
            
            {(!user?.tier || user.tier === "free" || user.tier === "paid") && (
              <Card className="bg-blue-50">
                <CardHeader>
                  <CardTitle>No Coaching Credits Available</CardTitle>
                  <CardDescription>Upgrade your membership to access coaching sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Premium members receive annual portfolio reviews and consultations. Mentorship tier members 
                    receive 20 structured coaching sessions over 12 months.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => {
                    const element = document.querySelector('[value="membership"]') as HTMLElement;
                    if (element) element.click();
                  }}>
                    View Membership Options
                  </Button>
                </CardFooter>
              </Card>
            )}
            
            <h3 className="text-xl font-semibold mt-8 mb-4">Available Coaching Sessions</h3>
            <Card>
              <CardHeader>
                <CardTitle>Book Additional Coaching</CardTitle>
                <CardDescription>Available for all membership tiers at standard rates {user?.tier === "premium" && "(25% discount applied)"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">Portfolio Consultation</h4>
                      <p className="text-sm text-gray-600 mt-1 mb-2">1-hour comprehensive portfolio review with strategy recommendations</p>
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold">${user?.tier === "premium" ? "75" : "100"}</span>
                        <Button size="sm">Book</Button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">Strategy Session</h4>
                      <p className="text-sm text-gray-600 mt-1 mb-2">Develop a customized trading plan with a TradeEdge Pro expert</p>
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold">${user?.tier === "premium" ? "187.50" : "250"}</span>
                        <Button size="sm">Book</Button>
                      </div>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold">Technical Analysis</h4>
                      <p className="text-sm text-gray-600 mt-1 mb-2">Learn advanced chart patterns and technical indicators</p>
                      <div className="flex justify-between items-end">
                        <span className="text-lg font-bold">${user?.tier === "premium" ? "75" : "100"}</span>
                        <Button size="sm">Book</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}