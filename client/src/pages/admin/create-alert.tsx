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

const stockAlertFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10),
  companyName: z.string().min(1, "Company name is required"),
  currentPrice: z.coerce.number().positive("Current price must be positive"),
  buyZoneMin: z.coerce.number().positive("Buy zone minimum must be positive"),
  buyZoneMax: z.coerce.number().positive("Buy zone maximum must be positive"),
  target1: z.coerce.number().positive("Target 1 must be positive"),
  target2: z.coerce.number().positive("Target 2 must be positive"),
  target3: z.coerce.number().positive("Target 3 must be positive"),
  status: z.string().default("active"),
  narrative: z.string().optional(),
  technicalReasons: z.array(z.string()),
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
      
      if (isDemoMode) {
        // In demo mode, automatically grant admin access
        setIsAdmin(true);
        return;
      }
      
      try {
        // Include demo mode header if in demo mode
        const headers: Record<string, string> = {};
        if (isDemoMode) {
          headers['X-Demo-Mode'] = 'true';
        }
        
        const res = await apiRequest('GET', '/api/user/is-admin', undefined, headers);
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
        setIsAdmin(false);
        toast({
          title: 'Access Denied',
          description: 'Access restricted. Enable demo mode to try this feature.',
          variant: 'destructive'
        });
      }
    }
    
    checkAdminStatus();
  }, [toast]);

  // Fetch technical reasons
  const { data: technicalReasons, isLoading: loadingReasons } = useQuery<{ id: number, name: string }[]>({
    queryKey: ['/api/technical-reasons'],
    queryFn: async ({ queryKey }) => {
      // Check for demo mode
      const isDemoMode = localStorage.getItem('demoMode') === 'true';
      
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
      const endpoint = queryKey[0] as string;
      // Add demo mode header if needed
      const headers: Record<string, string> = {};
      if (isDemoMode) {
        headers['X-Demo-Mode'] = 'true';
      }
      
      const res = await fetch(endpoint, {
        headers,
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch technical reasons');
      }
      return res.json();
    },
  });

  // Form setup
  const form = useForm<StockAlertFormValues>({
    resolver: zodResolver(stockAlertFormSchema),
    defaultValues: {
      symbol: '',
      companyName: '',
      currentPrice: undefined,
      buyZoneMin: undefined,
      buyZoneMax: undefined,
      target1: undefined,
      target2: undefined,
      target3: undefined,
      status: 'active',
      narrative: '',
      technicalReasons: [],
      sector: '',
      notes: '',
    },
  });

  // Add stock alert mutation
  const createStockAlert = useMutation({
    mutationFn: async (data: StockAlertFormValues) => {
      // Check if in demo mode
      const isDemoMode = localStorage.getItem('demoMode') === 'true';
      
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
      const headers: Record<string, string> = {};
      if (isDemoMode) {
        headers['X-Demo-Mode'] = 'true';
      }
      const res = await apiRequest('POST', '/api/stock-alerts', data, headers);
      return res.json();
    },
    onSuccess: (data: StockAlert) => {
      toast({
        title: 'Stock Alert Created',
        description: `${data.symbol} alert has been created successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/stock-alerts'] });
      form.reset();
      setSelectedReasons([]);
      
      // If in demo mode, provide additional context
      if (localStorage.getItem('demoMode') === 'true') {
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

  function onSubmit(data: StockAlertFormValues) {
    // Make sure technical reasons are properly set
    const formData = {
      ...data,
      technicalReasons: selectedReasons
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

              {/* Narrative Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Analysis Details</h3>
                <FormField
                  control={form.control}
                  name="narrative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narrative</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed analysis of why this stock is being recommended..." 
                          {...field} 
                          className="min-h-32"
                        />
                      </FormControl>
                      <FormDescription>
                        Include key insights about this stock pick (up to 500 words)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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