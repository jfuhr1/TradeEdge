import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Loader2, X, Plus } from "lucide-react";
import { Link } from "wouter";

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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/admin/AdminLayout";

// Create a schema for stock alert form
const stockAlertFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10),
  companyName: z.string().min(1, "Company name is required"),
  currentPrice: z.number().min(0, "Current price must be greater than 0"),
  buyZoneMin: z.number().min(0, "Buy zone minimum must be greater than 0"),
  buyZoneMax: z.number().min(0, "Buy zone maximum must be greater than 0"),
  target1: z.number().min(0, "Target 1 must be greater than 0"),
  target2: z.number().min(0, "Target 2 must be greater than 0"),
  target3: z.number().min(0, "Target 3 must be greater than 0"),
  target1Reasoning: z.string().optional(),
  target2Reasoning: z.string().optional(),
  target3Reasoning: z.string().optional(),
  technicalReasons: z.array(z.string()),
  dailyChartImageUrl: z.string().min(1, "Daily chart image URL is required"),
  weeklyChartImageUrl: z.string().min(1, "Weekly chart image URL is required"),
  mainChartType: z.enum(["daily", "weekly"]),
  narrative: z.string().optional(),
  risks: z.string().optional(),
  tags: z.array(z.string()).default([]),
  confluences: z.array(z.string()).default([]),
  sector: z.string().optional(),
  industry: z.string().optional(),
  timeFrame: z.enum(["short", "medium", "long"]).default("medium"),
  riskRating: z.number().min(1).max(5).default(3),
  requiredTier: z.enum(["free", "paid", "premium", "mentorship"]).default("free"),
  status: z.enum(["active", "closed", "cancelled"]).default("active"),
}).refine(data => data.buyZoneMax >= data.buyZoneMin, {
  message: "Buy zone maximum must be greater than or equal to buy zone minimum",
  path: ["buyZoneMax"],
}).refine(data => data.target1 >= data.buyZoneMax, {
  message: "Target 1 must be greater than buy zone maximum",
  path: ["target1"],
}).refine(data => data.target2 > data.target1, {
  message: "Target 2 must be greater than Target 1",
  path: ["target2"],
}).refine(data => data.target3 > data.target2, {
  message: "Target 3 must be greater than Target 2",
  path: ["target3"],
});

type StockAlertFormValues = z.infer<typeof stockAlertFormSchema>;

