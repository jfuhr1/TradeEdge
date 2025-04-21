import { useState } from "react";
import { Link } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ChartLine, Trophy } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle login form submission
  function onLoginSubmit(data: LoginFormValues) {
    setIsLoggingIn(true);
    // Simulate login - would be replaced with real authentication
    setTimeout(() => {
      setIsLoggingIn(false);
      window.location.href = "/";
    }, 800);
  }

  // Handle register form submission
  function onRegisterSubmit(data: RegisterFormValues) {
    setIsRegistering(true);
    // Simulate registration - would be replaced with real authentication
    setTimeout(() => {
      setIsRegistering(false);
      window.location.href = "/";
    }, 800);
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation Bar */}
      <div className="bg-primary text-white p-4">
        <div className="container flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <ChartLine className="w-6 h-6 mr-2" />
              <span className="font-bold text-xl">TradeEdge Pro</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {/* No links here as per requirement */}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex flex-col md:flex-row flex-1">
        {/* Hero Section */}
        <div className="bg-primary text-white p-8 md:w-1/2 flex flex-col justify-center">
          <div className="max-w-md mx-auto">
            <div className="flex items-center mb-6">
              <ChartLine className="w-10 h-10 mr-3" />
              <h1 className="text-3xl font-bold">TradeEdge Pro</h1>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Smart trades, better returns</h2>
            <p className="mb-6">
              Join thousands of traders receiving curated stock alerts with detailed analysis.
              Get buy zones, multiple target prices, and technical reasons for every stock pick.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded mr-3">
                  <ChartLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Premium Stock Alerts</h3>
                  <p className="text-sm opacity-90">
                    Get access to carefully researched stock picks with clear buy zones and targets
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded mr-3">
                  <ChartLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Portfolio Tracking</h3>
                  <p className="text-sm opacity-90">
                    Track your trades and get notified when stocks reach your target prices
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/20 p-2 rounded mr-3">
                  <ChartLine className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">Trading Education</h3>
                  <p className="text-sm opacity-90">
                    Learn the fundamentals of trading with our comprehensive educational resources
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Auth Forms */}
        <div className="p-8 md:w-1/2 flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Welcome to TradeEdge Pro</CardTitle>
              <CardDescription>
                Login or create an account to access stock alerts and trading resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                {/* Login Form */}
                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4 mt-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="yourusername" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={loginForm.control}
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
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isLoggingIn}
                      >
                        {isLoggingIn ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Logging in...
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => setActiveTab("register")}
                      >
                        Register
                      </Button>
                    </p>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        // Simulate successful login for demo purposes
                        setIsLoggingIn(true);
                        setTimeout(() => {
                          setIsLoggingIn(false);
                          // Set demo mode in localStorage
                          localStorage.setItem('demoMode', 'true');
                          // Use full page refresh to reload the app with demo login
                          window.location.href = "/";
                        }, 800);
                      }}
                    >
                      Skip Login (Demo Mode)
                    </Button>
                  </div>
                </TabsContent>
                
                {/* Register Form */}
                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4 mt-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input placeholder="yourusername" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
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
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="you@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={registerForm.control}
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
                        control={registerForm.control}
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
                      
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={isRegistering}
                      >
                        {isRegistering ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                  
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Button 
                        variant="link" 
                        className="p-0" 
                        onClick={() => setActiveTab("login")}
                      >
                        Login
                      </Button>
                    </p>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => {
                        // Simulate successful registration for demo purposes
                        setIsRegistering(true);
                        setTimeout(() => {
                          setIsRegistering(false);
                          // Set demo mode in localStorage
                          localStorage.setItem('demoMode', 'true');
                          // Use full page refresh to reload the app with demo login
                          window.location.href = "/";
                        }, 800);
                      }}
                    >
                      Skip Registration (Demo Mode)
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}