import { useQuery } from "@tanstack/react-query";
import { AdminPermission } from "@shared/schema";
import { useAuth } from "./use-auth";

/**
 * A hook that fetches and returns the current user's admin permissions.
 * Only users with admin privileges will have access to permissions.
 * 
 * @returns AdminPermission object or null if user is not an admin
 */
export function useAdminPermissions() {
  const { user } = useAuth();
  
  const { data: permissions, isLoading, error } = useQuery<AdminPermission>({
    queryKey: ['/api/admin/permissions'],
    enabled: !!user?.isAdmin,
  });

  const isSuperAdmin = !!user?.adminRoles && user.adminRoles.includes('super_admin');

  /**
   * Checks if the current user has a specific permission
   */
  const hasPermission = (permissionKey: keyof AdminPermission): boolean => {
    // Super admins have all permissions
    if (isSuperAdmin) {
      return true;
    }
    
    // Return the specific permission value
    return permissions ? !!permissions[permissionKey] : false;
  };

  /**
   * Checks if the current user can access admin tools
   */
  const canAccessAdmin = (): boolean => {
    return !!user?.isAdmin;
  };

  /**
   * Checks if the current user can manage other admins
   * Only super_admin can manage other admins
   */
  const canManageAdmins = (): boolean => {
    return !!user?.adminRoles && user.adminRoles.includes('super_admin');
  };

  return {
    permissions,
    isLoading,
    error,
    hasPermission,
    canAccessAdmin,
    canManageAdmins,
    isSuperAdmin,
  };
}