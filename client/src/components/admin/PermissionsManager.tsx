import { useState, useEffect } from "react";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { AdminPermission } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface PermissionsManagerProps {
  userId: number;
}

export function PermissionsManager({ userId }: PermissionsManagerProps) {
  const { updatePermissionsMutation } = useAdminPermissions();
  const [permissions, setPermissions] = useState<Partial<AdminPermission>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Partial<AdminPermission>>({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the hook to fetch permissions
  const { data, isLoading: isLoadingQuery, error } = useAdminPermissions().getUserPermissions(userId);
  
  useEffect(() => {
    if (data && !isLoadingQuery) {
      setPermissions({ ...data });
      setOriginalPermissions({ ...data });
      setIsLoading(false);
    }
  }, [data, isLoadingQuery]);
  
  if (error) {
    toast({
      title: "Error fetching permissions",
      description: error.message,
      variant: "destructive",
    });
  }
  
  const handlePermissionChange = (key: keyof AdminPermission) => {
    setPermissions({
      ...permissions,
      [key]: !(permissions[key] as boolean),
    });
  };
  
  const hasChanges = () => {
    if (!originalPermissions || !permissions) return false;
    
    for (const key in permissions) {
      if (permissions[key as keyof AdminPermission] !== originalPermissions[key as keyof AdminPermission]) {
        return true;
      }
    }
    
    return false;
  };
  
  const handleSave = () => {
    updatePermissionsMutation.mutate({
      userId,
      permissions,
    });
  };
  
  const permissionGroups = [
    {
      title: "User Management",
      permissions: [
        { key: "canManageUsers", label: "Can manage users" },
        { key: "canManageAdmins", label: "Can manage admin users" },
      ],
    },
    {
      title: "Alerts Management",
      permissions: [
        { key: "canCreateAlerts", label: "Can create alerts" },
        { key: "canEditAlerts", label: "Can edit alerts" },
        { key: "canDeleteAlerts", label: "Can delete alerts" },
      ],
    },
    {
      title: "Education Content",
      permissions: [
        { key: "canCreateEducation", label: "Can create education content" },
        { key: "canEditEducation", label: "Can edit education content" },
        { key: "canDeleteEducation", label: "Can delete education content" },
      ],
    },
    {
      title: "Articles Management",
      permissions: [
        { key: "canCreateArticles", label: "Can create articles" },
        { key: "canEditArticles", label: "Can edit articles" },
        { key: "canDeleteArticles", label: "Can delete articles" },
      ],
    },
    {
      title: "Coaching Management",
      permissions: [
        { key: "canManageCoaching", label: "Can manage coaching sessions" },
        { key: "canManageGroupSessions", label: "Can manage group sessions" },
      ],
    },
    {
      title: "Analytics",
      permissions: [
        { key: "canViewAnalytics", label: "Can view platform analytics" },
      ],
    },
  ];
  
  if (isLoading || isLoadingQuery) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Admin Permissions</CardTitle>
        <CardDescription>
          Configure what this admin user can access and modify
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {permissionGroups.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-lg font-medium">{group.title}</h3>
              <div className="space-y-2">
                {group.permissions.map((permission) => (
                  <div key={permission.key} className="flex items-center space-x-2">
                    <Checkbox
                      id={permission.key}
                      checked={permissions[permission.key as keyof AdminPermission] as boolean}
                      onCheckedChange={() => handlePermissionChange(permission.key as keyof AdminPermission)}
                    />
                    <label
                      htmlFor={permission.key}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {permission.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || updatePermissionsMutation.isPending}
          >
            {updatePermissionsMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}