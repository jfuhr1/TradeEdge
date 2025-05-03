import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { User } from "@shared/schema";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { Loader2 } from "lucide-react";

interface AdminStatusToggleProps {
  user: User;
  disabled?: boolean;
}

export function AdminStatusToggle({ user, disabled = false }: AdminStatusToggleProps) {
  const { toggleAdminStatusMutation } = useAdminPermissions();
  const [isAdmin, setIsAdmin] = useState(!!user.isAdmin);
  
  const handleToggle = () => {
    const newAdminStatus = !isAdmin;
    setIsAdmin(newAdminStatus);
    toggleAdminStatusMutation.mutate({
      userId: user.id,
      isAdmin: newAdminStatus
    });
  };
  
  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={isAdmin}
        onCheckedChange={handleToggle}
        disabled={disabled || toggleAdminStatusMutation.isPending || user.adminRole === 'super_admin'}
      />
      <span className="text-sm">
        {toggleAdminStatusMutation.isPending ? (
          <Loader2 className="h-4 w-4 inline mr-2 animate-spin" />
        ) : null}
        {isAdmin ? "Admin" : "Not Admin"}
      </span>
    </div>
  );
}