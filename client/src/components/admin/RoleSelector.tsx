import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { User } from "@shared/schema";
import { Loader2 } from "lucide-react";

interface RoleSelectorProps {
  user: User;
  disabled?: boolean;
}

export function RoleSelector({ user, disabled = false }: RoleSelectorProps) {
  const { updateRoleMutation, adminRoles } = useAdminPermissions();
  const [selectedRole, setSelectedRole] = useState<string>(user.adminRole || "");
  const [isChanged, setIsChanged] = useState(false);
  
  const handleRoleChange = (value: string) => {
    setSelectedRole(value);
    setIsChanged(value !== user.adminRole);
  };
  
  const handleUpdate = () => {
    if (selectedRole && isChanged) {
      updateRoleMutation.mutate({
        userId: user.id,
        role: selectedRole
      });
    }
  };
  
  return (
    <div className="flex flex-row gap-2 items-center">
      <Select 
        value={selectedRole} 
        onValueChange={handleRoleChange}
        disabled={disabled || updateRoleMutation.isPending}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select a role" />
        </SelectTrigger>
        <SelectContent>
          {adminRoles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {isChanged && (
        <Button 
          size="sm" 
          onClick={handleUpdate}
          disabled={updateRoleMutation.isPending}
        >
          {updateRoleMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Update"
          )}
        </Button>
      )}
    </div>
  );
}