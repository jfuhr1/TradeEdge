import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockAlert, AlertPreference } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import MainLayout from "@/components/layout/main-layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Bell, AlertTriangle, Smartphone, Mail, Info } from "lucide-react";

// Form schema for alert preferences
const alertPreferenceSchema = z.object({
  stockAlertId: z.number(),
  targetOne: z.boolean().default(true),
  targetTwo: z.boolean().default(true),
  targetThree: z.boolean().default(true),
  percentChange: z.number().nullable().default(null),
  customTargetPrice: z.number().nullable().default(null),
  textEnabled: z.boolean().default(false),
  emailEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
});

type AlertPreferenceForm = z.infer<typeof alertPreferenceSchema>;

// Filtering function for the notifications
const filterAlertsByTier = (alerts: StockAlert[], userTier: string) => {
  const tierLevels = {
    'free': 0,
    'standard': 1,
    'executive': 2,
    'vip': 3,
    'all-in': 4
  };

  const userTierLevel = tierLevels[userTier as keyof typeof tierLevels] || 0;
  
  return alerts.filter(alert => {
    // Default to free tier if requiredTier is not defined
    const requiredTierLevel = tierLevels[(alert.requiredTier || 'free') as keyof typeof tierLevels] || 0;
    return userTierLevel >= requiredTierLevel;
  });
};

