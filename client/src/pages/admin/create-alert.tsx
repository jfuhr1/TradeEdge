import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { useMutation, useQuery } from '@tanstack/react-query';
import { insertStockAlertSchema, StockAlert } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import MainLayout from '@/components/layout/main-layout';
import { Loader2, Plus, X, Info, Trash2, Upload, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  dateAdded: z.date(),
  tags: z.array(z.string()).max(3, "Maximum 3 tags allowed"),
  newTag: z.string().optional(),
  buyZoneMin: z.coerce.number().positive("Buy zone minimum must be positive"),
  buyZoneMax: z.coerce.number().positive("Buy zone maximum must be positive"),
  target1: z.coerce.number().positive("Target 1 must be positive"),
  target2: z.coerce.number().positive("Target 2 must be positive"),
  target3: z.coerce.number().positive("Target 3 must be positive"),
  target1Reasoning: z.string().min(1, "Reasoning for Target 1 is required"),
  target2Reasoning: z.string().min(1, "Reasoning for Target 2 is required"),
  target3Reasoning: z.string().min(1, "Reasoning for Target 3 is required"),
  narrative: z.string().min(10, "Narrative is required and should provide context"),
  dailyChartUrl: z.string().optional(),
  weeklyChartUrl: z.string().optional(),
  technicalReasons: z.array(z.string()),
  priceConfluences: z.array(z.string()),
  volumeConfluences: z.array(z.string()),
  momentumConfluences: z.array(z.string()),
  chartConfluences: z.array(z.string()),
  sentimentConfluences: z.array(z.string()),
  riskFactors: z.array(z.string()),
  newRisk: z.string().optional(),

  notes: z.string().optional(),
});

type StockAlertFormValues = z.infer<typeof stockAlertFormSchema>;

