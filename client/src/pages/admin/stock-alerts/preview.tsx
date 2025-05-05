import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { 
  ArrowLeft, Edit, Check, X, AlertTriangle, 
  ChevronDown, ChevronUp, Layers, Tag, 
  Clock, Percent, Target, DollarSign
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import AdminLayout from "@/components/admin/AdminLayout";

export default function StockAlertPreviewPage() {
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const { hasPermission } = useAdminPermissions();
  const canCreateAlerts = hasPermission("canCreateAlerts");
  const canEditAlerts = hasPermission("canEditAlerts");
  
  // Get alert ID from URL params
  const searchParams = new URLSearchParams(window.location.search);
  const alertId = searchParams.get("id");
  const draftMode = searchParams.get("draft") === "true";
  
  // Get alert data
  const { data: alert, isLoading, error } = useQuery({
    queryKey: [`/api/stock-alerts/${alertId}?demo=true`],
    enabled: !!alertId,
    staleTime: 30000,
  });
  
  // Publish alert mutation
  const publishAlert = useMutation({
    mutationFn: async () => {
      if (!alertId) throw new Error("Alert ID is required");
      
      const res = await apiRequest(
        "PATCH", 
        `/api/stock-alerts/${alertId}/publish?demo=true`, 
        { isDraft: false }
      );
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to publish alert");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Published",
        description: "The stock alert has been published successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-alerts"] });
      navigate("/admin/stock-alerts");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to publish alert",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle publish click
  const handlePublish = () => {
    publishAlert.mutate();
  };

  // Navigate back to edit
  const handleEdit = () => {
    navigate(`/admin/stock-alerts/edit?id=${alertId}`);
  };
  
  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price);
  };
  
  // Calculate percentage difference
  const calculatePercentage = (current: number, target: number) => {
    return ((target - current) / current * 100).toFixed(2);
  };
  
  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Stock Alert Preview</h1>
            <Button variant="outline" asChild><Link to="/admin/stock-alerts">Back to Alerts</Link></Button>
          </div>
          <Card>
            <CardContent className="py-10">
              <div className="flex items-center justify-center">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  // Error state
  if (error || !alert) {
    return (
      <AdminLayout>
        <div className="container mx-auto py-6 px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Stock Alert Preview</h1>
            <Button variant="outline" asChild><Link to="/admin/stock-alerts">Back to Alerts</Link></Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-destructive">Error Loading Alert</CardTitle>
              <CardDescription>
                There was a problem loading this stock alert. Please try again or contact support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" asChild><Link to="/admin/stock-alerts">Back to Alerts</Link></Button>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }
  
  // Calculate if price is in buy zone
  const isInBuyZone = alert.currentPrice >= alert.buyZoneMin && alert.currentPrice <= alert.buyZoneMax;
  
  // Calculate percentage to targets
  const percentToTarget1 = calculatePercentage(alert.currentPrice, alert.target1);
  const percentToTarget2 = calculatePercentage(alert.currentPrice, alert.target2);
  const percentToTarget3 = calculatePercentage(alert.currentPrice, alert.target3);
  
  // Determine active tab based on mainChartType
  const activeTab = alert.mainChartType || "daily";
  
  return (
    <AdminLayout>
      <div className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" asChild>
              <Link to="/admin/stock-alerts">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-2xl font-bold">Stock Alert Preview</h1>
            {draftMode && (
              <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleEdit} disabled={!canEditAlerts}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handlePublish} disabled={!canCreateAlerts || publishAlert.isPending}>
              {publishAlert.isPending ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Publish Alert
                </>
              )}
            </Button>
          </div>
        </div>
        
        {/* Main Alert Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Alert Header */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-3xl font-bold">{alert.symbol}</h2>
                      <Badge className="h-6">{isInBuyZone ? "In Buy Zone" : "Monitoring"}</Badge>
                    </div>
                    <p className="text-lg font-medium text-muted-foreground">{alert.companyName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">{formatPrice(alert.currentPrice)}</p>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {alert.tags?.map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Buy Zone</p>
                    <p className="font-mono font-medium">
                      {formatPrice(alert.buyZoneMin)} - {formatPrice(alert.buyZoneMax)}
                    </p>
                  </div>
                  
                  <div className="p-3 border rounded-md bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Required Tier</p>
                    <p className="font-medium capitalize">{alert.requiredTier || "Free"}</p>
                  </div>
                  
                  <div className="p-3 border rounded-md">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <p className="font-medium capitalize">
                      {alert.status || "Active"}
                    </p>
                  </div>
                </div>
                
                {alert.narrative && (
                  <div className="mb-4">
                    <h3 className="text-md font-medium mb-2">Analysis</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{alert.narrative}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Charts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Charts</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={activeTab}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="daily">Daily Chart</TabsTrigger>
                    <TabsTrigger value="weekly">Weekly Chart</TabsTrigger>
                  </TabsList>
                  <TabsContent value="daily" className="mt-0">
                    {alert.dailyChartImageUrl ? (
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={alert.dailyChartImageUrl} 
                          alt={`${alert.symbol} Daily Chart`} 
                          className="w-full max-h-[500px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-[300px] border rounded-md flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No daily chart available</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="weekly" className="mt-0">
                    {alert.weeklyChartImageUrl ? (
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={alert.weeklyChartImageUrl} 
                          alt={`${alert.symbol} Weekly Chart`} 
                          className="w-full max-h-[500px] object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-[300px] border rounded-md flex items-center justify-center">
                        <p className="text-sm text-muted-foreground">No weekly chart available</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column - Targets & Info */}
          <div className="space-y-6">
            {/* Targets Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Price Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Target 1 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 font-medium">Target 1</Badge>
                      <span className="font-mono font-medium">{formatPrice(alert.target1)}</span>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">+{percentToTarget1}%</span>
                  </div>
                  <Progress value={10} className="h-1.5" />
                  {alert.target1Reasoning && (
                    <p className="text-xs text-muted-foreground">{alert.target1Reasoning}</p>
                  )}
                </div>
                
                {/* Target 2 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 font-medium">Target 2</Badge>
                      <span className="font-mono font-medium">{formatPrice(alert.target2)}</span>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">+{percentToTarget2}%</span>
                  </div>
                  <Progress value={6} className="h-1.5" />
                  {alert.target2Reasoning && (
                    <p className="text-xs text-muted-foreground">{alert.target2Reasoning}</p>
                  )}
                </div>
                
                {/* Target 3 */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="h-6 font-medium">Target 3</Badge>
                      <span className="font-mono font-medium">{formatPrice(alert.target3)}</span>
                    </div>
                    <span className="text-sm font-medium text-emerald-600">+{percentToTarget3}%</span>
                  </div>
                  <Progress value={3} className="h-1.5" />
                  {alert.target3Reasoning && (
                    <p className="text-xs text-muted-foreground">{alert.target3Reasoning}</p>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Confluences */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Confluences</CardTitle>
              </CardHeader>
              <CardContent>
                {alert.confluences && alert.confluences.length > 0 ? (
                  <div className="space-y-2">
                    {alert.confluences.map((confluence: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-primary mt-0.5" />
                        <span className="text-sm">{confluence}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No confluences specified</p>
                )}
              </CardContent>
            </Card>
            
            {/* Technical Reasons */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Technical Reasons</CardTitle>
              </CardHeader>
              <CardContent>
                {alert.technicalReasons && alert.technicalReasons.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {alert.technicalReasons.map((reason: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {reason}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No technical reasons specified</p>
                )}
              </CardContent>
            </Card>
            
            {/* Known Risks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Known Risks</CardTitle>
              </CardHeader>
              <CardContent>
                {alert.risks && alert.risks.length > 0 ? (
                  <div className="space-y-2">
                    {alert.risks.map((risk: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <span className="text-sm">{risk}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No known risks specified</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Action Footer */}
        <div className="flex justify-between items-center border-t pt-6">
          <Button variant="outline" asChild>
            <Link to="/admin/stock-alerts">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Alerts
            </Link>
          </Button>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleEdit} disabled={!canEditAlerts}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button onClick={handlePublish} disabled={!canCreateAlerts || publishAlert.isPending}>
              {publishAlert.isPending ? (
                <>
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Publishing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Publish Alert
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}