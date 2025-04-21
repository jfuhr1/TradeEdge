import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StockAlert } from "@shared/schema";
import { Loader2, Plus, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";
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
  
  // Fetch high risk/reward stocks (below buy zone)
  const { data: highRiskAlerts = [], isLoading: isLoadingHighRisk } = useQuery<StockAlert[]>({
    queryKey: ["/api/stock-alerts/high-risk-reward"],
  });
  
  // Fetch stocks that hit targets
  const { data: hitTargetsAlerts, isLoading: isLoadingHitTargets } = useQuery<{
    target1: StockAlert[];
    target2: StockAlert[];
    target3: StockAlert[];
  }>({
    queryKey: ["/api/stock-alerts/hit-targets"],
  });
  
  const isLoading = 
    isLoadingAlerts || 
    isLoadingBuyZone || 
    isLoadingTargets || 
    isLoadingClosed || 
    isLoadingHighRisk || 
    isLoadingHitTargets;
  
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
        <TabsList className="flex flex-wrap">
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
          <TabsTrigger value="hit-targets">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
              Hit Targets ({
                (hitTargetsAlerts?.target1.length || 0) + 
                (hitTargetsAlerts?.target2.length || 0) + 
                (hitTargetsAlerts?.target3.length || 0)
              })
            </div>
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
        
        {/* Hit Targets Tab */}
        <TabsContent value="hit-targets">
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-green-800">Hit Targets</h3>
                <p className="text-sm text-green-700 mt-1">
                  These stocks have successfully reached their target prices. This section showcases our 
                  successful stock picks and can help you understand what makes a winning trade.
                </p>
              </div>
            </div>
          </div>

          {(!hitTargetsAlerts || 
            (hitTargetsAlerts.target1.length === 0 && 
             hitTargetsAlerts.target2.length === 0 && 
             hitTargetsAlerts.target3.length === 0)) ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No stocks have hit their targets yet.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Target 1 */}
              {hitTargetsAlerts && hitTargetsAlerts.target1 && hitTargetsAlerts.target1.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 mr-2">Target 1</Badge>
                    Hit Target 1
                  </h3>
                  <div className="space-y-4">
                    {hitTargetsAlerts.target1.map((alert) => (
                      <ClosedAlertCard key={`ht1-${alert.id}`} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Target 2 */}
              {hitTargetsAlerts && hitTargetsAlerts.target2 && hitTargetsAlerts.target2.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 mr-2">Target 2</Badge>
                    Hit Target 2
                  </h3>
                  <div className="space-y-4">
                    {hitTargetsAlerts.target2.map((alert) => (
                      <ClosedAlertCard key={`ht2-${alert.id}`} alert={alert} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Target 3 */}
              {hitTargetsAlerts && hitTargetsAlerts.target3 && hitTargetsAlerts.target3.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-3 flex items-center">
                    <Badge variant="outline" className="bg-green-50 text-green-700 mr-2">Target 3</Badge>
                    Hit Target 3
                  </h3>
                  <div className="space-y-4">
                    {hitTargetsAlerts.target3.map((alert) => (
                      <ClosedAlertCard key={`ht3-${alert.id}`} alert={alert} />
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
