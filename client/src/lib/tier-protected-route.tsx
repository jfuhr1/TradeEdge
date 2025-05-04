import { ReactElement } from "react";
import { Route, Redirect, useLocation } from "wouter";
import { useTierPermissions, FeaturePermission } from "@/hooks/use-tier-permissions";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, LockIcon, ArrowUpRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface TierProtectedRouteProps {
  /** The path pattern to match against */
  path: string;
  /** The component to render when the route matches and user has proper tier access */
  component: () => ReactElement;
  /** Specific feature permission required for this route */
  requiredPermission?: FeaturePermission;
  /** Alternative tier requirement (specify minimum tier needed) */
  requiredTier?: "free" | "paid" | "premium" | "mentorship" | "employee";
  /** Custom redirect path if access is denied (defaults to auth page) */
  redirectTo?: string;
}

/**
 * Route component that checks both authentication and tier-based permissions
 */
export function TierProtectedRoute({
  path,
  component: Component,
  requiredPermission,
  requiredTier,
  redirectTo = "/auth"
}: TierProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const { hasPermission, hasTierAccess } = useTierPermissions();
  const [currentLocation, navigate] = useLocation();

  // Check if user is authenticated
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to={redirectTo} />
      </Route>
    );
  }

  // Check if user has required permission or tier
  const hasAccess = requiredPermission 
    ? hasPermission(requiredPermission)
    : requiredTier 
    ? hasTierAccess(requiredTier)
    : true;

  if (!hasAccess) {
    return (
      <Route path={path}>
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[80vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <LockIcon className="h-5 w-5 text-primary" />
                <CardTitle>Premium Feature Access</CardTitle>
              </div>
              <CardDescription>
                This feature requires a higher membership tier.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                {requiredPermission 
                  ? `Access to this feature is restricted to users with ${requiredTier || 'paid'} membership or higher.`
                  : `This page requires a ${requiredTier} membership or higher.`
                }
              </p>
              <p className="text-sm">
                Your current membership tier: <span className="font-medium capitalize">{user.tier || 'free'}</span>
              </p>
            </CardContent>
            <CardFooter className="flex flex-col space-y-2">
              <Button 
                className="w-full" 
                onClick={() => navigate("/settings?tab=membership")}
              >
                Upgrade Membership
                <ArrowUpRightIcon className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate("/")}
              >
                Go to Dashboard
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Route>
    );
  }

  // User has proper access, render the component
  return <Route path={path} component={Component} />;
}