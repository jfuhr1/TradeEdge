import { useAuth } from "@/hooks/use-auth";

export type FeaturePermission = 
  // Stock Alerts Permissions
  | "view_all_alerts" 
  | "view_monthly_free_alert"
  | "custom_notifications" 
  
  // Education Permissions
  | "view_basic_education" 
  | "view_full_education" 
  
  // Coaching Permissions
  | "attend_weekly_intro" 
  | "attend_weekly_new_alerts"
  | "attend_weekly_qa_sessions"
  | "book_annual_consultation"
  | "book_coaching_sessions"
  | "request_portfolio_review"
  
  // Portfolio Permissions
  | "use_portfolio_tracking"
  | "access_priority_notifications"
  
  // Coaching Discounts
  | "coaching_discount";

type TierPermissionsMap = {
  [key: string]: FeaturePermission[];
};

// Define permissions for each tier
// Higher tiers inherit all permissions from lower tiers
const tierPermissions: TierPermissionsMap = {
  // Free tier
  free: [
    "view_monthly_free_alert",
    "view_basic_education",
    "attend_weekly_intro"
  ],
  
  // Paid tier ($29.99/month)
  paid: [
    "view_all_alerts",
    "view_full_education",
    "use_portfolio_tracking",
    "custom_notifications",
    "attend_weekly_new_alerts"
  ],
  
  // Premium tier ($999/year)
  premium: [
    "access_priority_notifications",
    "attend_weekly_qa_sessions",
    "request_portfolio_review",
    "book_annual_consultation",
    "coaching_discount"
  ],
  
  // Mentorship tier ($5,000 one-time)
  mentorship: [
    "book_coaching_sessions"
  ],
  
  // Employee tier (internal use)
  employee: [
    // Employees have access to everything
  ]
};

export function useTierPermissions() {
  const { user } = useAuth();
  
  /**
   * Check if the user has permission for a specific feature
   * @param permission The permission to check
   * @returns Boolean indicating if user has permission
   */
  const hasPermission = (permission: FeaturePermission): boolean => {
    if (!user) return false;
    
    const userTier = user.tier || "free";
    
    // Employee tier has access to all features
    if (userTier === "employee") return true;
    
    // Get ordered tiers by access level
    const tierOrder = ["free", "paid", "premium", "mentorship"];
    const userTierIndex = tierOrder.indexOf(userTier);
    
    // Check if user's tier or any lower tier has the permission
    for (let i = 0; i <= userTierIndex; i++) {
      const tier = tierOrder[i];
      if (tierPermissions[tier]?.includes(permission)) {
        return true;
      }
    }
    
    return false;
  };
  
  /**
   * Check if the user has a specific tier or higher
   * @param requiredTier The tier to check for
   * @returns Boolean indicating if user has the required tier or higher
   */
  const hasTierAccess = (requiredTier: string): boolean => {
    if (!user) return false;
    
    const userTier = user.tier || "free";
    
    // Employee tier has access to all tiers
    if (userTier === "employee") return true;
    
    // Get ordered tiers by access level
    const tierOrder = ["free", "paid", "premium", "mentorship"];
    const userTierIndex = tierOrder.indexOf(userTier);
    const requiredTierIndex = tierOrder.indexOf(requiredTier);
    
    // User has access if their tier index is >= required tier index
    return userTierIndex >= requiredTierIndex;
  };
  
  return {
    hasPermission,
    hasTierAccess
  };
}