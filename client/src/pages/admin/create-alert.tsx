import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { insertStockAlertSchema, StockAlert } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import MainLayout from '@/components/layout/main-layout';
import { Loader2, Plus, X, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Available tags for stock alerts
const STOCK_TAGS = [
  "Fintech",
  "Growth Stocks",
  "Crypto Plays",
  "Weinstein",
  "Biotech",
  "Leveraged Plays",
  "Retail",
  "Leveraged ETFs",
  "Inverse Plays",
  "Energy",
  "Currency",
  "Safe-Haven Plays",
  "China",
  "Emerging Markets"
];

// Price-based confluences
const PRICE_CONFLUENCES = [
  "Support Zone Strength",
  "Resistance Turned Support",
  "Bullish Trend Line Support",
  "Trendline Break",
  "4-Hour Trend Line Break"
];

// Volume-based confluences
const VOLUME_CONFLUENCES = [
  "Volume Spike/Volume - Buy at the Lows",
  "High Volume Node"
];

// Momentum indicator confluences
const MOMENTUM_CONFLUENCES = [
  "Daily MACD Turning Up",
  "Daily MACD Cross",
  "Daily MACD Divergence",
  "Daily RSI Divergence",
  "Daily RSI Oversold",
  "Weekly MACD Turning Up",
  "Weekly MACD Cross",
  "Weekly MACD Divergence",
  "Weekly RSI Divergence",
  "Weekly RSI Oversold"
];

// Chart pattern confluences
const CHART_CONFLUENCES = [
  "Wyckoff Pattern",
  "Weinstein Analysis"
];

// Sentiment and insider activity confluences
const SENTIMENT_CONFLUENCES = [
  "Insider Buys",
  "Dark Pool Print"
];

// Risk factors to watch for
const RISK_FACTORS = [
  "Market Downturn",
  "Sector Rotation",
  "Earnings Miss",
  "Negative News",
  "Analyst Downgrade",
  "Increased Competition",
  "Regulatory Issues",
  "Technical Resistance",
  "Trend Line Break (Bearish)",
  "Volume Decrease",
  "Insider Selling"
];

const stockAlertFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10),
  companyName: z.string().min(1, "Company name is required"),
  tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
  buyZoneMin: z.coerce.number().positive("Buy zone minimum must be positive"),
  buyZoneMax: z.coerce.number().positive("Buy zone maximum must be positive"),
  target1: z.coerce.number().positive("Target 1 must be positive"),
  target2: z.coerce.number().positive("Target 2 must be positive"),
  target3: z.coerce.number().positive("Target 3 must be positive"),
  target1Reasoning: z.string().min(1, "Reasoning for Target 1 is required"),
  target2Reasoning: z.string().min(1, "Reasoning for Target 2 is required"),
  target3Reasoning: z.string().min(1, "Reasoning for Target 3 is required"),
  status: z.string().default("active"),
  narrative: z.string().min(10, "Narrative is required and should provide context"),
  technicalReasons: z.array(z.string()),
  priceConfluences: z.array(z.string()),
  volumeConfluences: z.array(z.string()),
  momentumConfluences: z.array(z.string()),
  chartConfluences: z.array(z.string()),
  sentimentConfluences: z.array(z.string()),
  riskFactors: z.array(z.string()),
  currentPrice: z.coerce.number().positive("Current price must be positive").optional(),
  sector: z.string().optional(),
  notes: z.string().optional(),
});

type StockAlertFormValues = z.infer<typeof stockAlertFormSchema>;

