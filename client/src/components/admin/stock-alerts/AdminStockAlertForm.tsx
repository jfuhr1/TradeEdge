import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TechnicalReason } from "@shared/schema";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Loader2 } from "lucide-react";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Create a schema for stock alert form
const stockAlertFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10),
  companyName: z.string().min(1, "Company name is required"),
  currentPrice: z.coerce.number().positive("Price must be positive"),
  buyZoneMin: z.coerce.number().positive("Buy zone minimum must be positive"),
  buyZoneMax: z.coerce.number().positive("Buy zone maximum must be positive"),
  target1: z.coerce.number().positive("Target 1 must be positive"),
  target2: z.coerce.number().positive("Target 2 must be positive"),
  target3: z.coerce.number().positive("Target 3 must be positive"),
  
  // Target reasoning fields
  target1Reasoning: z.string().optional(),
  target2Reasoning: z.string().optional(),
  target3Reasoning: z.string().optional(),
  
  // Technical reasons
  technicalReasons: z.array(z.string()).min(1, "At least one technical reason is required"),
  
  // Chart URLs
  dailyChartImageUrl: z.string().url("Must be a valid URL").optional(),
  weeklyChartImageUrl: z.string().url("Must be a valid URL").optional(),
  mainChartType: z.enum(["daily", "weekly"]).default("daily"),
  
  // Narrative & risk management
  narrative: z.string().optional(),
  risks: z.string().optional(),
  
  // Tags & confluences
  tags: z.array(z.string()).optional(),
  confluences: z.array(z.string()).optional(),
  
  // Additional fields for admin
  sector: z.string().optional(),
  industry: z.string().optional(),
  timeFrame: z.enum(["short", "medium", "long"]).optional(),
  riskRating: z.number().min(1).max(5).optional(),
  requiredTier: z.enum(["free", "paid", "premium", "mentorship"]).default("free"),
  status: z.enum(["active", "closed", "cancelled"]).default("active"),
}).refine(data => data.buyZoneMax > data.buyZoneMin, {
  message: "Buy zone maximum must be greater than minimum",
  path: ["buyZoneMax"],
}).refine(data => data.target1 > data.currentPrice, {
  message: "Target 1 must be greater than current price",
  path: ["target1"],
}).refine(data => data.target2 > data.target1, {
  message: "Target 2 must be greater than Target 1",
  path: ["target2"],
}).refine(data => data.target3 > data.target2, {
  message: "Target 3 must be greater than Target 2",
  path: ["target3"],
});

type StockAlertFormValues = z.infer<typeof stockAlertFormSchema>;

export default function AdminStockAlertForm() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const canCreateAlerts = hasPermission("canCreateAlerts");
  
  const [tagInput, setTagInput] = useState("");
  const [confluenceInput, setConfluenceInput] = useState("");
  const [techReason, setTechReason] = useState("");

  // Get technical reasons from the API
  const { data: technicalReasons } = useQuery<TechnicalReason[]>({
    queryKey: ["/api/technical-reasons?demo=true"], // Use demo mode for reliable data
    staleTime: Infinity, // Only fetch once
    retry: false // Don't retry on failure
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
      dailyChartImageUrl: "",
      weeklyChartImageUrl: "",
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
      
      const res = await apiRequest("POST", "/api/stock-alerts", payload);
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

  // We'll continue even if technical reasons fails to load
  // So we don't need to block the entire form

  return (
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
                  <FormLabel>Stock Symbol</FormLabel>
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
                  <FormLabel>Company Name</FormLabel>
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
                  <FormLabel>Current Price ($)</FormLabel>
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
              <h4 className="text-sm font-medium">Buy Zone</h4>
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
              <h4 className="text-sm font-medium">Price Targets</h4>
              
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
                  <FormLabel>Technical Reasons</FormLabel>
                  <div className="flex items-center space-x-2">
                    <Input 
                      placeholder="Add technical reason"
                      value={techReason}
                      onChange={(e) => setTechReason(e.target.value)}
                    />
                    <Button 
                      type="button"
                      onClick={addTechnicalReason}
                      variant="outline"
                      size="sm"
                    >
                      Add
                    </Button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch("technicalReasons")?.map((reason, index) => (
                      <div 
                        key={index} 
                        className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        <span>{reason}</span>
                        <button 
                          type="button"
                          onClick={() => removeTechnicalReason(reason)}
                          className="text-secondary-foreground/70 hover:text-secondary-foreground"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chart URLs */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Chart Images</h4>
              
              <FormField
                control={form.control}
                name="dailyChartImageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Chart URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/chart.jpg" {...field} />
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
                    <FormLabel>Weekly Chart URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/weekly-chart.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mainChartType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Chart Display</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select chart type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily Chart</SelectItem>
                        <SelectItem value="weekly">Weekly Chart</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Narrative & Risks */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="narrative"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Narrative</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the investment thesis..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="risks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risks</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe potential risks..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags & Confluences */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="tags"
                render={() => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Add tag"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                      />
                      <Button 
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("tags")?.map((tag, index) => (
                        <div 
                          key={index} 
                          className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          <span>{tag}</span>
                          <button 
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="text-secondary-foreground/70 hover:text-secondary-foreground"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confluences"
                render={() => (
                  <FormItem>
                    <FormLabel>Confluences</FormLabel>
                    <div className="flex items-center space-x-2">
                      <Input 
                        placeholder="Add confluence"
                        value={confluenceInput}
                        onChange={(e) => setConfluenceInput(e.target.value)}
                      />
                      <Button 
                        type="button"
                        onClick={addConfluence}
                        variant="outline"
                        size="sm"
                      >
                        Add
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch("confluences")?.map((confluence, index) => (
                        <div 
                          key={index} 
                          className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-1"
                        >
                          <span>{confluence}</span>
                          <button 
                            type="button"
                            onClick={() => removeConfluence(confluence)}
                            className="text-secondary-foreground/70 hover:text-secondary-foreground"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Separator />
        
        {/* Admin-specific fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                      <SelectValue placeholder="Select time frame" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="short">Short-term (Days-Weeks)</SelectItem>
                    <SelectItem value="medium">Medium-term (Weeks-Months)</SelectItem>
                    <SelectItem value="long">Long-term (Months+)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="riskRating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Risk Rating (1-5)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    max="5" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 3)}
                  />
                </FormControl>
                <FormDescription>
                  1 = Very Low, 5 = Very High
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="requiredTier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Membership Tier Access</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="mentorship">Mentorship</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Members with this tier or higher can view this alert
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Alert Status</FormLabel>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="active" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Active</FormLabel>
                  </FormItem>
                  
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="closed" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Closed</FormLabel>
                  </FormItem>
                  
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value="cancelled" />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Cancelled</FormLabel>
                  </FormItem>
                </RadioGroup>
                <FormDescription>
                  Only active alerts are visible to members
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!canCreateAlerts || createAlert.isPending}
            className="min-w-[120px]"
          >
            {createAlert.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : "Create Alert"}
          </Button>
        </div>
      </form>
    </Form>
  );
}