export default function AlertSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();
  const [stockIdParam, setStockIdParam] = useState<number | null>(null);
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  
  // Get stock ID from URL query param if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stockId = params.get('stock');
    if (stockId) {
      const id = parseInt(stockId);
      if (!isNaN(id)) {
        setStockIdParam(id);
        setSelectedStock(id);
      }
    }
  }, [location]);

  // Fetch all stocks
  const { data: allStocks, isLoading: stocksLoading } = useQuery<StockAlert[]>({
    queryKey: ['/api/stock-alerts'],
    enabled: !!user,
  });

  // Fetch user's alert preferences
  const { data: alertPreferences, isLoading: preferencesLoading } = useQuery<AlertPreference[]>({
    queryKey: ['/api/alert-preferences'],
    enabled: !!user,
  });

  // Filter stocks based on user's tier
  const availableStocks = allStocks && user 
    ? filterAlertsByTier(allStocks, user.tier)
    : [];

  // Get current preference for selected stock
  const currentPreference = alertPreferences?.find(
    (pref) => pref.stockAlertId === selectedStock
  );

  // Set up form with default values based on current preference
  const form = useForm<AlertPreferenceForm>({
    resolver: zodResolver(alertPreferenceSchema),
    defaultValues: {
      stockAlertId: selectedStock || 0,
      targetOne: currentPreference?.targetOne ?? true,
      targetTwo: currentPreference?.targetTwo ?? true,
      targetThree: currentPreference?.targetThree ?? true,
      percentChange: currentPreference?.percentChange || null,
      customTargetPrice: currentPreference?.customTargetPrice || null,
      textEnabled: currentPreference?.textEnabled ?? false,
      emailEnabled: currentPreference?.emailEnabled ?? true,
      pushEnabled: currentPreference?.pushEnabled ?? true,
    },
  });

  // Update form when stock or preference changes
  useEffect(() => {
    if (selectedStock) {
      const preference = alertPreferences?.find(
        (pref) => pref.stockAlertId === selectedStock
      );
      
      form.reset({
        stockAlertId: selectedStock,
        targetOne: preference?.targetOne ?? true,
        targetTwo: preference?.targetTwo ?? true, 
        targetThree: preference?.targetThree ?? true,
        percentChange: preference?.percentChange || null,
        customTargetPrice: preference?.customTargetPrice || null,
        textEnabled: preference?.textEnabled ?? false,
        emailEnabled: preference?.emailEnabled ?? true,
        pushEnabled: preference?.pushEnabled ?? true,
      });
    }
  }, [selectedStock, alertPreferences, form]);

  // Save phone number mutation
  const savePhoneNumber = useMutation({
    mutationFn: async (phone: string) => {
      const response = await apiRequest("PATCH", `/api/users/${user?.id}`, {
        phone
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Phone number updated",
        description: "Your phone number has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update phone number",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Save alert preference mutation
  const savePreference = useMutation({
    mutationFn: async (data: AlertPreferenceForm) => {
      if (currentPreference) {
        // Update existing preference
        const response = await apiRequest(
          "PATCH", 
          `/api/alert-preferences/${currentPreference.id}`,
          data
        );
        return await response.json();
      } else {
        // Create new preference
        const response = await apiRequest("POST", "/api/alert-preferences", data);
        return await response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: "Alert preferences saved",
        description: "Your alert preferences have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/alert-preferences'] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save preferences",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle form submission
  const onSubmit = (data: AlertPreferenceForm) => {
    if (!selectedStock) return;
    
    // Ensure stockAlertId is set correctly
    data.stockAlertId = selectedStock;
    
    // Submit the form
    savePreference.mutate(data);
  };

  // Handle stock selection change
  const handleStockChange = (stockId: string) => {
    const id = parseInt(stockId);
    if (!isNaN(id)) {
      setSelectedStock(id);
      
      // Update URL without page refresh
      const url = new URL(window.location.href);
      url.searchParams.set('stock', id.toString());
      window.history.pushState({}, '', url.toString());
    }
  };

  // Find the selected stock details
  const selectedStockDetails = availableStocks.find(
    (stock) => stock.id === selectedStock
  );

  // Loading state
  if ((stocksLoading || preferencesLoading) && !selectedStock) {
    return (
      <MainLayout title="Alert Settings">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Alert Settings">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Side - List of Stocks & Global Settings */}
          <div className="w-full md:w-1/3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="mr-2 h-5 w-5" />
                  Alert Settings
                </CardTitle>
                <CardDescription>
                  Customize how you receive stock alerts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="stock-select">Select Stock</Label>
                    <Select
                      value={selectedStock?.toString() || ""}
                      onValueChange={handleStockChange}
                    >
                      <SelectTrigger id="stock-select">
                        <SelectValue placeholder="Select a stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStocks.map((stock) => (
                          <SelectItem key={stock.id} value={stock.id.toString()}>
                            {stock.symbol} - {stock.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Contact Information</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number (for SMS alerts)</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 555-5555"
                          value={phoneNumber || user?.phone || ""}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                        />
                        <Button 
                          size="sm"
                          onClick={() => savePhoneNumber.mutate(phoneNumber)}
                          disabled={savePhoneNumber.isPending || !phoneNumber}
                        >
                          Save
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Used for SMS notifications if enabled
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Notification Tiers</AlertTitle>
              <AlertDescription>
                <p className="mb-2">
                  Your current tier ({user && user.tier ? user.tier.charAt(0).toUpperCase() + user.tier.slice(1) : 'Free'}) 
                  gives you access to the following notification types:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Web notifications (All tiers)</li>
                  <li>Email notifications (All tiers)</li>
                  {(user?.tier === 'standard' || user?.tier === 'executive' || user?.tier === 'vip' || user?.tier === 'all-in') && (
                    <li>SMS notifications (Standard tier and above)</li>
                  )}
                  {(user?.tier === 'vip' || user?.tier === 'all-in') && (
                    <li>Custom percentage alerts (VIP tier and above)</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          {/* Right Side - Alert Preferences for Selected Stock */}
          <div className="w-full md:w-2/3">
            {selectedStock && selectedStockDetails ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedStockDetails.symbol} - {selectedStockDetails.companyName}
                  </CardTitle>
                  <CardDescription>
                    Configure your alert preferences for this stock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <Tabs defaultValue="triggers">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="triggers">Alert Triggers</TabsTrigger>
                          <TabsTrigger value="methods">Notification Methods</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="triggers" className="py-4 space-y-4">
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium">Price Targets</h3>
                            
                            <div className="space-y-2">
                              <FormField
                                control={form.control}
                                name="targetOne"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Target 1 (${selectedStockDetails.target1})</FormLabel>
                                      <FormDescription>
                                        Alert when price approaches Target 1
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="targetTwo"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Target 2 (${selectedStockDetails.target2})</FormLabel>
                                      <FormDescription>
                                        Alert when price approaches Target 2
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={form.control}
                                name="targetThree"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                    <div className="space-y-0.5">
                                      <FormLabel>Target 3 (${selectedStockDetails.target3})</FormLabel>
                                      <FormDescription>
                                        Alert when price approaches Target 3
                                      </FormDescription>
                                    </div>
                                    <FormControl>
                                      <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <h3 className="text-sm font-medium mt-6">Custom Alerts</h3>
                            
                            <FormField
                              control={form.control}
                              name="percentChange"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel>Custom Percentage Alert</FormLabel>
                                    <FormDescription>
                                      Alert when price changes by a specific percentage
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value !== null}
                                      onCheckedChange={(checked) => {
                                        field.onChange(checked ? 5 : null);
                                      }}
                                      disabled={!(user?.tier === 'vip' || user?.tier === 'all-in')}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            {form.watch("percentChange") !== null && (
                              <FormField
                                control={form.control}
                                name="percentChange"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Percentage Change (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        step="0.1"
                                        placeholder="5.0"
                                        value={field.value === null ? "" : field.value}
                                        onChange={(e) => {
                                          const value = e.target.value === "" ? null : Number(e.target.value);
                                          field.onChange(value);
                                        }}
                                      />
                                    </FormControl>
                                    <FormDescription>
                                      Enter a percentage value (e.g., 5 for 5%)
                                    </FormDescription>
                                  </FormItem>
                                )}
                              />
                            )}
                          </div>
                        </TabsContent>
                        
                        <TabsContent value="methods" className="py-4 space-y-4">
                          <div className="space-y-4">
                            <h3 className="text-sm font-medium">Notification Methods</h3>
                            
                            <FormField
                              control={form.control}
                              name="pushEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5 flex items-center">
                                    <Bell className="mr-2 h-4 w-4" />
                                    <div>
                                      <FormLabel>Web Notifications</FormLabel>
                                      <FormDescription>
                                        Receive alerts in the app when signed in
                                      </FormDescription>
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="emailEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5 flex items-center">
                                    <Mail className="mr-2 h-4 w-4" />
                                    <div>
                                      <FormLabel>Email Notifications</FormLabel>
                                      <FormDescription>
                                        Receive email alerts to {user?.email}
                                      </FormDescription>
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="textEnabled"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5 flex items-center">
                                    <Smartphone className="mr-2 h-4 w-4" />
                                    <div>
                                      <FormLabel>SMS Notifications</FormLabel>
                                      <FormDescription>
                                        Receive text alerts to {user?.phone || "No phone number set"}
                                      </FormDescription>
                                    </div>
                                  </div>
                                  <FormControl>
                                    <Switch
                                      checked={field.value}
                                      onCheckedChange={field.onChange}
                                      disabled={!(user?.tier === 'standard' || user?.tier === 'executive' || user?.tier === 'vip' || user?.tier === 'all-in') || !user?.phone}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            {!user?.phone && (
                              <div className="flex items-start p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                                <Info className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                                <div className="text-sm text-yellow-700">
                                  <p className="font-medium">Phone number needed for SMS alerts</p>
                                  <p>Add your phone number in the contact settings to enable SMS notifications.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={savePreference.isPending || !form.formState.isDirty}
                      >
                        {savePreference.isPending
                          ? "Saving..."
                          : "Save Alert Preferences"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-10">
                  <div className="rounded-full bg-primary-50 p-3 mb-4">
                    <Bell className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">Select a Stock</h3>
                  <p className="text-center text-muted-foreground mb-6">
                    Choose a stock from the dropdown to customize your alert preferences
                  </p>
                  <Select onValueChange={handleStockChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a stock" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStocks.map((stock) => (
                        <SelectItem key={stock.id} value={stock.id.toString()}>
                          {stock.symbol} - {stock.companyName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>
            )}

            {/* Preferences List */}
            {alertPreferences && alertPreferences.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Your Alert Preferences</CardTitle>
                  <CardDescription>
                    Overview of all your configured stock alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stock</TableHead>
                        <TableHead>Target Alerts</TableHead>
                        <TableHead>Methods</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {alertPreferences.map((pref) => {
                        const stock = availableStocks.find(
                          (s) => s.id === pref.stockAlertId
                        );
                        if (!stock) return null;
                        
                        return (
                          <TableRow key={pref.id}>
                            <TableCell>
                              <div className="font-medium">{stock.symbol}</div>
                              <div className="text-sm text-muted-foreground">
                                {stock.companyName.length > 25
                                  ? `${stock.companyName.substring(0, 25)}...`
                                  : stock.companyName}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {pref.targetOne && (
                                  <div className="px-2 py-1 rounded-md text-xs border inline-block w-fit">
                                    Target 1: ${stock.target1}
                                  </div>
                                )}
                                {pref.targetTwo && (
                                  <div className="px-2 py-1 rounded-md text-xs border inline-block w-fit">
                                    Target 2: ${stock.target2}
                                  </div>
                                )}
                                {pref.targetThree && (
                                  <div className="px-2 py-1 rounded-md text-xs border inline-block w-fit">
                                    Target 3: ${stock.target3}
                                  </div>
                                )}
                                {pref.percentChange !== null && (
                                  <div className="px-2 py-1 rounded-md text-xs border inline-block w-fit">
                                    Custom: {pref.percentChange}%
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {pref.pushEnabled && (
                                  <Bell className="h-4 w-4 text-muted-foreground" />
                                )}
                                {pref.emailEnabled && (
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                )}
                                {pref.textEnabled && (
                                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedStock(pref.stockAlertId);
                                  // Update URL without page refresh
                                  const url = new URL(window.location.href);
                                  url.searchParams.set('stock', pref.stockAlertId.toString());
                                  window.history.pushState({}, '', url.toString());
                                }}
                              >
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}