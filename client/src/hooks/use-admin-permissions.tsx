import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminPermission } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useAdminPermissions() {
  const { toast } = useToast();

  // Get current user's admin permissions
  const { 
    data: currentUserPermissions,
    isLoading: isLoadingPermissions,
    error: permissionsError
  } = useQuery<AdminPermission>({
    queryKey: ['/api/user/admin-permissions'],
    enabled: true,
  });

  // Get all admin users
  const {
    data: adminUsers,
    isLoading: isLoadingAdminUsers,
    error: adminUsersError
  } = useQuery({
    queryKey: ['/api/admin/users/admins'],
    enabled: !!currentUserPermissions?.canManageAdmins || currentUserPermissions?.canManageUsers,
  });

  // Get permissions for a specific user
  const getUserPermissions = (userId: number) => {
    return useQuery({
      queryKey: ['/api/admin/permissions', userId],
      enabled: !!userId && (!!currentUserPermissions?.canManageAdmins),
    });
  };

  // Update permissions mutation
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: number, permissions: Partial<AdminPermission> }) => {
      const res = await apiRequest("POST", `/api/admin/permissions/${userId}`, permissions);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Permissions updated",
        description: "The user's permissions have been updated successfully.",
      });
      
      // Invalidate both user-specific permissions and admin users list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/admins'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Toggle admin status mutation
  const toggleAdminStatusMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      const res = await apiRequest("POST", `/api/admin/toggle-admin-status/${userId}`, { isAdmin });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Admin status updated",
        description: `User is ${variables.isAdmin ? 'now' : 'no longer'} an admin.`,
      });
      
      // Invalidate both regular users list and admin users list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions', variables.userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update admin status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update admin role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number, role: string }) => {
      const res = await apiRequest("POST", `/api/admin/update-role/${userId}`, { role });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Admin role updated",
        description: `User's role has been updated to ${variables.role}.`,
      });
      
      // Invalidate both admin users list and user-specific permissions
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users/admins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/permissions', variables.userId] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update admin role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    // Current user permissions
    currentUserPermissions,
    isLoadingPermissions,
    permissionsError,
    
    // Admin users
    adminUsers,
    isLoadingAdminUsers,
    adminUsersError,
    
    // Methods
    getUserPermissions,
    updatePermissionsMutation,
    toggleAdminStatusMutation,
    updateRoleMutation,
    
    // Role options
    adminRoles: [
      { value: 'super_admin', label: 'Super Admin' },
      { value: 'alerts_admin', label: 'Alerts Admin' },
      { value: 'education_admin', label: 'Education Admin' },
      { value: 'coaching_admin', label: 'Coaching Admin' },
      { value: 'content_admin', label: 'Content Admin' },
    ],
  };
}