import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertTriangle, TrendingUp, Target, CheckCircle2, PieChart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import AdminLayout from "@/components/admin/AdminLayout";
import { insertStockAlertSchema } from "@shared/schema";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import StockAlertForm from "@/components/forms/stock-alert-form";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Custom schema for stock alert creation with improved validation
const createAlertSchema = insertStockAlertSchema.extend({
  symbol: z.string().min(1, "Symbol is required").max(5, "Symbol should be 5 characters or less").toUpperCase(),
  companyName: z.string().min(1, "Company name is required"),
  currentPrice: z.coerce.number().positive("Price must be positive"),
  buyZoneMin: z.coerce.number().positive("Min buy zone must be positive"),
  buyZoneMax: z.coerce.number().positive("Max buy zone must be positive"),
  target1: z.coerce.number().positive("Target 1 must be positive"),
  target2: z.coerce.number().positive("Target 2 must be positive"),
  target3: z.coerce.number().positive("Target 3 must be positive"),
  technicalReasons: z.array(z.string()).min(1, "At least one technical reason is required"),
  mainChartType: z.enum(["daily", "weekly"]),
  requiredTier: z.enum(["free", "paid", "premium", "mentorship"]),
  status: z.enum(["active", "closed", "cancelled"]).default("active"),
}).refine(data => data.buyZoneMax > data.buyZoneMin, {
  message: "Buy zone max must be greater than buy zone min",
  path: ["buyZoneMax"]
}).refine(data => data.target1 > data.buyZoneMax, {
  message: "Target 1 must be greater than buy zone max",
  path: ["target1"]
}).refine(data => data.target2 > data.target1, {
  message: "Target 2 must be greater than target 1",
  path: ["target2"]
}).refine(data => data.target3 > data.target2, {
  message: "Target 3 must be greater than target 2",
  path: ["target3"]
});

type CreateAlertValues = z.infer<typeof createAlertSchema>;

