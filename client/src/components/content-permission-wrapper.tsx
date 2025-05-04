import { ReactNode } from "react";
import { useAuth } from "@/hooks/use-auth";
import { TierProtectedContent } from "@/components/tier-protected-content";
import { FeaturePermission } from "@/hooks/use-tier-permissions";

interface ContentPermissionWrapperProps {
  /**
   * The content to render if user has access
   */
  children: ReactNode;
  
  /**
   * If true, content will be completely hidden rather than showing an upgrade notice
   */
  hideIfNoAccess?: boolean;
  
  /**
   * Feature access required to view this content
   */
  requiredPermission?: FeaturePermission;
  
  /**
   * Alternatively, require a specific membership tier
   */
  requiredTier?: "free" | "paid" | "premium" | "mentorship" | "employee";
  
  /**
   * Custom title for the permission denied message
   */
  title?: string;
  
  /**
   * Custom description for the permission denied message
   */
  description?: string;
  
  /**
   * Whether to show upgrade button in the permission denied message
   */
  showUpgradeButton?: boolean;
  
  /**
   * Id for the wrapper element (for CSS targeting)
   */
  id?: string;
  
  /**
   * CSS class names to apply to the wrapper
   */
  className?: string;
}

/**
 * Component that conditionally renders content based on user's tier and permissions
 * Can be applied inline to show/hide UI elements based on membership tier
 */
export function ContentPermissionWrapper({
  children,
  hideIfNoAccess = false,
  requiredPermission,
  requiredTier,
  title,
  description,
  showUpgradeButton = true,
  id,
  className,
}: ContentPermissionWrapperProps) {
  const { user } = useAuth();
  
  // If not authenticated at all, show upgrade message
  if (!user) {
    return hideIfNoAccess ? null : (
      <div id={id} className={className}>
        <TierProtectedContent
          requiredPermission={requiredPermission}
          requiredTier={requiredTier}
          fallbackTitle={title || "Login Required"}
          fallbackDescription={description || "Please login or create an account to access this feature."}
          showUpgradeButton={showUpgradeButton}
        >
          {children}
        </TierProtectedContent>
      </div>
    );
  }
  
  // For authenticated users, check permissions
  return (
    <div id={id} className={className}>
      <TierProtectedContent
        requiredPermission={requiredPermission}
        requiredTier={requiredTier}
        fallbackTitle={title}
        fallbackDescription={description}
        showUpgradeButton={showUpgradeButton}
        fallback={hideIfNoAccess ? null : undefined}
      >
        {children}
      </TierProtectedContent>
    </div>
  );
}