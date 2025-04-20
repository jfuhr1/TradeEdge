import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertPreference, StockAlert } from "@shared/schema";
import { Link } from "wouter";
import { ArrowLeft, Bell, Check, Loader2, Mail, MessageSquare, Percent, Target, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

// Schema for the alert preference form
const alertPreferenceSchema = z.object({
  stockAlertId: z.number(),
  targetOne: z.boolean().default(true),
  targetTwo: z.boolean().default(false),
  targetThree: z.boolean().default(false),
  percentChange: z.number().nullable().default(null),
  customTargetPrice: z.number().nullable().default(null),
  emailEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(true),
  textEnabled: z.boolean().default(false),
});

type AlertPreferenceFormValues = z.infer<typeof alertPreferenceSchema>;

export default function AlertSettings() {
  const { user } = useAuth();
  const [selectedStock, setSelectedStock] = useState<number | null>(null);
  
  // Query to fetch stock alerts
  const { data: stockAlerts, isLoading: isLoadingAlerts } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts"],
    enabled: !!user,
  });
  
  // Query to fetch user's alert preferences
  const { data: alertPreferences, isLoading: isLoadingPreferences } = useQuery<AlertPreference[]>({
    queryKey: ["/api/alert-preferences"],
    enabled: !!user,
  });
  
  // Query to fetch a single alert preference by stock ID
  const { data: selectedPreference, isLoading: isLoadingPreference } = useQuery<AlertPreference>({
    queryKey: ["/api/alert-preferences", selectedStock],
    enabled: !!selectedStock,
  });
  
  // Mutation to create/update an alert preference
  const savePreferenceMutation = useMutation({
    mutationFn: async (data: AlertPreferenceFormValues) => {
      const res = await apiRequest("POST", "/api/alert-preferences", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert preferences saved",
        description: "Your alert preferences have been updated.",
      });
      // Invalidate the queries to refetch the data
      queryClient.invalidateQueries({ queryKey: ["/api/alert-preferences"] });
      if (selectedStock) {
        queryClient.invalidateQueries({ queryKey: ["/api/alert-preferences", selectedStock] });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving preferences",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete mutation
  const deletePreferenceMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/alert-preferences/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Alert preference removed",
        description: "Your alert preference has been removed.",
      });
      setSelectedStock(null);
      queryClient.invalidateQueries({ queryKey: ["/api/alert-preferences"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error removing preference",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Set up the form
  const form = useForm<AlertPreferenceFormValues>({
    resolver: zodResolver(alertPreferenceSchema),
    defaultValues: {
      stockAlertId: 0,
      targetOne: true,
      targetTwo: false,
      targetThree: false,
      percentChange: null,
      customTargetPrice: null,
      emailEnabled: true,
      pushEnabled: true,
      textEnabled: false,
    },
  });
  
  // When selectedStock changes, update the form values
  useEffect(() => {
    if (selectedStock && selectedPreference) {
      form.reset({
        stockAlertId: selectedStock,
        targetOne: selectedPreference.targetOne,
        targetTwo: selectedPreference.targetTwo,
        targetThree: selectedPreference.targetThree,
        percentChange: selectedPreference.percentChange,
        customTargetPrice: selectedPreference.customTargetPrice,
        emailEnabled: selectedPreference.emailEnabled,
        pushEnabled: selectedPreference.pushEnabled,
        textEnabled: selectedPreference.textEnabled,
      });
    } else if (selectedStock) {
      form.reset({
        stockAlertId: selectedStock,
        targetOne: true,
        targetTwo: false,
        targetThree: false,
        percentChange: null,
        customTargetPrice: null,
        emailEnabled: true,
        pushEnabled: true,
        textEnabled: false,
      });
    }
  }, [selectedStock, selectedPreference, form]);
  
  // Handle form submission
  const onSubmit = (data: AlertPreferenceFormValues) => {
    savePreferenceMutation.mutate(data);
  };
  
  // Handle preference deletion
  const handleDelete = () => {
    if (selectedPreference) {
      deletePreferenceMutation.mutate(selectedPreference.id);
    }
  };
  
  // If the user is on free tier, display upgrade message
  if (user?.tier === 'free') {
    return (
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-6">Alert Settings</h1>
        <Card>
          <CardHeader>
            <CardTitle>Premium Feature</CardTitle>
            <CardDescription>Alert customization is a premium feature</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-6">
              Personalized alerts are available for premium members. Upgrade your account to access this feature.
            </p>
            <Button>Upgrade to Premium</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Loading state
  if (isLoadingAlerts || isLoadingPreferences) {
    return (
      <div className="container max-w-6xl py-8">
        <h1 className="text-3xl font-bold mb-6">Alert Settings</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Loading alert preferences...</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Alert Settings</h1>
        <Button variant="outline" asChild>
          <Link href="/stock-alerts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Alerts
          </Link>
        </Button>
      </div>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Stocks List */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>Select a stock to customize alerts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stockAlerts?.map((stock) => (
                  <Button
                    key={stock.id}
                    variant={selectedStock === stock.id ? "default" : "outline"}
                    className="w-full justify-start"
                    onClick={() => setSelectedStock(stock.id)}
                  >
                    <div className="flex items-center w-full">
                      <span className="font-bold">{stock.symbol}</span>
                      <span className="ml-auto">
                        {alertPreferences?.some(p => p.stockAlertId === stock.id) && (
                          <Badge variant="outline" className="ml-2">
                            <Bell className="h-3 w-3 mr-1" />
                            Alert Set
                          </Badge>
                        )}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Alert Configuration */}
        <div className="md:col-span-2">
          {selectedStock ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {stockAlerts?.find(s => s.id === selectedStock)?.symbol} Alert Preferences
                </CardTitle>
                <CardDescription>
                  Customize how and when you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <Tabs defaultValue="targets" className="w-full">
                      <TabsList className="mb-4">
                        <TabsTrigger value="targets">Price Targets</TabsTrigger>
                        <TabsTrigger value="delivery">Delivery Methods</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="targets" className="space-y-4">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Target Alerts</h3>
                          
                          <FormField
                            control={form.control}
                            name="targetOne"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center">
                                    <Target className="h-4 w-4 mr-2" />
                                    Target 1 Alert
                                  </FormLabel>
                                  <FormDescription>
                                    Alert when the price approaches ${stockAlerts?.find(s => s.id === selectedStock)?.target1}
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
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center">
                                    <Target className="h-4 w-4 mr-2" />
                                    Target 2 Alert
                                  </FormLabel>
                                  <FormDescription>
                                    Alert when the price approaches ${stockAlerts?.find(s => s.id === selectedStock)?.target2}
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
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                  <FormLabel className="text-base flex items-center">
                                    <Target className="h-4 w-4 mr-2" />
                                    Target 3 Alert
                                  </FormLabel>
                                  <FormDescription>
                                    Alert when the price approaches ${stockAlerts?.find(s => s.id === selectedStock)?.target3}
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
                        
                        <Separator />
                        
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Custom Alerts</h3>
                          
                          <FormField
                            control={form.control}
                            name="percentChange"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center">
                                  <Percent className="h-4 w-4 mr-2" />
                                  Percent Change Alert
                                </FormLabel>
                                <FormDescription>
                                  Alert when the price increases by this percentage from the buy zone
                                </FormDescription>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 5 for 5%"
                                    value={field.value?.toString() || ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(value ? parseFloat(value) : null);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="customTargetPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="flex items-center">
                                  <Target className="h-4 w-4 mr-2" />
                                  Custom Target Price
                                </FormLabel>
                                <FormDescription>
                                  Alert when the price reaches a specific target price
                                </FormDescription>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="e.g. 150.75"
                                    value={field.value?.toString() || ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      field.onChange(value ? parseFloat(value) : null);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="delivery" className="space-y-4">
                        <h3 className="text-lg font-medium">Notification Methods</h3>
                        
                        <FormField
                          control={form.control}
                          name="emailEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Mail className="h-4 w-4 mr-2" />
                                  Email Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive alerts via email to {user?.email}
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
                          name="pushEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <Bell className="h-4 w-4 mr-2" />
                                  Push Notifications
                                </FormLabel>
                                <FormDescription>
                                  Receive alerts in your browser or mobile app
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
                          name="textEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base flex items-center">
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  SMS Notifications
                                </FormLabel>
                                <FormDescription>
                                  Available for Executive tier or higher
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  disabled={user?.tier !== 'executive' && user?.tier !== 'vip' && user?.tier !== 'all-in'}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </TabsContent>
                    </Tabs>
                    
                    <div className="flex justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleDelete}
                        disabled={!selectedPreference || deletePreferenceMutation.isPending}
                      >
                        {deletePreferenceMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <X className="mr-2 h-4 w-4" />
                        )}
                        Remove Alerts
                      </Button>
                      
                      <Button 
                        type="submit"
                        disabled={savePreferenceMutation.isPending}
                      >
                        {savePreferenceMutation.isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Save Preferences
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>
                  Select a stock from the list to customize your alert preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Bell className="h-12 w-12 mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Choose a stock from the list on the left to set up customized alerts
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}