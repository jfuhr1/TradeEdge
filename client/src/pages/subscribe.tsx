import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  ArrowLeftIcon,
  CheckIcon, 
  CreditCardIcon
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { SUBSCRIPTION_TIERS } from "@/lib/stripe/stripeClient";
import { createSubscriptionCheckout, redirectToCheckout } from "@/lib/stripe/subscriptionCheckout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

// Pricing tiers
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
      "Weekly Premium Member New Alerts and Q&A sessions",
      "Annual portfolio review included",
      "Annual 1-hour consultation included",
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

// Form validation schema
const subscribeSchema = z.object({
  tier: z.enum(["free", "paid", "premium", "mentorship"]),
});

type SubscribeFormValues = z.infer<typeof subscribeSchema>;

function SubscribePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, isLoading: authLoading } = useAuth();
  
  const form = useForm<SubscribeFormValues>({
    resolver: zodResolver(subscribeSchema),
    defaultValues: {
      tier: "free",
    },
  });
  
  const selectedTier = form.watch("tier");
  
  const onSubmit = async (values: SubscribeFormValues) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to select a subscription tier.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Step 1: Handle subscription based on selected tier
      if (values.tier !== "free") {
        try {
          const priceId = SUBSCRIPTION_TIERS[values.tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS];
          if (!priceId) {
            throw new Error('Invalid subscription tier');
          }

          const sessionId = await createSubscriptionCheckout({
            priceId,
            successUrl: `${window.location.origin}/welcome?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/subscribe`,
          });

          await redirectToCheckout(sessionId);
          return; // Don't navigate yet, let Stripe handle the redirect
        } catch (stripeError: any) {
          console.error('Stripe error:', stripeError);
          toast({
            title: "Payment setup failed",
            description: stripeError.message || "There was an issue setting up your payment. Please try again.",
            variant: "destructive",
          });
          return;
        }
      }

      // Step 2: Update the profile with the selected tier
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          stripe_tier: values.tier,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      toast({
        title: "Subscription updated!",
        description: "Your membership tier has been updated successfully.",
      });
      
      navigate("/welcome");
    } catch (error: any) {
      console.error("Subscription error:", error);
      toast({
        title: "Error updating subscription",
        description: error.message || "There was an issue updating your subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user is logged in
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2" onClick={() => navigate("/")} style={{cursor: "pointer"}}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
            <span className="text-xl font-bold">TradeEdge Pro</span>
          </div>
          <div>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <ArrowLeftIcon className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Choose Your Membership</h1>
            <p className="text-muted-foreground">Select the plan that best fits your trading needs</p>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl p-8 mb-12">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="tier"
                  render={({ field }) => (
                    <FormItem className="space-y-4">
                      <FormMessage />
                      <RadioGroup
                        value={field.value}
                        onValueChange={(value: string) => {
                          field.onChange(value);
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6"
                      >
                        {TIERS.map((tier) => (
                          <div key={tier.id}>
                            <FormControl>
                              <RadioGroupItem
                                value={tier.id}
                                id={tier.id}
                                className="peer sr-only"
                              />
                            </FormControl>
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
                                {tier.id === "paid" && (
                                  <Badge variant="outline" className="bg-primary/10">Most Popular</Badge>
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
                                  {tier.features.map((feature: string, index: number) => (
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
                                    {tier.limitations.map((limitation: string, index: number) => (
                                      <li key={index} className="flex items-start gap-2 text-sm">
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
                                          className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5"
                                        >
                                          <path d="M18 6 6 18"></path>
                                          <path d="m6 6 12 12"></path>
                                        </svg>
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
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => navigate("/")}>
                    <ArrowLeftIcon className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                  
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : selectedTier === "free" ? "Continue" : "Proceed to Payment"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SubscribePage; 