export default function AdminStockAlertsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [techReason, setTechReason] = useState("");
  const [activeTab, setActiveTab] = useState("new");
  
  // Fetch all stock alerts for analytics
  const { data: allAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["/api/stock-alerts"],
  });
  
  // Ensure allAlerts is an array before using array methods
  const alertsArray = Array.isArray(allAlerts) ? allAlerts : [];
  
  const canCreateAlerts = hasPermission("canCreateAlerts");
  const canEditAlerts = hasPermission("canEditAlerts");
  
  // Form for creating a new stock alert
  const form = useForm<CreateAlertValues>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: {
      symbol: "",
      companyName: "",
      currentPrice: 0,
      buyZoneMin: 0,
      buyZoneMax: 0,
      target1: 0,
      target2: 0,
      target3: 0,
      technicalReasons: [],
      mainChartType: "daily",
      requiredTier: "free",
      status: "active",
    }
  });

  // Create a new stock alert mutation
  const createAlertMutation = useMutation({
    mutationFn: async (values: CreateAlertValues) => {
      const response = await apiRequest("POST", "/api/stock-alerts", values);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create stock alert");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stock-alerts"] });
      toast({
        title: "Stock Alert Created",
        description: "New stock alert has been created successfully.",
      });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Alert",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add a technical reason to the list
  const addTechnicalReason = () => {
    if (!techReason.trim()) return;
    
    const currentReasons = form.getValues("technicalReasons") || [];
    if (!currentReasons.includes(techReason)) {
      form.setValue("technicalReasons", [...currentReasons, techReason]);
      setTechReason("");
    }
  };

  // Remove a technical reason from the list
  const removeTechnicalReason = (reason: string) => {
    const currentReasons = form.getValues("technicalReasons") || [];
    form.setValue("technicalReasons", currentReasons.filter(r => r !== reason));
  };

  // Handle form submission
  const onSubmit = (values: CreateAlertValues) => {
    if (!hasPermission("canCreateAlerts")) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to create alerts.",
        variant: "destructive",
      });
      return;
    }
    
    createAlertMutation.mutate(values);
  };

  // Prepare chart data for analytics
  const prepareChartData = () => {
    // Using the alertsArray from component level
    
    if (alertsArray.length === 0) {
      return {
        labels: [],
        tierData: { labels: [], data: [] },
        statusData: { labels: [], data: [] },
        performanceData: { labels: [], datasets: [] },
        buyZoneDistribution: { labels: [], datasets: [] }
      };
    }

    // Get labels (stock symbols)
    const labels = alertsArray.map((alert: any) => alert.symbol);
    
    // Tier distribution
    const tierCounts: Record<string, number> = {
      free: 0,
      paid: 0,
      premium: 0,
      mentorship: 0
    };
    
    alertsArray.forEach((alert: any) => {
      const tier = alert.requiredTier || "free";
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
    });
    
    // Status distribution
    const statusCounts: Record<string, number> = {
      active: 0,
      closed: 0,
      cancelled: 0
    };
    
    alertsArray.forEach((alert: any) => {
      const status = alert.status || "active";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Performance data (current price vs targets)
    const performanceData = {
      labels,
      datasets: [
        {
          label: 'Current Price',
          data: alertsArray.map((alert: any) => alert.currentPrice),
          borderColor: 'rgba(53, 162, 235, 0.8)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
        },
        {
          label: 'Target 1',
          data: alertsArray.map((alert: any) => alert.target1),
          borderColor: 'rgba(75, 192, 192, 0.8)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
        },
        {
          label: 'Target 3',
          data: alertsArray.map((alert: any) => alert.target3),
          borderColor: 'rgba(255, 159, 64, 0.8)',
          backgroundColor: 'rgba(255, 159, 64, 0.5)',
        }
      ]
    };

    // Buy zone distribution
    const buyZoneData = {
      labels,
      datasets: [
        {
          label: 'Buy Zone Range',
          data: alertsArray.map((alert: any) => alert.buyZoneMax - alert.buyZoneMin),
          backgroundColor: 'rgba(153, 102, 255, 0.6)',
        }
      ]
    };

    return {
      labels,
      tierData: {
        labels: Object.keys(tierCounts),
        data: Object.values(tierCounts),
      },
      statusData: {
        labels: Object.keys(statusCounts),
        data: Object.values(statusCounts),
      },
      performanceData,
      buyZoneDistribution: buyZoneData
    };
  };

  const chartData = prepareChartData();

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      title: {
        display: true,
        text: 'Distribution',
      },
    },
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Price vs Targets',
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Buy Zone Range',
      },
    },
  };

  const tierChartData = {
    labels: chartData.tierData.labels,
    datasets: [
      {
        label: 'Alerts by Tier',
        data: chartData.tierData.data,
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const statusChartData = {
    labels: chartData.statusData.labels,
    datasets: [
      {
        label: 'Alerts by Status',
        data: chartData.statusData.data,
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 159, 64, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Loading state
  if (isLoadingAlerts) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Stock Alerts Management</h1>
          <p className="text-muted-foreground">
            Create and analyze stock alerts for members
          </p>
        </div>

        <Tabs 
          defaultValue="new" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="new">Create New Alert</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            {canCreateAlerts ? (
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Stock Alert</CardTitle>
                    <CardDescription>
                      Add a new stock alert to recommend to members. All fields are required.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <StockAlertForm />
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Permission Required</CardTitle>
                  <CardDescription>
                    You don't have permission to create stock alerts. Contact an administrator for access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center py-6">
                    <AlertTriangle className="h-12 w-12 text-amber-500" />
                    <p className="ml-4 text-muted-foreground">
                      Only users with stock alert creation permissions can access this feature.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">{alertsArray.length}</div>
                    <AlertTriangle className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Targets Hit</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {alertsArray.filter((a: any) => a.status === "closed").length}
                    </div>
                    <Target className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold">
                      {alertsArray.filter((a: any) => a.status === "active").length}
                    </div>
                    <TrendingUp className="h-6 w-6 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alerts by Membership Tier</CardTitle>
                  <CardDescription>
                    Distribution of alerts across membership tiers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    {chartData.tierData.data.length > 0 ? (
                      <Pie data={tierChartData} options={pieChartOptions} />
                    ) : (
                      <p className="text-muted-foreground">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alerts by Status</CardTitle>
                  <CardDescription>
                    Distribution of active, closed, and cancelled alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    {chartData.statusData.data.length > 0 ? (
                      <Pie data={statusChartData} options={pieChartOptions} />
                    ) : (
                      <p className="text-muted-foreground">No data available</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Tracking</CardTitle>
                  <CardDescription>
                    Current prices against targets for all active alerts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {chartData.performanceData.labels.length > 0 ? (
                      <Line 
                        data={chartData.performanceData} 
                        options={lineChartOptions} 
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Buy Zone Ranges</CardTitle>
                  <CardDescription>
                    Width of buy zones for each stock
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    {chartData.buyZoneDistribution.labels.length > 0 ? (
                      <Bar 
                        data={chartData.buyZoneDistribution} 
                        options={barChartOptions} 
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">No data available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}