import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Link } from "wouter";
import { Loader2, ArrowLeft, Check, X, Edit, AlertTriangle, Plus } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import AdminLayout from "@/components/admin/AdminLayout";

export default function StockAlertPreviewPage() {
  const { toast } = useToast();
  const { hasPermission } = useAdminPermissions();
  const canCreateAlerts = hasPermission("canCreateAlerts");
  const canEditAlerts = hasPermission("canEditAlerts");
  
  const [location, navigate] = useLocation();
  const params = new URLSearchParams(location.split("?")[1]);
  const alertId = parseInt(params.get("id") || "0");
  // Get initial draft status from URL, but will use actual status from data when available
  const initialIsDraft = params.get("draft") === "true";
  
  // Fetch the stock alert data
  const { data: stockAlert, isLoading, error } = useQuery({
    queryKey: [`/api/stock-alerts/${alertId}?demo=true`],
    enabled: alertId > 0,
    staleTime: 10000,
    retry: 2, // Retry twice for better resilience
    retryDelay: 1000, // Wait 1 second between retries
    refetchOnWindowFocus: false, // Prevent unnecessary refetches
    refetchOnMount: true, // Always refetch when component mounts
  });
  
  // Publish the alert (mark as not draft)
  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("PATCH", `/api/stock-alerts/${alertId}/publish?demo=true`, {
        isDraft: false,
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to publish stock alert");
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Stock Alert Published",
        description: "The stock alert has been published and is now visible to members.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stock-alerts"] });
      navigate("/admin/stock-alerts");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to publish",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  if (!canCreateAlerts) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Stock Alert Preview</h1>
          <Card>
            <CardHeader>
              <CardTitle>Permission Required</CardTitle>
              <CardDescription>
                You don't have permission to preview stock alerts. Contact an administrator for access.
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
  
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Loading preview...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  // Effect to attempt automatic recovery of missing alerts
  useEffect(() => {
    // If there's an error and this was a draft, try to fetch from storage
    if (error && initialIsDraft && alertId > 0) {
      console.log('Attempting to recover alert from database storage...');

      // Retry loading the alert with a direct database query parameter
      const fetchAlertFromDatabase = async () => {
        try {
          const res = await apiRequest('GET', `/api/stock-alerts/${alertId}?demo=true&forceDatabase=true`);
          if (res.ok) {
            const data = await res.json();
            // Manually update the React Query cache with the recovered data
            queryClient.setQueryData([`/api/stock-alerts/${alertId}?demo=true`], data);
            console.log('Successfully recovered alert from database:', data);
            toast({
              title: "Alert Recovered",
              description: "Successfully retrieved alert data from database storage.",
            });
          }
        } catch (err) {
          console.error('Failed to recover alert from database:', err);
        }
      };
      
      fetchAlertFromDatabase();
    }
  }, [error, initialIsDraft, alertId]);
  
  if (error || !stockAlert) {
    const isServerError = error instanceof Error && (error as any)?.canRecover;
    
    // Handler for recovering a draft alert
    const handleRecoverDraft = () => {
      // Redirect to the dedicated recovery page
      navigate("/admin/stock-alerts/recover-draft");
    };
    
    // Handler to retry loading from database
    const handleRetryFromDatabase = async () => {
      try {
        toast({
          title: "Retrying...",
          description: "Attempting to retrieve alert data from database storage.",
        });
        
        // Make a direct request to the database-specific endpoint
        const res = await apiRequest('GET', `/api/stock-alerts/${alertId}?demo=true&forceDatabase=true`);
        if (res.ok) {
          const data = await res.json();
          // Manually update the React Query cache
          queryClient.setQueryData([`/api/stock-alerts/${alertId}?demo=true`], data);
          
          toast({
            title: "Success",
            description: "Alert data retrieved successfully.",
          });
        } else {
          toast({
            title: "Failed",
            description: "Could not retrieve alert data from database.",
            variant: "destructive",
          });
        }
      } catch (err) {
        toast({
          title: "Error",
          description: "An unexpected error occurred during recovery.",
          variant: "destructive",
        });
      }
    };
    
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold tracking-tight mb-4">Stock Alert Preview</h1>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load stock alert preview. The alert may not exist or there was an error.
              {initialIsDraft && (
                <p className="mt-2">
                  This could happen if the server was restarted, as draft alerts are stored in memory.
                  You can recover a blank draft alert, create a new one, or try to retrieve it from the database.
                </p>
              )}
            </AlertDescription>
          </Alert>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button variant="outline" asChild><Link to="/admin/stock-alerts">Back to Stock Alerts</Link></Button>
            {canCreateAlerts && (
              <>
                <Button asChild>
                  <Link to="/admin/stock-alerts/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Alert
                  </Link>
                </Button>
                {initialIsDraft && (
                  <>
                    <Button variant="secondary" onClick={handleRecoverDraft}>
                      <X className="mr-2 h-4 w-4" />
                      Recover Draft
                    </Button>
                    <Button variant="outline" onClick={handleRetryFromDatabase}>
                      <Loader2 className="mr-2 h-4 w-4" />
                      Retry from Database
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Preview Stock Alert</h1>
            <p className="text-muted-foreground mt-1">
              Review how this alert will appear to members before publishing.
            </p>
          </div>
          <div className="flex space-x-2 mt-2 md:mt-0">
            <Button variant="outline" asChild>
              <Link to="/admin/stock-alerts">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Link>
            </Button>
            {stockAlert.isDraft && canEditAlerts && (
              <Button variant="outline" asChild>
                <Link to={`/admin/stock-alerts/edit/${alertId}`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Draft
                </Link>
              </Button>
            )}
          </div>
        </div>
        
        {stockAlert.isDraft && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Draft Alert</AlertTitle>
            <AlertDescription>
              This is a preview of your stock alert. It will not be visible to members until you publish it.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main alert info - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant={stockAlert.currentPrice >= stockAlert.buyZoneMax ? "destructive" : "success"} className="mb-2">
                      {stockAlert.currentPrice >= stockAlert.buyZoneMax 
                        ? "Above Buy Zone" 
                        : stockAlert.currentPrice >= stockAlert.buyZoneMin 
                          ? "In Buy Zone" 
                          : "Below Buy Zone"}
                    </Badge>
                    <CardTitle className="text-2xl flex items-center">
                      {stockAlert.symbol} - {stockAlert.companyName}
                    </CardTitle>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">${stockAlert.currentPrice ? stockAlert.currentPrice.toFixed(2) : 'N/A'}</div>
                    <div className={`text-sm font-medium ${parseFloat(stockAlert.changePercent || "0") >= 0 ? "text-green-600" : "text-red-600"}`}>
                      {parseFloat(stockAlert.changePercent || "0") >= 0 ? "+" : ""}{stockAlert.changePercent}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Price targets section */}
                  <div>
                    <h3 className="font-medium mb-3">Price Targets</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 border rounded-md bg-muted/20">
                        <div>Buy Zone</div>
                        <div className="font-medium">
                          {stockAlert.buyZoneMin ? `$${stockAlert.buyZoneMin.toFixed(2)}` : 'N/A'} - 
                          {stockAlert.buyZoneMax ? `$${stockAlert.buyZoneMax.toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded-md bg-muted/20">
                        <div>Target 1</div>
                        <div className="font-medium">{stockAlert.target1 ? `$${stockAlert.target1.toFixed(2)}` : 'N/A'}</div>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded-md bg-muted/20">
                        <div>Target 2</div>
                        <div className="font-medium">{stockAlert.target2 ? `$${stockAlert.target2.toFixed(2)}` : 'N/A'}</div>
                      </div>
                      <div className="flex justify-between items-center p-2 border rounded-md bg-muted/20">
                        <div>Target 3</div>
                        <div className="font-medium">{stockAlert.target3 ? `$${stockAlert.target3.toFixed(2)}` : 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Technical Reasons section */}
                  <div>
                    <h3 className="font-medium mb-3">Technical Reasons</h3>
                    <div className="space-y-2">
                      {stockAlert.technicalReasons && Array.isArray(stockAlert.technicalReasons) && 
                        stockAlert.technicalReasons.map((reason, index) => (
                          <div key={index} className="flex items-center p-2 border rounded-md bg-muted/20">
                            <Check className="h-4 w-4 mr-2 text-green-600" />
                            <span>{reason}</span>
                          </div>
                        ))
                      }
                      {(!stockAlert.technicalReasons || !stockAlert.technicalReasons.length) && (
                        <div className="p-2 border rounded-md bg-muted/20 text-muted-foreground">
                          No technical reasons specified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Chart Image */}
                {stockAlert.dailyChartImageUrl && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Chart</h3>
                    <div className="border rounded-md overflow-hidden">
                      <img 
                        src={stockAlert.dailyChartImageUrl} 
                        alt={`${stockAlert.symbol} chart`} 
                        className="w-full object-cover"
                      />
                    </div>
                  </div>
                )}
                
                {/* Narrative */}
                {stockAlert.narrative && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Investment Thesis</h3>
                    <div className="p-3 border rounded-md bg-muted/20">
                      {stockAlert.narrative}
                    </div>
                  </div>
                )}
                
                {/* Confluences */}
                {stockAlert.confluences && stockAlert.confluences.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Confluences</h3>
                    <div className="space-y-2">
                      {stockAlert.confluences.map((confluence, index) => (
                        <div key={index} className="flex items-center p-2 border rounded-md bg-muted/20">
                          <Check className="h-4 w-4 mr-2 text-green-600" />
                          <span>{confluence}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Risks */}
                {stockAlert.risks && (
                  <div className="mt-6">
                    <h3 className="font-medium mb-3">Known Risks</h3>
                    <div className="space-y-2">
                      {typeof stockAlert.risks === 'string' ? (
                        // Handle risks as a string
                        stockAlert.risks.split(', ').map((risk, index) => (
                          <div key={index} className="flex items-center p-2 border rounded-md bg-muted/20">
                            <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                            <span>{risk}</span>
                          </div>
                        ))
                      ) : (
                        // Fallback for array (for backwards compatibility)
                        Array.isArray(stockAlert.risks) && stockAlert.risks.map((risk, index) => (
                          <div key={index} className="flex items-center p-2 border rounded-md bg-muted/20">
                            <AlertTriangle className="h-4 w-4 mr-2 text-amber-600" />
                            <span>{risk}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right sidebar - publish controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish Controls</CardTitle>
                <CardDescription>
                  Review and publish your stock alert
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant={stockAlert.isDraft ? "default" : "success"}>
                  <div className="flex items-center">
                    {stockAlert.isDraft ? (
                      <AlertTriangle className="h-4 w-4 mr-2" />
                    ) : (
                      <Check className="h-4 w-4 mr-2" />
                    )}
                    <AlertTitle>
                      {stockAlert.isDraft ? "Draft Status" : "Published"}
                    </AlertTitle>
                  </div>
                  <AlertDescription>
                    {stockAlert.isDraft 
                      ? "This alert is currently in draft mode and not visible to members."
                      : "This alert is published and visible to members."}
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Required Membership Tier</h4>
                  <Badge variant="outline" className="text-sm">
                    {stockAlert.requiredTier === "free" 
                      ? "Free" 
                      : stockAlert.requiredTier === "premium" 
                        ? "Premium" 
                        : stockAlert.requiredTier === "mentorship" 
                          ? "Mentorship" 
                          : "Paid"}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Pre-Publish Checklist</h4>
                  <div className="space-y-1.5">
                    <div className="flex items-center text-sm">
                      {stockAlert.symbol ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mr-2 text-red-600" />
                      )}
                      <span>Stock symbol is set</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {stockAlert.companyName ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mr-2 text-red-600" />
                      )}
                      <span>Company name is set</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {stockAlert.dailyChartImageUrl ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mr-2 text-red-600" />
                      )}
                      <span>Chart image is uploaded</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {stockAlert.technicalReasons && stockAlert.technicalReasons.length > 0 ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mr-2 text-red-600" />
                      )}
                      <span>Technical reasons are set</span>
                    </div>
                    <div className="flex items-center text-sm">
                      {stockAlert.target1 && stockAlert.target2 && stockAlert.target3 ? (
                        <Check className="h-4 w-4 mr-2 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 mr-2 text-red-600" />
                      )}
                      <span>All price targets are set</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex-col items-stretch space-y-2">
                {stockAlert.isDraft && (
                  <Button 
                    onClick={() => publishMutation.mutate()}
                    disabled={publishMutation.isPending}
                    className="w-full"
                  >
                    {publishMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Publish Alert
                      </>
                    )}
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  asChild
                  className="w-full"
                >
                  <Link to={`/admin/stock-alerts/edit/${alertId}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    {stockAlert.isDraft ? "Edit Draft" : "Edit Alert"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Preview Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">What to check before publishing:</p>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                    <li>Verify all stock information is accurate</li>
                    <li>Ensure buy zone and targets are realistic</li>
                    <li>Check that technical reasons make sense</li>
                    <li>Verify chart image displays correctly</li>
                    <li>Review confluences and risks (if any)</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">Alert Visibility:</p>
                  <p className="text-muted-foreground mt-1">
                    This alert will be visible to members with <span className="font-medium">{stockAlert.requiredTier}</span> membership tier or higher.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}