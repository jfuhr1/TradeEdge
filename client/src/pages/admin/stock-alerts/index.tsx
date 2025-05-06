import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, TrendingUp, Target, PieChart, CheckCircle2, CheckCircle, XCircle, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "@/components/admin/AdminLayout";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  const [selectedAlertId, setSelectedAlertId] = useState<number | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  
  // Fetch all stock alerts for analytics with demo mode
  const { data: allAlerts, isLoading: isLoadingAlerts } = useQuery({
    queryKey: ["/api/stock-alerts?demo=true"],
    staleTime: 60000, // 1 minute
    retry: 1,
  });
  
  // Fetch pending approval alerts
  const { data: pendingAlerts = [], isLoading: isLoadingPending } = useQuery({
    queryKey: ["/api/admin/stock-alerts/pending"],
    enabled: hasPermission("canEditAlerts"),
    staleTime: 60000, // 1 minute
  });
  
  // Approve stock alert mutation
  const approveMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: number, notes: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/admin/stock-alerts/${alertId}/approve`, 
        { notes }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert approved",
        description: "The stock alert has been successfully approved and is now visible to users.",
        variant: "success",
      });
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-alerts/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-alerts"] });
      
      // Reset state
      setApprovalNotes("");
      setSelectedAlertId(null);
      setShowApproveDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Approval failed",
        description: error.message || "There was an error approving the alert.",
        variant: "destructive",
      });
    },
  });
  
  // Reject stock alert mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ alertId, notes }: { alertId: number, notes: string }) => {
      const response = await apiRequest(
        "POST", 
        `/api/admin/stock-alerts/${alertId}/reject`, 
        { notes }
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert rejected",
        description: "The stock alert has been rejected.",
        variant: "default",
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stock-alerts/pending"] });
      
      // Reset state
      setApprovalNotes("");
      setSelectedAlertId(null);
      setShowRejectDialog(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection failed",
        description: error.message || "There was an error rejecting the alert.",
        variant: "destructive",
      });
    },
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
        {/* Approve Alert Dialog */}
        <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Approve Stock Alert</DialogTitle>
              <DialogDescription>
                The alert will be visible to members after approval. 
                Add any notes about your approval decision.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="approvalNotes">Approval Notes (Optional)</Label>
                <Textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add any notes or comments for this approval"
                  className="min-h-[100px]"
                />
              </div>
            </div>
            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button 
                variant="outline" 
                onClick={() => setShowApproveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedAlertId) {
                    approveMutation.mutate({
                      alertId: selectedAlertId,
                      notes: approvalNotes
                    });
                  }
                }}
                disabled={approveMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {approveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  <>Approve Alert</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Alert Dialog */}
        <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Reject Stock Alert</DialogTitle>
              <DialogDescription>
                Please provide feedback about why this alert is being rejected.
                This will be sent to the submitter.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="rejectionNotes">Rejection Reason <span className="text-red-500">*</span></Label>
                <Textarea
                  id="rejectionNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Explain why this alert is being rejected"
                  className="min-h-[100px]"
                  required
                />
              </div>
            </div>
            <DialogFooter className="flex space-x-2 sm:space-x-0">
              <Button 
                variant="outline" 
                onClick={() => setShowRejectDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedAlertId && approvalNotes.trim()) {
                    rejectMutation.mutate({
                      alertId: selectedAlertId,
                      notes: approvalNotes
                    });
                  } else {
                    toast({
                      title: "Rejection reason required",
                      description: "Please provide a reason for rejecting this alert",
                      variant: "destructive",
                    });
                  }
                }}
                disabled={rejectMutation.isPending}
                variant="destructive"
              >
                {rejectMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  <>Reject Alert</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Stock Alerts Management</h1>
            <p className="text-muted-foreground">
              Create and analyze stock alerts for members
            </p>
          </div>
          {canCreateAlerts && (
            <Button asChild>
              <Link to="/admin/stock-alerts/create">Create New Alert</Link>
            </Button>
          )}
        </div>

        <Tabs 
          defaultValue="analytics" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="active">Active Alerts</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
            {canEditAlerts && (
              <TabsTrigger value="pending" className="relative">
                Pending Approval
                {Array.isArray(pendingAlerts) && pendingAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {pendingAlerts.length}
                  </span>
                )}
              </TabsTrigger>
            )}
          </TabsList>

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
          
          {/* Active Alerts Tab */}
          <TabsContent value="active">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Published Alerts</h2>
                {canCreateAlerts && (
                  <Button asChild>
                    <Link to="/admin/stock-alerts/create">Create New Alert</Link>
                  </Button>
                )}
              </div>
              
              {alertsArray.filter(alert => !alert.isDraft).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg text-center text-muted-foreground">No published alerts found</p>
                    {canCreateAlerts && (
                      <Button className="mt-4" asChild>
                        <Link to="/admin/stock-alerts/create">Create your first alert</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alertsArray
                    .filter(alert => !alert.isDraft)
                    .map((alert) => (
                      <Card key={alert.id} className="overflow-hidden">
                        <div className="relative">
                          <img 
                            src={alert.dailyChartImageUrl || "https://via.placeholder.com/400x200"} 
                            alt={`${alert.symbol} chart`}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-0 right-0 bg-background/80 p-2 m-2 rounded-md">
                            <span className={`text-sm font-medium ${
                              alert.status === "active" ? "text-green-500" : 
                              alert.status === "closed" ? "text-amber-500" : 
                              "text-red-500"
                            }`}>
                              {alert.status?.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">{alert.symbol}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${
                              alert.requiredTier === "free" ? "bg-green-100 text-green-800" :
                              alert.requiredTier === "paid" ? "bg-blue-100 text-blue-800" :
                              alert.requiredTier === "premium" ? "bg-purple-100 text-purple-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {alert.requiredTier?.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-4 truncate">{alert.companyName}</p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Buy Zone</p>
                              <p className="text-sm font-medium">${alert.buyZoneMin?.toFixed(2)} - ${alert.buyZoneMax?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Current</p>
                              <p className="text-sm font-medium">${alert.currentPrice?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Target 1</p>
                              <p className="text-sm font-medium">${alert.target1?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Target 3</p>
                              <p className="text-sm font-medium">${alert.target3?.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {canEditAlerts && (
                            <div className="flex space-x-2 mt-2">
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link to={`/admin/stock-alerts/edit/${alert.id}`}>Edit</Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link to={`/admin/stock-alerts/${alert.id}`}>View</Link>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Drafts Tab */}
          <TabsContent value="drafts">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Draft Alerts</h2>
                {canCreateAlerts && (
                  <Button asChild>
                    <Link to="/admin/stock-alerts/create">Create New Draft</Link>
                  </Button>
                )}
              </div>
              
              {alertsArray.filter(alert => alert.isDraft).length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center p-6">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg text-center text-muted-foreground">No draft alerts found</p>
                    {canCreateAlerts && (
                      <Button className="mt-4" asChild>
                        <Link to="/admin/stock-alerts/create">Create your first draft</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alertsArray
                    .filter(alert => alert.isDraft)
                    .map((alert) => (
                      <Card key={alert.id} className="overflow-hidden">
                        <div className="relative">
                          <img 
                            src={alert.dailyChartImageUrl || "https://via.placeholder.com/400x200"} 
                            alt={`${alert.symbol} chart`}
                            className="w-full h-48 object-cover"
                          />
                          <div className="absolute top-0 right-0 bg-background/80 p-2 m-2 rounded-md">
                            <span className="text-sm font-medium text-amber-500">DRAFT</span>
                          </div>
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-bold">{alert.symbol}</h3>
                            <span className={`px-2 py-1 rounded text-xs ${
                              alert.requiredTier === "free" ? "bg-green-100 text-green-800" :
                              alert.requiredTier === "paid" ? "bg-blue-100 text-blue-800" :
                              alert.requiredTier === "premium" ? "bg-purple-100 text-purple-800" :
                              "bg-amber-100 text-amber-800"
                            }`}>
                              {alert.requiredTier?.toUpperCase()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-4 truncate">{alert.companyName}</p>
                          
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Buy Zone</p>
                              <p className="text-sm font-medium">${alert.buyZoneMin?.toFixed(2)} - ${alert.buyZoneMax?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Current</p>
                              <p className="text-sm font-medium">${alert.currentPrice?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Target 1</p>
                              <p className="text-sm font-medium">${alert.target1?.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Target 3</p>
                              <p className="text-sm font-medium">${alert.target3?.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          {canEditAlerts && (
                            <div className="flex space-x-2 mt-2">
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link to={`/admin/stock-alerts/preview?id=${alert.id}&draft=true`}>Preview</Link>
                              </Button>
                              <Button variant="outline" size="sm" asChild className="flex-1">
                                <Link to={`/admin/stock-alerts/edit/${alert.id}`}>Edit</Link>
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Pending Approvals Tab */}
          {canEditAlerts && (
            <TabsContent value="pending">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">Pending Approval Alerts</h2>
                </div>
                
                {isLoadingPending ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : pendingAlerts.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center p-6">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                      <p className="text-lg text-center text-muted-foreground">No pending alerts waiting for approval</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {pendingAlerts.map((alert: any) => (
                      <Card key={alert.id} className="overflow-hidden">
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row gap-4">
                            <div className="relative flex-1">
                              <img 
                                src={alert.dailyChartImageUrl || "https://via.placeholder.com/400x200"} 
                                alt={`${alert.symbol} chart`}
                                className="w-full h-48 object-cover rounded-md"
                              />
                              <div className="absolute top-0 right-0 bg-background/80 p-2 m-2 rounded-md">
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                  PENDING
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-2">
                                <div>
                                  <h3 className="text-xl font-bold">{alert.symbol}</h3>
                                  <p className="text-sm text-muted-foreground mb-1">{alert.companyName}</p>
                                </div>
                                <span className={`px-2 py-1 rounded text-xs ${
                                  alert.requiredTier === "free" ? "bg-green-100 text-green-800" :
                                  alert.requiredTier === "paid" ? "bg-blue-100 text-blue-800" :
                                  alert.requiredTier === "premium" ? "bg-purple-100 text-purple-800" :
                                  "bg-amber-100 text-amber-800"
                                }`}>
                                  {alert.requiredTier?.toUpperCase()}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                  <p className="text-xs text-muted-foreground">Buy Zone</p>
                                  <p className="text-sm font-medium">${alert.buyZoneMin?.toFixed(2)} - ${alert.buyZoneMax?.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Current</p>
                                  <p className="text-sm font-medium">${alert.currentPrice?.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Target 1</p>
                                  <p className="text-sm font-medium">${alert.target1?.toFixed(2)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Target 3</p>
                                  <p className="text-sm font-medium">${alert.target3?.toFixed(2)}</p>
                                </div>
                              </div>
                              
                              <p className="text-xs text-muted-foreground mb-1">Submitted by</p>
                              <p className="text-sm mb-4">{alert.submittedBy || "Unknown"}</p>
                              
                              <div className="flex space-x-2">
                                <Button variant="outline" size="sm" asChild className="flex-1">
                                  <Link to={`/admin/stock-alerts/preview?id=${alert.id}`}>
                                    <Eye className="mr-2 h-4 w-4" /> Preview
                                  </Link>
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 bg-green-100 hover:bg-green-200 text-green-800 border-green-300"
                                  onClick={() => {
                                    setSelectedAlertId(alert.id);
                                    setShowApproveDialog(true);
                                  }}
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 border-red-300"
                                  onClick={() => {
                                    setSelectedAlertId(alert.id);
                                    setShowRejectDialog(true);
                                  }}
                                >
                                  <XCircle className="mr-2 h-4 w-4" /> Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
          
        </Tabs>
      </div>
    </AdminLayout>
  );
}