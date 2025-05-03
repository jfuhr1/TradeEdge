import React from "react";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface RoleSelectorProps {
  userId: number;
  currentRole: string | null;
}

type AdminRole = "super_admin" | "alerts_admin" | "education_admin" | "content_admin" | "coaching_admin" | null;

export default function RoleSelector({ userId, currentRole }: RoleSelectorProps) {
  const { toast } = useToast();

  // Mutation for updating the user's admin role
  const updateRole = useMutation({
    mutationFn: async (role: AdminRole) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/users/${userId}/role`,
        { adminRole: role }
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users`] });
      toast({
        title: "Role updated",
        description: "The user's admin role has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleChange = (role: string) => {
    const adminRole = role === "none" ? null : (role as AdminRole);
    updateRole.mutate(adminRole);
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentRole || "none"}
        onValueChange={handleRoleChange}
        disabled={updateRole.isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select role">
            {updateRole.isPending ? (
              <div className="flex items-center">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </div>
            ) : (
              formatRoleName(currentRole)
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Not an Admin</SelectItem>
          <SelectItem value="super_admin">Super Admin</SelectItem>
          <SelectItem value="alerts_admin">Alerts Admin</SelectItem>
          <SelectItem value="education_admin">Education Admin</SelectItem>
          <SelectItem value="content_admin">Content Admin</SelectItem>
          <SelectItem value="coaching_admin">Coaching Admin</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function formatRoleName(role: string | null): string {
  if (!role) return "Not an Admin";
  
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}