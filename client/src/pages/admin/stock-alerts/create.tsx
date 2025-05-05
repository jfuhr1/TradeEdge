import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Loader2, X, Plus, AlertTriangle, Check, Tag, Image, Eye } from "lucide-react";
import { Link, useLocation } from "wouter";

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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileDropzone } from "@/components/ui/dropzone";
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
  supportLevel: z.number().min(0, "Support level must be greater than 0").optional(),
  technicalReasons: z.array(z.string()),
  dailyChartImageUrl: z.string().min(1, "Daily chart image is required"),
  weeklyChartImageUrl: z.string().min(1, "Weekly chart image is required"),
  mainChartType: z.enum(["daily", "weekly"]),
  narrative: z.string().optional(),
  risks: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  confluences: z.array(z.string()).default([]),
  requiredTier: z.enum(["free", "paid", "premium", "mentorship"]).default("free"),
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

// Helper function to group items by category
function groupByCategory<T extends { category: string }>(items: T[]): Record<string, T[]> {
  return items.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

export default function CreateStockAlertPage() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const canCreateAlerts = hasPermission("canCreateAlerts");
  
  const [newTagName, setNewTagName] = useState("");
  const [newRiskName, setNewRiskName] = useState("");
  const [newConfluenceName, setNewConfluenceName] = useState("");
  const [newConfluenceCategory, setNewConfluenceCategory] = useState("Price-Based");
  const [selectedConfluences, setSelectedConfluences] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch data from API
  const { data: confluencesData, isLoading: isLoadingConfluences } = useQuery({
    queryKey: ["/api/confluences?demo=true"], 
    staleTime: 60000,
  });

  const { data: tagsData, isLoading: isLoadingTags } = useQuery({
    queryKey: ["/api/tags?demo=true"], 
    staleTime: 60000,
  });

  const { data: risksData, isLoading: isLoadingRisks } = useQuery({
    queryKey: ["/api/risks?demo=true"], 
    staleTime: 60000,
  });

  const confluencesGrouped = confluencesData ? groupByCategory(confluencesData) : {};
  const confluenceCategories = confluencesData ? [...new Set(confluencesData.map(c => c.category))] : [];

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
      supportLevel: 0,
      technicalReasons: [],
      dailyChartImageUrl: "",
      weeklyChartImageUrl: "",
      mainChartType: "daily",
      narrative: "",
      risks: [],
      tags: [],
      confluences: [],
      requiredTier: "free",
    },
  });

  // Create new tag
  const createTag = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/tags?demo=true", { name });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create tag");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Tag added",
        description: `The tag "${data.name}" has been added successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tags"] });
      setNewTagName("");
      handleSelectTag(data.name); // Select the newly created tag
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add tag",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create new risk
  const createRisk = useMutation({
    mutationFn: async (name: string) => {
      const res = await apiRequest("POST", "/api/risks?demo=true", { name });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create risk");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Risk added",
        description: `The risk "${data.name}" has been added successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/risks"] });
      setNewRiskName("");
      handleSelectRisk(data.name); // Select the newly created risk
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add risk",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create new confluence
  const createConfluence = useMutation({
    mutationFn: async ({ name, category }: { name: string, category: string }) => {
      const res = await apiRequest("POST", "/api/confluences?demo=true", { name, category });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create confluence");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Confluence added",
        description: `The confluence "${data.name}" has been added successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/confluences"] });
      setNewConfluenceName("");
      handleSelectConfluence(data.name); // Select the newly created confluence
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add confluence",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create a draft stock alert for preview
  const [location, navigate] = useLocation();
  const createAlert = useMutation({
    mutationFn: async (data: StockAlertFormValues) => {
      // Set up the payload with draft status
      const payload = {
        ...data,
        chartImageUrl: data.dailyChartImageUrl, // For backward compatibility
        status: computeAlertStatus(data),
        isDraft: true, // Mark as draft initially
      };
      
      const endpoint = "/api/stock-alerts?demo=true";
      const res = await apiRequest("POST", endpoint, payload);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create stock alert preview");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Preview Ready",
        description: "Your stock alert preview is ready to review.",
      });
      
      // Navigate to the preview page with the alert ID
      navigate(`/admin/stock-alerts/preview?id=${data.id}&draft=true`);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create preview",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle selection of confluence
  const handleSelectConfluence = (name: string) => {
    if (selectedConfluences.includes(name)) {
      setSelectedConfluences(selectedConfluences.filter(c => c !== name));
    } else {
      setSelectedConfluences([...selectedConfluences, name]);
    }
  };

  // Handle selection of risk
  const handleSelectRisk = (name: string) => {
    if (selectedRisks.includes(name)) {
      setSelectedRisks(selectedRisks.filter(r => r !== name));
    } else {
      setSelectedRisks([...selectedRisks, name]);
    }
  };

  // Handle selection of tag
  const handleSelectTag = (name: string) => {
    if (selectedTags.includes(name)) {
      setSelectedTags(selectedTags.filter(t => t !== name));
    } else {
      setSelectedTags([...selectedTags, name]);
    }
  };

  // Add a new tag
  const handleAddNewTag = () => {
    if (!newTagName.trim()) return;
    createTag.mutate(newTagName.trim());
  };

  // Add a new risk
  const handleAddNewRisk = () => {
    if (!newRiskName.trim()) return;
    createRisk.mutate(newRiskName.trim());
  };

  // Add a new confluence
  const handleAddNewConfluence = () => {
    if (!newConfluenceName.trim()) return;
    createConfluence.mutate({ 
      name: newConfluenceName.trim(), 
      category: newConfluenceCategory 
    });
  };

  // Compute alert status automatically
  const computeAlertStatus = (data: StockAlertFormValues): string => {
    const { currentPrice, buyZoneMin, buyZoneMax, target3 } = data;
    
    if (currentPrice >= target3) {
      return "closed"; // If price hit the highest target, consider it closed
    } else if (currentPrice >= buyZoneMin && currentPrice <= buyZoneMax) {
      return "active"; // If price is in buy zone, the alert is active
    } else if (currentPrice < buyZoneMin) {
      return "active"; // If price below buy zone, still consider it active (it could enter)
    } else {
      return "active"; // Default to active
    }
  };

  // Update form values when selections change
  useEffect(() => {
    form.setValue("confluences", selectedConfluences);
  }, [selectedConfluences, form]);

  useEffect(() => {
    form.setValue("risks", selectedRisks);
  }, [selectedRisks, form]);

  useEffect(() => {
    form.setValue("tags", selectedTags);
  }, [selectedTags, form]);

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
          <h1 className="text-2xl font-bold tracking-tight">Create Stock Alert</h1>
          <Button variant="outline" asChild><Link to="/admin/stock-alerts">Back to Stock Alerts</Link></Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Create New Stock Alert</CardTitle>
            <CardDescription>
              Add a new stock alert to recommend to members. Fields marked with * are required.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Basic Stock Info */}
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Stock Symbol */}
                      <FormField
                        control={form.control}
                        name="symbol"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Symbol *</FormLabel>
                            <FormControl>
                              <Input placeholder="AAPL" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                    </div>
                    
                    {/* Company Name - Full Width */}
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Apple Inc." {...field} className="h-12" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Current Price */}
                    <div className="grid grid-cols-2 gap-4">
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
                                className="w-full"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="supportLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Support Level ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="165.00" 
                                {...field} 
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="w-full"
                              />
                            </FormControl>
                            <FormDescription>
                              Critical level for risk assessment
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Buy Zone */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="buyZoneMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Buy Zone Min ($) *</FormLabel>
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
                            <FormLabel>Buy Zone Max ($) *</FormLabel>
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

                    {/* Targets with Reasoning */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="target1"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target 1 ($) *</FormLabel>
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
                                <Textarea placeholder="Recent resistance level" {...field} className="min-h-[80px]" />
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
                              <FormLabel>Target 2 ($) *</FormLabel>
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
                                <Textarea placeholder="Previous all-time high" {...field} className="min-h-[80px]" />
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
                              <FormLabel>Target 3 ($) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  placeholder="210.00" 
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
                                <Textarea placeholder="Fibonacci extension" {...field} className="min-h-[80px]" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Daily & Weekly Chart Images */}
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="dailyChartImageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Daily Chart Image *</FormLabel>
                            <FormControl>
                              <FileDropzone
                                onFileAccepted={(url) => field.onChange(url)}
                                value={field.value}
                                label="Drag & drop daily chart image or click to select"
                                maxSize={5 * 1024 * 1024} // 5MB
                              />
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
                            <FormLabel>Weekly Chart Image *</FormLabel>
                            <FormControl>
                              <FileDropzone
                                onFileAccepted={(url) => field.onChange(url)}
                                value={field.value}
                                label="Drag & drop weekly chart image or click to select"
                                maxSize={5 * 1024 * 1024} // 5MB
                              />
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
                            <FormControl>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select chart to display" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="daily">Daily Chart</SelectItem>
                                  <SelectItem value="weekly">Weekly Chart</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Required Membership Tier */}
                    <FormField
                      control={form.control}
                      name="requiredTier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Required Membership Tier *</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select membership tier" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="mentorship">Mentorship</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormDescription>
                            Members with this tier or above will see this alert
                          </FormDescription>
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
                          <FormLabel>Narrative</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Why is this a good opportunity?" 
                              {...field} 
                              className="min-h-[200px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Right Column: Additional Info - removed Alert Preview Guidelines section */}
                  <div className="space-y-6">
                    {/* Intentionally left empty after removing Alert Preview Guidelines */}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 mt-6 pt-6 border-t">
                  {/* Confluences Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Confluences</h3>
                      <div className="flex items-center space-x-2">
                        <Select
                          value={newConfluenceCategory}
                          onValueChange={setNewConfluenceCategory}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Category" />
                          </SelectTrigger>
                          <SelectContent>
                            {confluenceCategories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="New confluence" 
                          value={newConfluenceName}
                          onChange={(e) => setNewConfluenceName(e.target.value)}
                          className="max-w-[180px]"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddNewConfluence} 
                          disabled={createConfluence.isPending || !newConfluenceName.trim()}
                        >
                          {createConfluence.isPending ? 
                            <Loader2 className="h-4 w-4 animate-spin" /> : 
                            <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isLoadingConfluences ? (
                      <div className="flex items-center justify-center p-4 border rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 border rounded-md p-4">
                        {confluenceCategories.map((category) => (
                          <div key={category} className="space-y-2">
                            <h4 className="text-sm font-semibold text-muted-foreground">{category}</h4>
                            <div className="flex flex-wrap gap-2">
                              {confluencesGrouped[category]?.map((confluence) => (
                                <Badge 
                                  key={confluence.id} 
                                  variant={selectedConfluences.includes(confluence.name) ? "default" : "outline"}
                                  className="cursor-pointer text-xs"
                                  onClick={() => handleSelectConfluence(confluence.name)}
                                >
                                  {selectedConfluences.includes(confluence.name) && 
                                    <Check className="h-3 w-3 mr-1" />
                                  }
                                  {confluence.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2">Selected Confluences:</h4>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                        {selectedConfluences.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No confluences selected</span>
                        ) : (
                          selectedConfluences.map((name, idx) => (
                            <Badge key={idx} variant="default" className="flex items-center gap-1">
                              {name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleSelectConfluence(name)}
                              />
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Known Risks Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Known Risks</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          placeholder="New risk" 
                          value={newRiskName}
                          onChange={(e) => setNewRiskName(e.target.value)}
                          className="max-w-[250px]"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddNewRisk} 
                          disabled={createRisk.isPending || !newRiskName.trim()}
                        >
                          {createRisk.isPending ? 
                            <Loader2 className="h-4 w-4 animate-spin" /> : 
                            <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isLoadingRisks ? (
                      <div className="flex items-center justify-center p-4 border rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 border rounded-md p-4 max-h-[150px] overflow-y-auto">
                        {risksData?.map((risk) => (
                          <Badge 
                            key={risk.id} 
                            variant={selectedRisks.includes(risk.name) ? "destructive" : "outline"}
                            className="cursor-pointer flex items-center gap-1"
                            onClick={() => handleSelectRisk(risk.name)}
                          >
                            {selectedRisks.includes(risk.name) && 
                              <Check className="h-3 w-3" />
                            }
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {risk.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Selected Risks:</h4>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                        {selectedRisks.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No risks selected</span>
                        ) : (
                          selectedRisks.map((name, idx) => (
                            <Badge key={idx} variant="destructive" className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              {name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleSelectRisk(name)}
                              />
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Tags Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Tags</h3>
                      <div className="flex items-center space-x-2">
                        <Input 
                          placeholder="New tag" 
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                          className="max-w-[250px]"
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddNewTag} 
                          disabled={createTag.isPending || !newTagName.trim()}
                        >
                          {createTag.isPending ? 
                            <Loader2 className="h-4 w-4 animate-spin" /> : 
                            <Plus className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    {isLoadingTags ? (
                      <div className="flex items-center justify-center p-4 border rounded-md">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 border rounded-md p-4 max-h-[150px] overflow-y-auto">
                        {tagsData?.map((tag) => (
                          <Badge 
                            key={tag.id} 
                            variant={selectedTags.includes(tag.name) ? "secondary" : "outline"}
                            className="cursor-pointer flex items-center gap-1"
                            onClick={() => handleSelectTag(tag.name)}
                          >
                            {selectedTags.includes(tag.name) && 
                              <Check className="h-3 w-3" />
                            }
                            <Tag className="h-3 w-3 mr-1" />
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Selected Tags:</h4>
                      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[40px]">
                        {selectedTags.length === 0 ? (
                          <span className="text-sm text-muted-foreground">No tags selected</span>
                        ) : (
                          selectedTags.map((name, idx) => (
                            <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                              <Tag className="h-3 w-3" />
                              {name}
                              <X 
                                className="h-3 w-3 cursor-pointer" 
                                onClick={() => handleSelectTag(name)}
                              />
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 mt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setSelectedConfluences([]);
                      setSelectedRisks([]);
                      setSelectedTags([]);
                    }}
                  >
                    Reset
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createAlert.isPending}
                    className="min-w-[120px]"
                  >
                    {createAlert.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Preview...
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Alert
                      </>
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