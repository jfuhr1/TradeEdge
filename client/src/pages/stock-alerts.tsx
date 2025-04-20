import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { StockAlert } from "@shared/schema";
import { Loader2, Plus } from "lucide-react";
import MainLayout from "@/components/layout/main-layout";
import AlertCard from "@/components/alerts/alert-card";
import { Button } from "@/components/ui/button";
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
  
  const isLoading = isLoadingAlerts || isLoadingBuyZone || isLoadingTargets;
  
  if (isLoading) {
    return (
      <MainLayout title="Stock Alerts">
        <div className="flex justify-center p-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout 
      title="Stock Alerts" 
      description="All the latest stock recommendations and alert notifications."
    >
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Active Alerts</h2>
        
        {isAdmin && (
          <Link href="/admin/create-alert">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Alert
            </Button>
          </Link>
        )}
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All Alerts ({allAlerts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="buy-zone">
            In Buy Zone ({buyZoneAlerts?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="targets">
            Nearing Targets ({(targetAlerts?.target1.length || 0) + 
              (targetAlerts?.target2.length || 0) + 
              (targetAlerts?.target3.length || 0)})
          </TabsTrigger>
        </TabsList>
        
        {/* All Alerts Tab */}
        <TabsContent value="all">
          {allAlerts?.length === 0 ? (
            <div className="bg-white p-6 rounded-lg shadow text-center">
              <p className="text-neutral-600">No stock alerts available yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allAlerts?.map((alert) => (
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
              {targetAlerts?.target1.length > 0 && (
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
              {targetAlerts?.target2.length > 0 && (
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
              {targetAlerts?.target3.length > 0 && (
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
      </Tabs>
    </MainLayout>
  );
}
