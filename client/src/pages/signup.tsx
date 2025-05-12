import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  ArrowRightIcon, 
  ArrowLeftIcon,
  CheckIcon, 
  CreditCardIcon, 
  UserIcon, 
  ShieldCheckIcon 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
const signupSchema = z.object({
  // Account details
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  
  // Personal information
  name: z.string().min(2, "Full name is required"),
  phone: z.string().optional(),
  
  // Membership and payment
  tier: z.enum(["free", "paid", "premium", "mentorship"]),
  cardNumber: z.string().optional(),
  cardExpiry: z.string().optional(),
  cardCVC: z.string().optional(),
  billingAddress: z.string().optional(),
  
  // Legal confirmations
  disclaimerAcknowledged: z.boolean().refine(val => val, {
    message: "You must acknowledge the financial advice disclaimer",
  }),
  termsAgreed: z.boolean().refine(val => val, {
    message: "You must agree to the terms and conditions",
  }),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
}).refine(data => {
  if (data.tier !== "free") {
    return !!data.cardNumber && !!data.cardExpiry && !!data.cardCVC && !!data.billingAddress;
  }
  return true;
}, {
  message: "Payment details are required for paid tiers",
  path: ["cardNumber"],
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      phone: "",
      tier: "free",
      cardNumber: "",
      cardExpiry: "",
      cardCVC: "",
      billingAddress: "",
      disclaimerAcknowledged: false,
      termsAgreed: false,
    },
  });
  
  const selectedTier = form.watch("tier");
  
  const nextStep = async () => {
    // Validate fields for the current step
    if (currentStep === 1) {
      const accountInfoValid = await form.trigger(["username", "email", "password", "confirmPassword"]);
      if (accountInfoValid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      const personalInfoValid = await form.trigger(["name", "phone"]);
      if (personalInfoValid) {
        setCurrentStep(3);
      }
    } else if (currentStep === 3) {
      const legalValid = await form.trigger(["disclaimerAcknowledged", "termsAgreed"]);
      if (legalValid) {
        setCurrentStep(4);
      }
    } else if (currentStep === 4) {
      const tierValid = await form.trigger("tier");
      const selectedTier = form.getValues("tier");
      
      if (selectedTier !== "free") {
        const paymentValid = await form.trigger(["cardNumber", "cardExpiry", "cardCVC", "billingAddress"]);
        if (tierValid && paymentValid) {
          form.handleSubmit(onSubmit)();
        }
      } else if (tierValid) {
        form.handleSubmit(onSubmit)();
      }
    }
  };
  
  const prevStep = () => {
    setCurrentStep(Math.max(1, currentStep - 1));
  };
  
  const onSubmit = async (values: SignupFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a production app, this would connect to your real API
      // Simulating API call for demonstration purposes
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navigate to the welcome page after successful signup
      toast({
        title: "Account created successfully!",
        description: "Welcome to TradeEdge Pro!",
      });
      
      navigate("/welcome");
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Error creating account",
        description: "There was an issue creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <h1 className="text-3xl font-bold mb-2">Join TradeEdge Pro</h1>
            <p className="text-muted-foreground">Create your account and start your trading journey</p>
          </div>
          
          <div className="mb-8">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 top-1/2 transform -translate-y-1/2 h-1 bg-gray-200 -z-10"></div>
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`flex flex-col items-center ${step <= currentStep ? "text-primary" : "text-gray-400"}`}>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${step <= currentStep ? "bg-primary text-white" : "bg-gray-200"}`}>
                    {step < currentStep ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : (
                      <span>{step}</span>
                    )}
                  </div>
                  <div className="mt-2 text-sm font-medium">
                    {step === 1 && "Account"}
                    {step === 2 && "Profile"}
                    {step === 3 && "Legal"}
                    {step === 4 && "Membership"}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white shadow-lg rounded-xl p-8 mb-12">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {currentStep === 1 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Create Your Account</h2>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="johndoe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john.doe@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Your Profile</h2>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (optional)</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="(555) 555-5555" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Legal Acknowledgments</h2>
                    <div className="space-y-6">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6">
                        <h3 className="text-lg font-semibold mb-4">Michigan Financial Advice Disclaimer</h3>
                        <div className="text-sm text-yellow-800 space-y-4">
                          <p>
                            TradeEdge Pro LLC is not registered as an investment adviser with the Securities and Exchange Commission or 
                            the Michigan Department of Licensing and Regulatory Affairs, Securities Division. The information provided 
                            by TradeEdge Pro LLC is for educational purposes only and should not be construed as 
                            individualized investment advice.
                          </p>
                          <p>
                            You understand that investment decisions should be made based on an evaluation of 
                            your own financial circumstances, investment objectives, risk tolerance, and liquidity needs. 
                            TradeEdge Pro LLC and its representatives are not offering or providing financial planning services.
                          </p>
                          <p>
                            You acknowledge that stock trading involves risk, including the possible loss of principal. Trading 
                            is not suitable for all investors and past performance is not indicative of future results.
                          </p>
                          <p>
                            The stock alerts, educational resources, and coaching provided by TradeEdge Pro LLC are for 
                            informational and educational purposes only. They are not recommendations to buy or sell any 
                            securities, and TradeEdge Pro LLC is not responsible for any losses or damages that may result 
                            from your trading activities.
                          </p>
                        </div>
                        
                        <div className="mt-6">
                          <FormField
                            control={form.control}
                            name="disclaimerAcknowledged"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <input
                                    type="checkbox"
                                    checked={field.value}
                                    onChange={field.onChange}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    I acknowledge that I have read and understand this disclaimer
                                  </FormLabel>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="termsAgreed"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>
                                I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                              </FormLabel>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="mt-8 p-4 bg-blue-50 rounded-md">
                      <div className="flex items-start">
                        <ShieldCheckIcon className="h-6 w-6 text-blue-500 mr-3 mt-0.5" />
                        <div>
                          <h4 className="font-semibold">Your Data is Secure</h4>
                          <p className="text-sm text-muted-foreground">
                            We use industry-standard encryption to protect your personal and payment information. 
                            Your data will never be shared with third parties.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div>
                    <h2 className="text-2xl font-semibold mb-6">Choose Your Membership</h2>
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
                              // Reset payment fields when switching to free tier
                              if (value === "free") {
                                form.setValue("cardNumber", "");
                                form.setValue("cardExpiry", "");
                                form.setValue("cardCVC", "");
                                form.setValue("billingAddress", "");
                              }
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

                    {selectedTier !== "free" && (
                      <>
                        <h3 className="text-xl font-semibold mt-8 mb-6">Payment Information</h3>
                        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                          <FormField
                            control={form.control}
                            name="cardNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Card Number</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Input placeholder="4242 4242 4242 4242" {...field} />
                                    <CreditCardIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="cardExpiry"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Expiry Date</FormLabel>
                                  <FormControl>
                                    <Input placeholder="MM/YY" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="cardCVC"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>CVC</FormLabel>
                                  <FormControl>
                                    <Input placeholder="123" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={form.control}
                            name="billingAddress"
                            render={({ field }) => (
                              <FormItem className="col-span-2">
                                <FormLabel>Billing Address</FormLabel>
                                <FormControl>
                                  <Input placeholder="123 Main St, City, State, ZIP" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <div className="flex justify-between pt-4">
                  {currentStep > 1 ? (
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={() => navigate("/")}>
                      <ArrowLeftIcon className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                  
                  {currentStep < 4 ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                      <ArrowRightIcon className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={nextStep} disabled={isSubmitting}>
                      {isSubmitting ? "Creating Account..." : "Complete Signup"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
}