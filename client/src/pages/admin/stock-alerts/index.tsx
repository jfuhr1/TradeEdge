import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, AlertTriangle, TrendingUp, Target, PieChart, CheckCircle2 } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import AdminStockAlertForm from "@/components/admin/stock-alerts/AdminStockAlertForm";
import { useToast } from "@/hooks/use-toast";
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

export default function AdminStockAlertsPage() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const [activeTab, setActiveTab] = useState("new");
  
  // Fetch all stock alerts for analytics with demo mode
  const { data: allAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["/api/stock-alerts?demo=true"],
    staleTime: 60000, // 1 minute
    retry: 1,
  });
  
  // Ensure allAlerts is an array before using array methods
  const alertsArray = Array.isArray(allAlerts) ? allAlerts : [];
  
  const canCreateAlerts = hasPermission("canCreateAlerts");
  const canEditAlerts = hasPermission("canEditAlerts");

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
                    <AdminStockAlertForm
                      demoMode={true} 
                    />
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