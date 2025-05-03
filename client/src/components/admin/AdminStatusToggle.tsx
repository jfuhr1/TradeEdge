import React from 'react';
import { Switch } from '@/components/ui/switch';
import { useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface AdminStatusToggleProps {
  userId: number;
  isAdmin: boolean | null;
}

export default function AdminStatusToggle({ userId, isAdmin }: AdminStatusToggleProps) {
  const { toast } = useToast();

  // Mutation for toggling admin status
  const toggleAdminStatus = useMutation({
    mutationFn: async (newStatus: boolean) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/users/${userId}/admin-status`,
        { isAdmin: newStatus }
      );
      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users`] });
      
      toast({
        title: "Admin Status Updated",
        description: `User is now ${isAdmin ? 'no longer' : 'an'} admin.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Admin Status",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleToggle = (checked: boolean) => {
    toggleAdminStatus.mutate(checked);
  };

  return (
    <div className="flex items-center space-x-2">
      <Switch 
        checked={!!isAdmin} 
        onCheckedChange={handleToggle}
        disabled={toggleAdminStatus.isPending}
      />
      <span className="text-sm">
        {toggleAdminStatus.isPending ? "Updating..." : (isAdmin ? "Admin" : "Not Admin")}
      </span>
    </div>
  );
}