export default function CreateAlert() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
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



  // State management for selections
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedPriceConfluences, setSelectedPriceConfluences] = useState<string[]>([]);
  const [selectedVolumeConfluences, setSelectedVolumeConfluences] = useState<string[]>([]);
  const [selectedMomentumConfluences, setSelectedMomentumConfluences] = useState<string[]>([]);
  const [selectedChartConfluences, setSelectedChartConfluences] = useState<string[]>([]);
  const [selectedSentimentConfluences, setSelectedSentimentConfluences] = useState<string[]>([]);
  const [selectedRiskFactors, setSelectedRiskFactors] = useState<string[]>([]);

  // State management for custom tags and risks
  const [availableTags, setAvailableTags] = useState<string[]>([...STOCK_TAGS]);
  const [availableRisks, setAvailableRisks] = useState<string[]>([...RISK_FACTORS]);
  
  // Form setup
  const form = useForm<StockAlertFormValues>({
    resolver: zodResolver(stockAlertFormSchema),
    defaultValues: {
      symbol: '',
      companyName: '',
      dateAdded: new Date(),
      tags: [],
      newTag: '',
      buyZoneMin: undefined,
      buyZoneMax: undefined,
      target1: undefined,
      target2: undefined,
      target3: undefined,
      target1Reasoning: '',
      target2Reasoning: '',
      target3Reasoning: '',
      narrative: '',
      dailyChartUrl: '',
      weeklyChartUrl: '',
      technicalReasons: [],
      priceConfluences: [],
      volumeConfluences: [],
      momentumConfluences: [],
      chartConfluences: [],
      sentimentConfluences: [],
      riskFactors: [],
      newRisk: '',

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
  
  // Add a new tag to the system
  const addNewTag = (newTag: string) => {
    if (!newTag || newTag.trim() === '') return;
    
    // Check if tag already exists
    if (availableTags.includes(newTag)) {
      toast({
        title: "Tag already exists",
        description: `The tag "${newTag}" is already in the system.`,
        variant: "destructive"
      });
      return;
    }
    
    // Add to available tags
    const updatedTags = [...availableTags, newTag];
    setAvailableTags(updatedTags);
    
    // Clear the new tag field
    form.setValue('newTag', '');
    
    // Also select it if we haven't reached our limit
    if (selectedTags.length < 3) {
      const updatedSelectedTags = [...selectedTags, newTag];
      setSelectedTags(updatedSelectedTags);
      form.setValue('tags', updatedSelectedTags);
      
      toast({
        title: "Tag Added",
        description: `New tag "${newTag}" has been added to the system.`
      });
    } else {
      toast({
        title: "Tag Added",
        description: `New tag "${newTag}" has been added to the system but not selected due to 3-tag limit.`
      });
    }
  };
  
  // Add a new risk factor to the system
  const addNewRisk = (newRisk: string) => {
    if (!newRisk || newRisk.trim() === '') return;
    
    // Check if risk already exists
    if (availableRisks.includes(newRisk)) {
      toast({
        title: "Risk factor already exists",
        description: `The risk factor "${newRisk}" is already in the system.`,
        variant: "destructive"
      });
      return;
    }
    
    // Add to available risks
    const updatedRisks = [...availableRisks, newRisk];
    setAvailableRisks(updatedRisks);
    
    // Clear the new risk field
    form.setValue('newRisk', '');
    
    // Also select it
    const updatedSelectedRisks = [...selectedRiskFactors, newRisk];
    setSelectedRiskFactors(updatedSelectedRisks);
    form.setValue('riskFactors', updatedSelectedRisks);
    
    toast({
      title: "Risk Factor Added",
      description: `New risk factor "${newRisk}" has been added to the system.`
    });
  };

  function onSubmit(data: StockAlertFormValues) {
    // Check if there's a new tag to add
    if (data.newTag && data.newTag.trim() !== '') {
      addNewTag(data.newTag);
      return; // Don't submit yet, let user see the new tag first
    }
    
    // Check if there's a new risk to add
    if (data.newRisk && data.newRisk.trim() !== '') {
      addNewRisk(data.newRisk);
      return; // Don't submit yet, let user see the new risk first
    }
    
    // Make sure all selected data is properly set
    const formData = {
      ...data,
      // Add status field for the API (not shown in the form)
      status: "active",
      technicalReasons: [],
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
    const { buyZoneMin, buyZoneMax, target1, target2, target3 } = values;
    
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
                
                {/* Date Added */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateAdded"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date Added</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("2000-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>
                          Date this stock alert was added to the system
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
                  
                  {/* Add New Tag Field */}
                  <FormField
                    control={form.control}
                    name="newTag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add New Tag</FormLabel>
                        <div className="flex space-x-2">
                          <FormControl>
                            <Input 
                              placeholder="Enter a new tag name" 
                              {...field} 
                            />
                          </FormControl>
                          <Button
                            type="button"
                            onClick={() => {
                              if (field.value?.trim()) {
                                addNewTag(field.value);
                              }
                            }}
                            className="whitespace-nowrap"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Tag
                          </Button>
                        </div>
                        <FormDescription>
                          Create a new tag that will be available for future stock alerts
                        </FormDescription>
                        <FormMessage />
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
                            placeholder="Explain why this is a good place to take profit (resistance level, support turned resistance, fibonacci)"
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
                            placeholder="Explain why this is a good place to take profit (resistance level, support turned resistance, fibonacci)"
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
                            placeholder="Explain why this is a good place to take profit (resistance level, support turned resistance, fibonacci)"
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
                        {/* Daily Indicators (Left Column) */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium mb-2">Daily Indicators</h4>
                          {MOMENTUM_CONFLUENCES.slice(0, 5).map((item) => (
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
                        
                        {/* Weekly Indicators (Right Column) */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium mb-2">Weekly Indicators</h4>
                          {MOMENTUM_CONFLUENCES.slice(5).map((item) => (
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
                
                {/* Add New Risk Factor Field */}
                <FormField
                  control={form.control}
                  name="newRisk"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Add New Risk Factor</FormLabel>
                      <div className="flex space-x-2">
                        <FormControl>
                          <Input 
                            placeholder="Enter a new risk factor" 
                            {...field} 
                          />
                        </FormControl>
                        <Button
                          type="button"
                          onClick={() => {
                            if (field.value?.trim()) {
                              addNewRisk(field.value);
                            }
                          }}
                          className="whitespace-nowrap"
                          variant="destructive"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Risk
                        </Button>
                      </div>
                      <FormDescription>
                        Create a new risk factor that will be available for future stock alerts
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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



              {/* Chart Images Section */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Chart Images</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Upload both a daily and weekly chart for this stock</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="dailyChartUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Chart Image</FormLabel>
                        <FormControl>
                          <div 
                            className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => document.getElementById('daily-chart-input')?.click()}
                          >
                            {field.value ? (
                              <div className="space-y-2 w-full">
                                <p className="text-sm text-muted-foreground text-center">Image selected</p>
                                <img 
                                  src={field.value} 
                                  alt="Daily chart preview" 
                                  className="max-h-48 mx-auto object-contain"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    field.onChange("");
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Image
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2 text-center">
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                <p className="text-sm font-medium">Drag and drop file here or click to browse</p>
                                <p className="text-xs text-muted-foreground">
                                  Supports PNG, JPG, or GIF up to 5MB
                                </p>
                              </div>
                            )}
                            <input
                              id="daily-chart-input"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast({
                                      title: "File too large",
                                      description: "Image must be less than 5MB",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    field.onChange(event.target?.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload your daily timeframe chart image (max 5MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="weeklyChartUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Chart Image</FormLabel>
                        <FormControl>
                          <div 
                            className="border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors"
                            onClick={() => document.getElementById('weekly-chart-input')?.click()}
                          >
                            {field.value ? (
                              <div className="space-y-2 w-full">
                                <p className="text-sm text-muted-foreground text-center">Image selected</p>
                                <img 
                                  src={field.value} 
                                  alt="Weekly chart preview" 
                                  className="max-h-48 mx-auto object-contain"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="sm"
                                  className="w-full"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    field.onChange("");
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Remove Image
                                </Button>
                              </div>
                            ) : (
                              <div className="space-y-2 text-center">
                                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                                <p className="text-sm font-medium">Drag and drop file here or click to browse</p>
                                <p className="text-xs text-muted-foreground">
                                  Supports PNG, JPG, or GIF up to 5MB
                                </p>
                              </div>
                            )}
                            <input
                              id="weekly-chart-input"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    toast({
                                      title: "File too large",
                                      description: "Image must be less than 5MB",
                                      variant: "destructive"
                                    });
                                    return;
                                  }
                                  
                                  const reader = new FileReader();
                                  reader.onload = (event) => {
                                    field.onChange(event.target?.result);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>
                          Upload your weekly timeframe chart image (max 5MB)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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