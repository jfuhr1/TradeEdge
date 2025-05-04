import { ReactNode } from "react";
import { useTierPermissions, FeaturePermission } from "@/hooks/use-tier-permissions";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldAlertIcon, LockIcon, ArrowUpRightIcon } from "lucide-react";
import { useLocation } from "wouter";

type TierProtectedContentProps = {
  /** Children to render if user has permission */
  children: ReactNode;
  /** Feature permission required to view content */
  requiredPermission?: FeaturePermission;
  /** Alternatively, require a specific tier */
  requiredTier?: "free" | "paid" | "premium" | "mentorship" | "employee";
  /** Custom fallback content when permission is denied */
  fallback?: ReactNode;
  /** Title for the default permission denied alert */
  fallbackTitle?: string;
  /** Description for the default permission denied alert */
  fallbackDescription?: string;
  /** Show upgrade button in fallback */
  showUpgradeButton?: boolean;
};

/**
 * Component that conditionally renders content based on user's tier permissions
 */
export function TierProtectedContent({
  children,
  requiredPermission,
  requiredTier,
  fallback,
  fallbackTitle = "Premium Feature",
  fallbackDescription = "Upgrade your membership to access this feature.",
  showUpgradeButton = true
}: TierProtectedContentProps) {
  const { hasPermission, hasTierAccess } = useTierPermissions();
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Check if user has required permission/tier
  const hasAccess = requiredPermission 
    ? hasPermission(requiredPermission) 
    : requiredTier 
      ? hasTierAccess(requiredTier)
      : true; // If no requirements, always show content

  // Determine which tier upgrade to suggest
  const suggestTierUpgrade = () => {
    if (!user) return "paid"; // Default suggestion for non-logged in users
    
    const currentTier = user.tier || "free";
    if (currentTier === "free") return "paid";
    if (currentTier === "paid") return "premium";
    if (currentTier === "premium") return "mentorship";
    return "premium"; // Default fallback
  };

  // If user has access, render children
  if (hasAccess) {
    return <>{children}</>;
  }

  // If custom fallback is provided, render it
  if (fallback) {
    return <>{fallback}</>;
  }

  // Otherwise, render default permission denied alert
  const suggestedTier = suggestTierUpgrade();
  
  return (
    <Alert variant="destructive" className="bg-muted/50 border-primary/40 text-foreground">
      <ShieldAlertIcon className="h-4 w-4 text-primary" />
      <AlertTitle className="flex items-center gap-2">
        {fallbackTitle} <LockIcon className="h-3 w-3" />
      </AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{fallbackDescription}</p>
        {showUpgradeButton && (
          <Button 
            size="sm" 
            className="mt-2" 
            onClick={() => navigate("/settings?tab=membership")}
          >
            Upgrade to {suggestedTier.charAt(0).toUpperCase() + suggestedTier.slice(1)}
            <ArrowUpRightIcon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * HOC that wraps a component with tier permission checking
 */
export function withTierProtection<P>(
  Component: React.ComponentType<P>,
  { requiredPermission, requiredTier }: { requiredPermission?: FeaturePermission; requiredTier?: string }
) {
  return function ProtectedComponent(props: P) {
    return (
      <TierProtectedContent
        requiredPermission={requiredPermission as FeaturePermission}
        requiredTier={requiredTier as "free" | "paid" | "premium" | "mentorship" | "employee"}
      >
        <Component {...props} />
      </TierProtectedContent>
    );
  };
}