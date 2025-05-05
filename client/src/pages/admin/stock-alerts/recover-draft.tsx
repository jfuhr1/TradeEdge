import { useEffect } from "react";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import RecoverDraftHandler from "@/components/admin/stock-alerts/RecoverDraftHandler";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader2 } from "lucide-react";

export default function RecoverDraftPage() {
  const [location, navigate] = useLocation();
  const { hasPermission, isLoading: permissionsLoading } = useAdminPermissions();
  const canCreateAlerts = hasPermission("canCreateAlerts");
  
  // Extract ID from URL if present
  const params = new URLSearchParams(location.split("?")[1]);
  const alertId = parseInt(params.get("id") || "0");
  
  // If no permission, redirect back to stock alerts list
  useEffect(() => {
    if (!permissionsLoading && !canCreateAlerts) {
      navigate("/admin/stock-alerts");
    }
  }, [canCreateAlerts, navigate, permissionsLoading]);
  
  if (permissionsLoading) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Checking permissions...</span>
          </div>
        </div>
      </AdminLayout>
    );
  }
  
  if (!canCreateAlerts) {
    return (
      <AdminLayout>
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardHeader>
              <CardTitle>Permission Required</CardTitle>
              <CardDescription>
                You don't have permission to recover draft alerts. Contact an administrator for access.
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Recover Draft Alert</h1>
          <p className="text-muted-foreground mt-1">
            We're creating a new draft alert to replace one that was lost.
          </p>
        </div>
        
        <Card>
          <CardContent className="pt-6">
            <RecoverDraftHandler alertId={alertId || 999} />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}