export default function CreateStockAlertPage() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const canCreateAlerts = hasPermission("canCreateAlerts");
  
  const [tagInput, setTagInput] = useState("");
  const [confluenceInput, setConfluenceInput] = useState("");
  const [techReason, setTechReason] = useState("");

  // Get technical reasons from the API
  const { data: technicalReasons, isLoading: isLoadingTechReasons } = useQuery({
    queryKey: ["/api/technical-reasons?demo=true"], 
    staleTime: 60000, // 1 minute
    retry: 1 // Only retry once
  });

  // Form setup
  const form = useForm<StockAlertFormValues>({
    resolver: zodResolver(stockAlertFormSchema),
    defaultValues: {
      symbol: "",
      companyName: "",
      currentPrice: 0,
      buyZoneMin: 0,
      buyZoneMax: 0,
      target1: 0,
      target2: 0,
      target3: 0,
      target1Reasoning: "",
      target2Reasoning: "",
      target3Reasoning: "",
      technicalReasons: [],
      dailyChartImageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800",
      weeklyChartImageUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=800",
      mainChartType: "daily",
      narrative: "",
      risks: "",
      tags: [],
      confluences: [],
      sector: "",
      industry: "",
      timeFrame: "medium",
      riskRating: 3,
      requiredTier: "free",
      status: "active",
    },
  });

  // Helper functions for tags and confluences
  const addTag = () => {
    if (!tagInput.trim()) return;
    const currentTags = form.getValues("tags") || [];
    if (!currentTags.includes(tagInput.trim())) {
      form.setValue("tags", [...currentTags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    const currentTags = form.getValues("tags") || [];
    form.setValue("tags", currentTags.filter(t => t !== tag));
  };

  const addConfluence = () => {
    if (!confluenceInput.trim()) return;
    const currentConfluences = form.getValues("confluences") || [];
    if (!currentConfluences.includes(confluenceInput.trim())) {
      form.setValue("confluences", [...currentConfluences, confluenceInput.trim()]);
      setConfluenceInput("");
    }
  };

  const removeConfluence = (confluence: string) => {
    const currentConfluences = form.getValues("confluences") || [];
    form.setValue("confluences", currentConfluences.filter(c => c !== confluence));
  };

  // Add technical reason
  const addTechnicalReason = () => {
    if (!techReason.trim()) return;
    const currentReasons = form.getValues("technicalReasons") || [];
    if (!currentReasons.includes(techReason.trim())) {
      form.setValue("technicalReasons", [...currentReasons, techReason.trim()]);
      setTechReason("");
    }
  };

  // Remove technical reason
  const removeTechnicalReason = (reason: string) => {
    const currentReasons = form.getValues("technicalReasons") || [];
    form.setValue("technicalReasons", currentReasons.filter(r => r !== reason));
  };

  // Create stock alert mutation
  const createAlert = useMutation({
    mutationFn: async (data: StockAlertFormValues) => {
      // If chartImageUrl is still used, set it from dailyChartImageUrl for backward compatibility
      const payload = {
        ...data,
        chartImageUrl: data.dailyChartImageUrl, // For backward compatibility
      };
      
      const endpoint = "/api/stock-alerts?demo=true";
      const res = await apiRequest("POST", endpoint, payload);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create stock alert");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock alert created",
        description: "The stock alert has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-alerts"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create stock alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(data: StockAlertFormValues) {
    if (!canCreateAlerts) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create alerts.",
        variant: "destructive",
      });
      return;
    }
    createAlert.mutate(data);
  }

  if (!canCreateAlerts) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Create Stock Alert</h1>
          <Card>
            <CardHeader>
              <CardTitle>Permission Required</CardTitle>
              <CardDescription>
                You don't have permission to create stock alerts. Contact an administrator for access.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild><Link to="/admin/stock-alerts">Back to Stock Alerts</Link></Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Create Stock Alert</h1>
          <Button variant="outline" asChild><Link to="/admin/stock-alerts">Back to Stock Alerts</Link></Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create New Stock Alert</CardTitle>
            <CardDescription>
              Add a new stock alert to recommend to members. Required fields are marked with an asterisk (*).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Stock Information</h3>
                    
                    {/* Stock Symbol */}
                    <FormField
                      control={form.control}
                      name="symbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Symbol *</FormLabel>
                          <FormControl>
                            <Input placeholder="AAPL" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the stock ticker symbol (e.g., AAPL for Apple)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Company Name */}
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Apple Inc." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Sector & Industry */}
                    <div className="grid grid-cols-2 gap-4">
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
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Industry</FormLabel>
                            <FormControl>
                              <Input placeholder="Consumer Electronics" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Current Price */}
                    <FormField
                      control={form.control}
                      name="currentPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Price ($) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="175.50" 
                              {...field} 
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Buy Zone */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Buy Zone *</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="buyZoneMin"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Min ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="170.00" 
                                  {...field} 
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                              <FormLabel>Max ($)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="175.00" 
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Targets with Reasoning */}
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Price Targets *</h4>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4">
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
                                    placeholder="185.00" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="target1Reasoning"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reasoning</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Short-term resistance level" 
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                    placeholder="195.00" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                <FormLabel>Reasoning</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Previous pivot high" 
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
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
                                    placeholder="205.00" 
                                    {...field} 
                                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
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
                                <FormLabel>Reasoning</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Historical all-time high" 
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-medium">Analysis & Chart</h3>
                    
                    {/* Technical Reasons */}
                    <FormField
                      control={form.control}
                      name="technicalReasons"
                      render={() => (
                        <FormItem>
                          <FormLabel>Technical Reasons *</FormLabel>
                          <div className="flex items-center space-x-2">
                            <Select 
                              value={techReason} 
                              onValueChange={setTechReason}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select reason" />
                              </SelectTrigger>
                              <SelectContent>
                                {isLoadingTechReasons ? (
                                  <div className="flex items-center justify-center p-4">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  </div>
                                ) : (
                                  <>
                                    {technicalReasons?.map((reason: any) => (
                                      <SelectItem key={reason.id} value={reason.name}>
                                        {reason.name}
                                      </SelectItem>
                                    ))}
                                    <SelectItem value="Custom">Custom reason</SelectItem>
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                            <Button 
                              type="button" 
                              variant="secondary" 
                              size="sm"
                              onClick={addTechnicalReason}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {form.getValues("technicalReasons")?.map((reason, index) => (
                              <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                                {reason}
                                <button 
                                  type="button" 
                                  onClick={() => removeTechnicalReason(reason)}
                                  className="ml-1 text-secondary-foreground/70 hover:text-secondary-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                          
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Chart Images */}
                    <FormField
                      control={form.control}
                      name="dailyChartImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Chart Image URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/chart.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="weeklyChartImageUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Weekly Chart Image URL *</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/chart.png" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Main Chart Type */}
                    <FormField
                      control={form.control}
                      name="mainChartType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Chart Type</FormLabel>
                          <FormControl>
                            <RadioGroup 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                              className="flex gap-4"
                            >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="daily" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Daily
                                </FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="weekly" />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Weekly
                                </FormLabel>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Narrative */}
                    <FormField
                      control={form.control}
                      name="narrative"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trade Narrative</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Share the narrative behind this stock pick..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Risks */}
                    <FormField
                      control={form.control}
                      name="risks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Known Risks</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe potential risks to this investment thesis..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Tags */}
                    <FormField
                      control={form.control}
                      name="tags"
                      render={() => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input 
                                placeholder="Add a tag"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                              />
                            </FormControl>
                            <Button 
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={addTag}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {form.getValues("tags")?.map((tag, index) => (
                              <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                                {tag}
                                <button 
                                  type="button" 
                                  onClick={() => removeTag(tag)}
                                  className="ml-1 text-secondary-foreground/70 hover:text-secondary-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confluences */}
                    <FormField
                      control={form.control}
                      name="confluences"
                      render={() => (
                        <FormItem>
                          <FormLabel>Price Confluences</FormLabel>
                          <div className="flex items-center space-x-2">
                            <FormControl>
                              <Input 
                                placeholder="Add a confluence"
                                value={confluenceInput}
                                onChange={(e) => setConfluenceInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addConfluence())}
                              />
                            </FormControl>
                            <Button 
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={addConfluence}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            {form.getValues("confluences")?.map((confluence, index) => (
                              <div key={index} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm">
                                {confluence}
                                <button 
                                  type="button" 
                                  onClick={() => removeConfluence(confluence)}
                                  className="ml-1 text-secondary-foreground/70 hover:text-secondary-foreground"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    {/* Additional Settings */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Time Frame */}
                      <FormField
                        control={form.control}
                        name="timeFrame"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Frame</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select timeframe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="short">Short-term (Days/Weeks)</SelectItem>
                                <SelectItem value="medium">Medium-term (Weeks/Months)</SelectItem>
                                <SelectItem value="long">Long-term (Months+)</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Risk Rating */}
                      <FormField
                        control={form.control}
                        name="riskRating"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Risk Rating (1-5)</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              defaultValue={field.value.toString()}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select risk rating" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="1">1 - Very Low Risk</SelectItem>
                                <SelectItem value="2">2 - Low Risk</SelectItem>
                                <SelectItem value="3">3 - Moderate Risk</SelectItem>
                                <SelectItem value="4">4 - High Risk</SelectItem>
                                <SelectItem value="5">5 - Very High Risk</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Required Tier */}
                      <FormField
                        control={form.control}
                        name="requiredTier"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Required Membership Tier</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select required tier" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="mentorship">Mentorship</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Status */}
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alert Status</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="closed">Closed (Target Hit)</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <Button variant="outline" type="button" onClick={() => form.reset()}>Reset</Button>
                  <Button 
                    type="submit" 
                    disabled={createAlert.isPending}
                  >
                    {createAlert.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Stock Alert"
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}