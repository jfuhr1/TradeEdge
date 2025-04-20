import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StockAlert } from "@shared/schema";
import { Loader2, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import AlertCard from "@/components/alerts/alert-card";
import ClosedAlertCard from "@/components/alerts/closed-alert-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";

export default function StockAlerts() {
  // For demo, anyone can see the admin button
  const isAdmin = true;
  
  // Fetch all stock alerts
  const { data: allAlerts, isLoading: isLoadingAlerts } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts"],
  });
  
  // Fetch alerts in buy zone
  const { data: buyZoneAlerts, isLoading: isLoadingBuyZone } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts/buy-zone"],
  });
  
  // Fetch alerts nearing targets
  const { data: targetAlerts, isLoading: isLoadingTargets } = useQuery<{
    target1: StockAlert[];
    target2: StockAlert[];
    target3: StockAlert[];
  }>({
    queryKey: ["/api/stock-alerts/targets"],
  });

  // Fetch closed alerts
  const { data: closedAlerts, isLoading: isLoadingClosed } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts/closed"],
  });

  // Calculate high risk/reward stocks (below buy zone)
  const highRiskAlerts = allAlerts?.filter(alert => 
    alert.currentPrice < alert.buyZoneMin && 
    alert.currentPrice >= (alert.buyZoneMin * 0.9) &&
    alert.status === 'active'
  ) || [];
  
  const isLoading = isLoadingAlerts || isLoadingBuyZone || isLoadingTargets || isLoadingClosed;
  
  if (isLoading) {
    return (
      <MainLayout title="Stock Alerts">
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  // Filter active alerts for display
  const activeAlerts = allAlerts?.filter(alert => alert.status === 'active') || [];
  
  return (
    <MainLayout 
      title="Stock Alerts" 
      description="All the latest stock recommendations and alert notifications."
    >
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Stock Alerts</h2>
        
        {/* Removed Create Alert button for regular users */}
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All Active ({activeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="buy-zone">
            In Buy Zone ({buyZoneAlerts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="high-risk">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1 text-amber-500" />
              High Risk/Reward ({highRiskAlerts.length})
            </div>
          </TabsTrigger>
          <TabsTrigger value="targets">
            Nearing Targets ({(targetAlerts?.target1.length || 0) + 
              (targetAlerts?.target2.length || 0) + 
              (targetAlerts?.target3.length || 0)})
          </TabsTrigger>
          <TabsTrigger value="closed">
            <div className="flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1 text-blue-500" />
              Closed ({closedAlerts?.length || 0})
            </div>
          </TabsTrigger>
        </TabsList>
        
        {/* All Alerts Tab */}
        <TabsContent value="all">
          {activeAlerts.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No stock alerts available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Buy Zone Alerts Tab */}
        <TabsContent value="buy-zone">
          {buyZoneAlerts?.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No stocks currently in the buy zone.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buyZoneAlerts?.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* High Risk/Reward Tab */}
        <TabsContent value="high-risk">
          {highRiskAlerts.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No stocks currently in the high risk/reward zone.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-amber-800">High Risk/Reward Zone</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      These stocks are trading below their buy zone but within 10% of the lower limit. 
                      They offer higher potential returns but with increased risk. Consider your risk 
                      tolerance before investing.
                    </p>
                  </div>
                </div>
              </div>
              
              {highRiskAlerts.map((alert) => (
                <AlertCard key={`hr-${alert.id}`} alert={alert} />
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Targets Tab */}
        <TabsContent value="targets">
          {(targetAlerts?.target1.length === 0 && 
            targetAlerts?.target2.length === 0 && 
            targetAlerts?.target3.length === 0) ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No stocks currently nearing targets.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Target 1 */}
              {targetAlerts && targetAlerts.target1 && targetAlerts.target1.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Nearing Target 1</h3>
                  <div className="space-y-4">
                    {targetAlerts.target1.map((alert) => (
                      <AlertCard key={`t1-${alert.id}`} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Target 2 */}
              {targetAlerts && targetAlerts.target2 && targetAlerts.target2.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Nearing Target 2</h3>
                  <div className="space-y-4">
                    {targetAlerts.target2.map((alert) => (
                      <AlertCard key={`t2-${alert.id}`} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Target 3 */}
              {targetAlerts && targetAlerts.target3 && targetAlerts.target3.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3">Nearing Target 3</h3>
                  <div className="space-y-4">
                    {targetAlerts.target3.map((alert) => (
                      <AlertCard key={`t3-${alert.id}`} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* Closed Alerts Tab */}
        <TabsContent value="closed">
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle2 className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800">Closed Alerts</h3>
                <p className="text-sm text-blue-700 mt-1">
                  These alerts have reached their first target and are now closed. They're shown here for 
                  reference and learning purposes. The max gain indicator shows the highest price reached 
                  after the alert was issued.
                </p>
              </div>
            </div>
          </div>
          
          {closedAlerts?.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No closed alerts available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {closedAlerts?.map((alert) => (
                <ClosedAlertCard key={`closed-${alert.id}`} alert={alert} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
