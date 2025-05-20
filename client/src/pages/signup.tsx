import { useState } from "react";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  ArrowRightIcon, 
  ArrowLeftIcon,
  CheckIcon, 
  UserIcon, 
  ShieldCheckIcon 
} from "lucide-react";
import { supabase } from "@/lib/modassembly/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { updateSignupInfo } from "@/lib/modassembly/supabase/profiles";

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
      disclaimerAcknowledged: false,
      termsAgreed: false,
    },
  });
  
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
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            username: values.username,
            full_name: values.name
          }
        }
      });

      if (authError) throw authError;

      // Step 2: Update the profile with additional information
      const { error: profileError } = await updateSignupInfo(
        authData.user!.id,
        {
          phone_number: values.phone || null,
          financial_disclaimer_accepted: values.disclaimerAcknowledged,
          terms_accepted: values.termsAgreed,
          privacy_accepted: values.termsAgreed // Using same value as terms for now
        }
      );

      if (profileError) throw profileError;
      
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account.",
      });
      
      navigate("/subscribe");
    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        title: "Error creating account",
        description: error.message || "There was an issue creating your account. Please try again.",
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
              {[1, 2, 3].map((step) => (
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
                  
                  {currentStep < 3 ? (
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