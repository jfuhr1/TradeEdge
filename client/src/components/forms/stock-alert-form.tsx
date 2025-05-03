import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { TechnicalReason } from "@shared/schema";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Create a schema for stock alert form
const stockAlertFormSchema = z.object({
  symbol: z.string().min(1, "Symbol is required").max(10),
  companyName: z.string().min(1, "Company name is required"),
  currentPrice: z.number().positive("Price must be positive"),
  buyZoneMin: z.number().positive("Buy zone minimum must be positive"),
  buyZoneMax: z.number().positive("Buy zone maximum must be positive"),
  target1: z.number().positive("Target 1 must be positive"),
  target2: z.number().positive("Target 2 must be positive"),
  target3: z.number().positive("Target 3 must be positive"),
  
  // Target reasoning fields
  target1Reasoning: z.string().optional(),
  target2Reasoning: z.string().optional(),
  target3Reasoning: z.string().optional(),
  
  // Technical reasons
  technicalReasons: z.array(z.string()).min(1, "At least one technical reason is required"),
  
  // New fields
  dailyChartImageUrl: z.string().url("Must be a valid URL").optional(),
  weeklyChartImageUrl: z.string().url("Must be a valid URL").optional(),
  mainChartType: z.enum(["daily", "weekly"]).default("daily"),
  
  // Narrative & risk management
  narrative: z.string().optional(),
  risks: z.string().optional(),
  
  // Tags & confluences
  tags: z.array(z.string()).optional(),
  confluences: z.array(z.string()).optional(),
  
  // Additional fields
  sector: z.string().optional(),
  industry: z.string().optional(),
  timeFrame: z.enum(["short", "medium", "long"]).optional(),
  riskRating: z.number().min(1).max(5).optional(),
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

export default function StockAlertForm() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [tagInput, setTagInput] = useState("");
  const [confluenceInput, setConfluenceInput] = useState("");

  // Get technical reasons from the API
  const { data: technicalReasons, isLoading: isLoadingReasons } = useQuery<TechnicalReason[]>({
    queryKey: ["/api/technical-reasons"],
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

  // Create stock alert mutation
  const createAlert = useMutation({
    mutationFn: async (data: StockAlertFormValues) => {
      // If chartImageUrl is still used, set it from dailyChartImageUrl for backward compatibility
      const payload = {
        ...data,
        chartImageUrl: data.dailyChartImageUrl, // For backward compatibility
      };
      
      const res = await apiRequest("POST", "/api/stock-alerts", payload);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock alert created",
        description: "The stock alert has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-alerts"] });
      setLocation("/stock-alerts");
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
    createAlert.mutate(data);
  }

  if (isLoadingReasons) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Stock Alert</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormDescription>
                      Enter the full company name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sector & Industry */}
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
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Current market price of the stock
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Risk Rating & Time Frame */}
              <div className="space-y-4">
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
                          placeholder="3"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 3)}
                        />
                      </FormControl>
                      <FormDescription>
                        1=Low Risk, 5=High Risk
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          <SelectItem value="short">Short Term</SelectItem>
                          <SelectItem value="medium">Medium Term</SelectItem>
                          <SelectItem value="long">Long Term</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Buy Zone Range */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Buy Zone</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="buyZoneMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buy Zone Minimum ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
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
                      <FormLabel>Buy Zone Maximum ($)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          step="0.01" 
                          placeholder="0.00" 
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

            <Separator className="my-4" />

            {/* Target Prices */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Target Prices</h3>
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="target1"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 1 (Conservative)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
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
                    name="target2"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 2 (Moderate)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
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
                    name="target3"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 3 (Aggressive)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Target reasoning */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="target1Reasoning"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target 1 Reasoning</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Explain reasoning for target 1..."
                            className="resize-none"
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
                            placeholder="Explain reasoning for target 2..."
                            className="resize-none"
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
                            placeholder="Explain reasoning for target 3..."
                            className="resize-none"
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

            <Separator className="my-4" />

            {/* Narrative & Risks */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Investment Thesis</h3>
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="narrative"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Investment Narrative</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Overall investment thesis, why this stock is a good buy..."
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
                      <FormLabel>Risks & Concerns</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Potential risks, downside scenarios, and what to watch for..."
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Chart Images */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Chart Images</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dailyChartImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Chart Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/daily-chart.png"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to the daily chart image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weeklyChartImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Chart Image URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com/weekly-chart.png"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL to the weekly chart image
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="mainChartType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Main Chart Display Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="daily" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Daily Chart
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="weekly" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Weekly Chart
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormDescription>
                      Which chart should be displayed as the main chart on the alert page?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="my-4" />

            {/* Tags */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tags & Categorization</h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <FormLabel>Tags</FormLabel>
                  <FormDescription>Add tags to categorize this stock pick</FormDescription>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.getValues("tags")?.map((tag, i) => (
                      <div key={i} className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1">
                        <span>{tag}</span>
                        <button
                          type="button"
                          className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                          onClick={() => removeTag(tag)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add a tag..."
                      className="mr-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" onClick={addTag}>Add</Button>
                  </div>
                </div>

                {/* Confluences */}
                <div>
                  <FormLabel>Confluences</FormLabel>
                  <FormDescription>Key supporting factors for this stock pick</FormDescription>
                  <div className="flex flex-col gap-2 mt-2">
                    {form.getValues("confluences")?.map((confluence, i) => (
                      <div key={i} className="flex items-center bg-secondary text-secondary-foreground rounded-lg px-3 py-2">
                        <span>{confluence}</span>
                        <button
                          type="button"
                          className="ml-auto text-secondary-foreground/70 hover:text-secondary-foreground"
                          onClick={() => removeConfluence(confluence)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <Input
                      value={confluenceInput}
                      onChange={(e) => setConfluenceInput(e.target.value)}
                      placeholder="Add a confluence factor..."
                      className="mr-2"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addConfluence();
                        }
                      }}
                    />
                    <Button type="button" onClick={addConfluence}>Add</Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Technical Reasons */}
            <div>
              <FormField
                control={form.control}
                name="technicalReasons"
                render={() => (
                  <FormItem>
                    <div className="mb-2">
                      <FormLabel>Technical Reasons</FormLabel>
                      <FormDescription>
                        Select the technical indicators supporting this stock pick
                      </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {technicalReasons?.map((reason) => (
                        <FormField
                          key={reason.id}
                          control={form.control}
                          name="technicalReasons"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={reason.id}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(reason.name)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, reason.name])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== reason.name
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  {reason.name}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full md:w-auto"
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
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