export default function CreateAlert() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState('');
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  // Get demo mode state from localStorage
  const isDemoMode = localStorage.getItem('demoMode') === 'true';
  
  // Check if user is admin or using demo mode
  useEffect(() => {
    async function checkAdminStatus() {
      // If we've already checked or are in demo mode, no need to check again
      if (isAdmin !== null || isDemoMode) {
        if (isDemoMode) {
          // In demo mode, automatically grant admin access
          setIsAdmin(true);
        }
        return;
      }
      
      try {
        // Only make the API call once
        const res = await apiRequest('GET', '/api/user/is-admin');
        const data = await res.json();
        setIsAdmin(data.isAdmin);
        
        if (!data.isAdmin) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access this page.',
            variant: 'destructive'
          });
        }
      } catch (error) {
        // Only show the toast on the first error
        if (isAdmin === null) {
          setIsAdmin(false);
          toast({
            title: 'Access Denied',
            description: 'Access restricted. Enable demo mode to try this feature.',
            variant: 'destructive'
          });
        }
      }
    }
    
    checkAdminStatus();
  }, [toast, isAdmin, isDemoMode]);

  // Fetch technical reasons
  const { data: technicalReasons, isLoading: loadingReasons } = useQuery<{ id: number, name: string }[]>({
    queryKey: ['/api/technical-reasons', isDemoMode ? 'demo' : 'normal'],
    queryFn: async ({ queryKey }) => {
      // Directly use saved demo mode state from component
      if (isDemoMode) {
        // Return mock data for demo mode
        console.log('Demo mode: Using mock technical reasons');
        return [
          { id: 1, name: 'Support Level' },
          { id: 2, name: 'Resistance Level' },
          { id: 3, name: 'Oversold RSI' },
          { id: 4, name: 'Overbought RSI' },
          { id: 5, name: 'Moving Average Crossover' },
          { id: 6, name: 'MACD Crossover' },
          { id: 7, name: 'Earnings Beat' },
          { id: 8, name: 'Revenue Growth' },
          { id: 9, name: 'Bullish Pattern' },
          { id: 10, name: 'Bearish Pattern' },
          { id: 11, name: 'Breakout Pattern' },
          { id: 12, name: 'Upward Trend' },
          { id: 13, name: 'Downward Trend' },
          { id: 14, name: 'Volume Increase' },
          { id: 15, name: 'Sector Momentum' },
        ];
      }
      
      // Normal behavior without demo mode
      const baseEndpoint = queryKey[0] as string;
      // Use query parameter approach for demo mode
      const endpoint = isDemoMode ? `${baseEndpoint}?demo=true` : baseEndpoint;
      
      const res = await fetch(endpoint, {
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch technical reasons');
      }
      return res.json();
    },
    // Reduce refetch frequency
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // State management for selections
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriceConfluences, setSelectedPriceConfluences] = useState<string[]>([]);
  const [selectedVolumeConfluences, setSelectedVolumeConfluences] = useState<string[]>([]);
  const [selectedMomentumConfluences, setSelectedMomentumConfluences] = useState<string[]>([]);
  const [selectedChartConfluences, setSelectedChartConfluences] = useState<string[]>([]);
  const [selectedSentimentConfluences, setSelectedSentimentConfluences] = useState<string[]>([]);
  const [selectedRiskFactors, setSelectedRiskFactors] = useState<string[]>([]);

  // Form setup
  const form = useForm<StockAlertFormValues>({
    resolver: zodResolver(stockAlertFormSchema),
    defaultValues: {
      symbol: '',
      companyName: '',
      tags: [],
      buyZoneMin: undefined,
      buyZoneMax: undefined,
      target1: undefined,
      target2: undefined,
      target3: undefined,
      target1Reasoning: '',
      target2Reasoning: '',
      target3Reasoning: '',
      status: 'active',
      narrative: '',
      technicalReasons: [],
      priceConfluences: [],
      volumeConfluences: [],
      momentumConfluences: [],
      chartConfluences: [],
      sentimentConfluences: [],
      riskFactors: [],
      currentPrice: undefined,
      sector: '',
      notes: '',
    },
  });

  // Add stock alert mutation
  const createStockAlert = useMutation({
    mutationFn: async (data: StockAlertFormValues) => {
      // Use the same isDemoMode flag from component state
      if (isDemoMode) {
        // In demo mode, mock a successful response
        console.log('Demo mode: Would create stock alert with data:', data);
        
        // Simulate a delay for realism
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Return mock response with provided data
        return {
          ...data,
          id: Math.floor(Math.random() * 1000) + 100, // random ID
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
      
      // Normal API request if not in demo mode
      // Use query parameter approach for demo mode
      const endpoint = isDemoMode ? '/api/stock-alerts?demo=true' : '/api/stock-alerts';
      const res = await apiRequest('POST', endpoint, data);
      return res.json();
    },
    onSuccess: (data: StockAlert) => {
      toast({
        title: 'Stock Alert Created',
        description: `${data.symbol} alert has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stock-alerts'] });
      form.reset();
      
      // Reset all selections
      setSelectedReasons([]);
      setSelectedTags([]);
      setSelectedPriceConfluences([]);
      setSelectedVolumeConfluences([]);
      setSelectedMomentumConfluences([]);
      setSelectedChartConfluences([]);
      setSelectedSentimentConfluences([]);
      setSelectedRiskFactors([]);
      
      // If in demo mode, provide additional context
      if (isDemoMode) {
        toast({
          title: 'Demo Mode',
          description: 'This alert was created in demo mode and won\'t persist.',
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating Alert',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddReason = () => {
    if (customReason.trim() && !selectedReasons.includes(customReason.trim())) {
      const updatedReasons = [...selectedReasons, customReason.trim()];
      setSelectedReasons(updatedReasons);
      form.setValue('technicalReasons', updatedReasons);
      setCustomReason('');
    }
  };

  const handleRemoveReason = (reason: string) => {
    const updatedReasons = selectedReasons.filter(r => r !== reason);
    setSelectedReasons(updatedReasons);
    form.setValue('technicalReasons', updatedReasons);
  };

  const toggleReasonSelection = (reason: string) => {
    const newSelection = selectedReasons.includes(reason)
      ? selectedReasons.filter(r => r !== reason)
      : [...selectedReasons, reason];
    
    setSelectedReasons(newSelection);
    form.setValue('technicalReasons', newSelection);
  };

  // Helper functions for tag and confluence selections
  const toggleTagSelection = (tag: string) => {
    const newSelection = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    // Enforce max 3 tags limit
    if (newSelection.length <= 3) {
      setSelectedTags(newSelection);
      form.setValue('tags', newSelection);
    } else {
      toast({
        title: "Tag Limit Reached",
        description: "You can select a maximum of 3 tags",
        variant: "destructive"
      });
    }
  };

  const togglePriceConfluence = (item: string) => {
    const newSelection = selectedPriceConfluences.includes(item)
      ? selectedPriceConfluences.filter(i => i !== item)
      : [...selectedPriceConfluences, item];
    setSelectedPriceConfluences(newSelection);
    form.setValue('priceConfluences', newSelection);
  };

  const toggleVolumeConfluence = (item: string) => {
    const newSelection = selectedVolumeConfluences.includes(item)
      ? selectedVolumeConfluences.filter(i => i !== item)
      : [...selectedVolumeConfluences, item];
    setSelectedVolumeConfluences(newSelection);
    form.setValue('volumeConfluences', newSelection);
  };

  const toggleMomentumConfluence = (item: string) => {
    const newSelection = selectedMomentumConfluences.includes(item)
      ? selectedMomentumConfluences.filter(i => i !== item)
      : [...selectedMomentumConfluences, item];
    setSelectedMomentumConfluences(newSelection);
    form.setValue('momentumConfluences', newSelection);
  };

  const toggleChartConfluence = (item: string) => {
    const newSelection = selectedChartConfluences.includes(item)
      ? selectedChartConfluences.filter(i => i !== item)
      : [...selectedChartConfluences, item];
    setSelectedChartConfluences(newSelection);
    form.setValue('chartConfluences', newSelection);
  };

  const toggleSentimentConfluence = (item: string) => {
    const newSelection = selectedSentimentConfluences.includes(item)
      ? selectedSentimentConfluences.filter(i => i !== item)
      : [...selectedSentimentConfluences, item];
    setSelectedSentimentConfluences(newSelection);
    form.setValue('sentimentConfluences', newSelection);
  };

  const toggleRiskFactor = (item: string) => {
    const newSelection = selectedRiskFactors.includes(item)
      ? selectedRiskFactors.filter(i => i !== item)
      : [...selectedRiskFactors, item];
    setSelectedRiskFactors(newSelection);
    form.setValue('riskFactors', newSelection);
  };

  function onSubmit(data: StockAlertFormValues) {
    // Make sure all selected data is properly set
    const formData = {
      ...data,
      technicalReasons: selectedReasons,
      tags: selectedTags,
      priceConfluences: selectedPriceConfluences,
      volumeConfluences: selectedVolumeConfluences,
      momentumConfluences: selectedMomentumConfluences,
      chartConfluences: selectedChartConfluences,
      sentimentConfluences: selectedSentimentConfluences,
      riskFactors: selectedRiskFactors
    };
    createStockAlert.mutate(formData);
  }

  // Validate that buy zone and targets make sense
  const priceValidationError = () => {
    const values = form.getValues();
    const { currentPrice, buyZoneMin, buyZoneMax, target1, target2, target3 } = values;
    
    if (buyZoneMin && buyZoneMax && buyZoneMin > buyZoneMax) {
      return "Buy zone minimum cannot be greater than maximum";
    }
    
    if (target1 && target2 && target1 > target2) {
      return "Target 1 cannot be greater than Target 2";
    }
    
    if (target2 && target3 && target2 > target3) {
      return "Target 2 cannot be greater than Target 3";
    }
    
    return null;
  };

  const buyZoneError = priceValidationError();

  // Check if user is logged in
  if (authLoading) {
    return (
      <MainLayout title="Loading" description="Checking authentication">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return (
      <MainLayout title="Authentication Required" description="Please log in">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-amber-600">Authentication Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You need to be logged in to access this page.</p>
            </CardContent>
            <CardFooter>
              <Button onClick={() => window.location.href = "/auth"}>Go to Login</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show access denied message if not admin
  if (isAdmin === false) {
    return (
      <MainLayout title="Access Denied" description="Admin access required">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You do not have permission to access this page. Only administrators can create stock alerts.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
            </CardFooter>
          </Card>
        </div>
      </MainLayout>
    );
  }

  // Show loading state while checking admin status
  if (isAdmin === null) {
    return (
      <MainLayout title="Loading" description="Checking permissions">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Create Stock Alert" description="Add a new stock alert to the system">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Create New Stock Alert</CardTitle>
          <CardDescription>
            Fill in the details to create a new stock alert that will be visible to users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Stock Info Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Stock Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="symbol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Symbol</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="AAPL" 
                            {...field} 
                            className="uppercase"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Apple Inc." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="100.00" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sector"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sector</FormLabel>
                        <FormControl>
                          <Input placeholder="Technology" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <FormControl>
                          <Input placeholder="active" {...field} />
                        </FormControl>
                        <FormDescription>
                          Default is "active"
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Tags Section */}
                <div className="space-y-2">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={() => (
                      <FormItem>
                        <FormLabel>
                          Tags <span className="text-muted-foreground text-sm">(Select up to 3)</span>
                        </FormLabel>
                        <div className="border p-4 rounded-md">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                            {STOCK_TAGS.map((tag) => (
                              <div key={tag} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`tag-${tag}`} 
                                  checked={selectedTags.includes(tag)}
                                  onCheckedChange={() => toggleTagSelection(tag)}
                                />
                                <label 
                                  htmlFor={`tag-${tag}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {tag}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <FormDescription>
                          Select tags that describe this stock alert
                        </FormDescription>
                        <FormMessage />
                        
                        {selectedTags.length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm mb-1">Selected Tags:</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                                  {tag}
                                  <X 
                                    className="h-3 w-3 cursor-pointer" 
                                    onClick={() => toggleTagSelection(tag)}
                                  />
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Price Zones Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Price Zones</h3>
                {buyZoneError && (
                  <div className="bg-red-50 text-red-800 p-3 rounded-md mb-4">
                    {buyZoneError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buyZoneMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buy Zone Min ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="95.00" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="buyZoneMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buy Zone Max ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="105.00" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="target1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 1 ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="115.00" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 2 ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="130.00" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="target3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 3 ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            min="0.01" 
                            placeholder="150.00" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Target Reasoning Fields */}
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="target1Reasoning"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 1 Reasoning</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain why you expect the stock to reach Target 1"
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="target2Reasoning"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 2 Reasoning</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain why you expect the stock to reach Target 2"
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="target3Reasoning"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 3 Reasoning</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Explain why you expect the stock to reach Target 3"
                            className="min-h-[80px]" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Confluences Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Confluences Supporting the Buy</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Select all the technical confluences that support this trade</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Accordion type="multiple" defaultValue={["price", "volume", "momentum", "chart", "sentiment"]}>
                  {/* Price-Based Confluences */}
                  <AccordionItem value="price">
                    <AccordionTrigger className="text-base">Price-Based Confluences</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {PRICE_CONFLUENCES.map((item) => (
                          <div key={item} className="flex items-start space-x-2">
                            <Checkbox
                              id={`price-${item}`}
                              checked={selectedPriceConfluences.includes(item)}
                              onCheckedChange={() => togglePriceConfluence(item)}
                            />
                            <label
                              htmlFor={`price-${item}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Volume-Based Confluences */}
                  <AccordionItem value="volume">
                    <AccordionTrigger className="text-base">Volume-Based Confluences</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {VOLUME_CONFLUENCES.map((item) => (
                          <div key={item} className="flex items-start space-x-2">
                            <Checkbox
                              id={`volume-${item}`}
                              checked={selectedVolumeConfluences.includes(item)}
                              onCheckedChange={() => toggleVolumeConfluence(item)}
                            />
                            <label
                              htmlFor={`volume-${item}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Momentum Indicators */}
                  <AccordionItem value="momentum">
                    <AccordionTrigger className="text-base">Momentum Indicators</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                        {MOMENTUM_CONFLUENCES.map((item) => (
                          <div key={item} className="flex items-start space-x-2">
                            <Checkbox
                              id={`momentum-${item}`}
                              checked={selectedMomentumConfluences.includes(item)}
                              onCheckedChange={() => toggleMomentumConfluence(item)}
                            />
                            <label
                              htmlFor={`momentum-${item}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Chart Patterns */}
                  <AccordionItem value="chart">
                    <AccordionTrigger className="text-base">Chart Patterns</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {CHART_CONFLUENCES.map((item) => (
                          <div key={item} className="flex items-start space-x-2">
                            <Checkbox
                              id={`chart-${item}`}
                              checked={selectedChartConfluences.includes(item)}
                              onCheckedChange={() => toggleChartConfluence(item)}
                            />
                            <label
                              htmlFor={`chart-${item}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Sentiment & Insider Activity */}
                  <AccordionItem value="sentiment">
                    <AccordionTrigger className="text-base">Sentiment & Insider Activity</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {SENTIMENT_CONFLUENCES.map((item) => (
                          <div key={item} className="flex items-start space-x-2">
                            <Checkbox
                              id={`sentiment-${item}`}
                              checked={selectedSentimentConfluences.includes(item)}
                              onCheckedChange={() => toggleSentimentConfluence(item)}
                            />
                            <label
                              htmlFor={`sentiment-${item}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
              
              {/* Risk Factors Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Risks to Watch For</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Select risk factors that investors should monitor</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="border p-4 rounded-md">
                  <div className="grid grid-cols-2 gap-2">
                    {RISK_FACTORS.map((item) => (
                      <div key={item} className="flex items-start space-x-2">
                        <Checkbox
                          id={`risk-${item}`}
                          checked={selectedRiskFactors.includes(item)}
                          onCheckedChange={() => toggleRiskFactor(item)}
                        />
                        <label
                          htmlFor={`risk-${item}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {item}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {selectedRiskFactors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm mb-1">Selected Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedRiskFactors.map(item => (
                        <Badge key={item} variant="destructive" className="flex items-center gap-1">
                          {item}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => toggleRiskFactor(item)}
                          />
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Narrative Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Stock Narrative</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Provide a compelling narrative for why this stock is a good investment opportunity.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <FormField
                  control={form.control}
                  name="narrative"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain the investment thesis, catalysts, and why this stock has potential. Include key factors that make this a compelling opportunity."
                          className="min-h-[150px]" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        This will be shown to users to help them understand the investment opportunity.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Technical Analysis Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Technical Analysis</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Select technical reasons that support this stock pick or add your own.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Selected Reasons */}
                <div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedReasons.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No technical reasons selected</p>
                    ) : (
                      selectedReasons.map(reason => (
                        <Badge 
                          key={reason} 
                          variant="secondary"
                          className="flex items-center gap-1 px-3 py-1"
                        >
                          {reason}
                          <button 
                            onClick={() => handleRemoveReason(reason)}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>
                
                {/* Common Technical Reasons */}
                <div>
                  <FormLabel>Common Technical Reasons</FormLabel>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    {loadingReasons ? (
                      <div className="col-span-3 flex justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : (
                      technicalReasons ? technicalReasons.map(reason => (
                        <div key={reason.id} className="flex items-start space-x-2">
                          <Checkbox 
                            id={`reason-${reason.id}`}
                            checked={selectedReasons.includes(reason.name)}
                            onCheckedChange={() => toggleReasonSelection(reason.name)}
                          />
                          <label 
                            htmlFor={`reason-${reason.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {reason.name}
                          </label>
                        </div>
                      )) : (
                        // Fallback to common technical reasons if API fails
                        ['Support Level', 'Resistance Breakout', 'Oversold RSI', 'Upward Trend', 'Volume Increase', 'Moving Average Crossover', 'Earnings Beat', 'Sector Momentum', 'Bullish Pattern'].map(reason => (
                          <div key={reason} className="flex items-start space-x-2">
                            <Checkbox 
                              id={`reason-${reason}`}
                              checked={selectedReasons.includes(reason)}
                              onCheckedChange={() => toggleReasonSelection(reason)}
                            />
                            <label 
                              htmlFor={`reason-${reason}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {reason}
                            </label>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
                
                {/* Custom Reason Input */}
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Add custom technical reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    onClick={handleAddReason}
                    disabled={!customReason.trim()}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add
                  </Button>
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Additional Notes</h3>
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Internal Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any internal notes about this alert (not visible to users)..." 
                          {...field} 
                          className="min-h-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Button */}
              <CardFooter className="px-0 pt-4 flex justify-end">
                <Button 
                  type="submit" 
                  disabled={createStockAlert.isPending} 
                  className="w-full md:w-auto"
                >
                  {createStockAlert.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Stock Alert
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}