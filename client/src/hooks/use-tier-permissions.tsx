import { useAuth } from "@/hooks/use-auth";

// All possible feature permissions in the system
export type FeaturePermission = 
  // Free tier permissions
  | "view_monthly_free_alert"
  | "view_basic_education"
  | "attend_weekly_intro"
  
  // Paid tier permissions
  | "view_all_alerts"
  | "use_portfolio_tracking"
  | "view_full_education"
  | "custom_notifications"
  | "attend_weekly_new_alerts"
  
  // Premium tier permissions
  | "access_priority_notifications" 
  | "view_advanced_education"
  | "attend_qa_sessions"
  | "annual_portfolio_review"

  // Mentorship tier permissions
  | "coaching_sessions";

// Define permission sets for each tier
const tierPermissions: Record<string, FeaturePermission[]> = {
  free: [
    "view_monthly_free_alert",
    "view_basic_education",
    "attend_weekly_intro"
  ],
  
  paid: [
    // Free tier permissions
    "view_monthly_free_alert",
    "view_basic_education",
    "attend_weekly_intro",
    
    // Paid tier permissions
    "view_all_alerts",
    "use_portfolio_tracking",
    "view_full_education",
    "custom_notifications",
    "attend_weekly_new_alerts"
  ],
  
  premium: [
    // Free tier permissions
    "view_monthly_free_alert",
    "view_basic_education", 
    "attend_weekly_intro",
    
    // Paid tier permissions
    "view_all_alerts",
    "use_portfolio_tracking",
    "view_full_education",
    "custom_notifications",
    "attend_weekly_new_alerts",
    
    // Premium tier permissions
    "access_priority_notifications",
    "view_advanced_education",
    "attend_qa_sessions",
    "annual_portfolio_review"
  ],
  
  mentorship: [
    // Free tier permissions
    "view_monthly_free_alert",
    "view_basic_education",
    "attend_weekly_intro",
    
    // Paid tier permissions
    "view_all_alerts", 
    "use_portfolio_tracking",
    "view_full_education",
    "custom_notifications",
    "attend_weekly_new_alerts",
    
    // Premium tier permissions
    "access_priority_notifications",
    "view_advanced_education",
    "attend_qa_sessions",
    "annual_portfolio_review",
    
    // Mentorship tier permissions
    "coaching_sessions"
  ],
  
  employee: [
    // All permissions
    "view_monthly_free_alert",
    "view_basic_education",
    "attend_weekly_intro",
    "view_all_alerts", 
    "use_portfolio_tracking",
    "view_full_education",
    "custom_notifications",
    "attend_weekly_new_alerts",
    "access_priority_notifications",
    "view_advanced_education",
    "attend_qa_sessions",
    "annual_portfolio_review",
    "coaching_sessions"
  ]
};

// Define a comparable hierarchy for tiers
const tierHierarchy: Record<string, number> = {
  free: 0,
  paid: 1,
  premium: 2,
  mentorship: 3,
  employee: 4
};

/**
 * Hook that provides utility functions for checking user permissions based on tier
 */
export function useTierPermissions() {
  const { user } = useAuth();
  
  /**
   * Check if the user has a specific feature permission based on their tier
   */
  const hasPermission = (permission: FeaturePermission) => {
    if (!user) return false;
    
    const userTier = user.tier || "free";
    const permissions = tierPermissions[userTier];
    
    return permissions ? permissions.includes(permission) : false;
  };
  
  /**
   * Check if the user has access to a specific tier's features
   */
  const hasTierAccess = (requiredTier: string) => {
    if (!user) return false;
    
    const userTier = user.tier || "free";
    const userLevel = tierHierarchy[userTier] ?? -1;
    const requiredLevel = tierHierarchy[requiredTier] ?? 999;
    
    return userLevel >= requiredLevel;
  };
  
  /**
   * Get all permissions available for the current user
   */
  const getUserPermissions = (): FeaturePermission[] => {
    if (!user) return [];
    
    const userTier = user.tier || "free";
    return tierPermissions[userTier] || [];
  };
  
  return { hasPermission, hasTierAccess, getUserPermissions };
}