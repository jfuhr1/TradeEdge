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
    features: ["One free trade idea per month", "Basic education content", "Community forum access"],
    limitations: ["Limited alerts", "No portfolio tracking", "No notifications", "No weekly Q&A sessions"]
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
      "All notifications",
      "Full education library",
      "Community forum access"
    ],
    limitations: ["No weekly Q&A sessions", "Coaching calls at full price"]
  },
  {
    id: "premium",
    name: "Premium",
    description: "For professional traders who want it all",
    price: "$99.99",
    period: "per month",
    features: [
      "All stock alerts",
      "Priority notifications",
      "Portfolio tracking",
      "Full education library",
      "Weekly premium Q&A sessions",
      "Annual portfolio review included",
      "Annual 1-hour consultation included",
      "Community forum access with premium badge"
    ],
    limitations: ["Additional coaching calls at full price"]
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
                  <th className="py-4 px-4 text-center">Premium ($99.99/mo)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Trade Alerts</td>
                  <td className="py-4 px-4 text-center">1 per month</td>
                  <td className="py-4 px-4 text-center">Unlimited</td>
                  <td className="py-4 px-4 text-center">Unlimited (Priority)</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Portfolio Tracking</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Notifications</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Educational Content</td>
                  <td className="py-4 px-4 text-center">Basic</td>
                  <td className="py-4 px-4 text-center">Full Access</td>
                  <td className="py-4 px-4 text-center">Full Access</td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Weekly Q&A Sessions</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Annual Portfolio Review</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Annual Consultation</td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><XIcon className="h-5 w-5 text-muted-foreground mx-auto" /></td>
                  <td className="py-4 px-4 text-center"><CheckIcon className="h-5 w-5 text-primary mx-auto" /></td>
                </tr>
                <tr className="border-b">
                  <td className="py-4 px-4 font-medium">Coaching Calls</td>
                  <td className="py-4 px-4 text-center">Full Price</td>
                  <td className="py-4 px-4 text-center">Full Price</td>
                  <td className="py-4 px-4 text-center">1 Each Included Annually</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}