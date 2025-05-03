import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminPermission } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface PermissionsManagerProps {
  userId: number;
}

export default function PermissionsManager({ userId }: PermissionsManagerProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("general");
  const [permissions, setPermissions] = useState<Partial<AdminPermission> | null>(null);

  // Fetch the user's current permissions
  const { data: userPermissions, isLoading } = useQuery<AdminPermission>({
    queryKey: [`/api/admin/users/${userId}/permissions`],
    onSuccess: (data) => {
      setPermissions(data);
    },
  });

  // Mutation for updating permissions
  const updatePermissions = useMutation({
    mutationFn: async (permissions: Partial<AdminPermission>) => {
      const response = await apiRequest(
        "POST",
        `/api/admin/users/${userId}/permissions`,
        permissions
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/permissions`] });
      toast({
        title: "Permissions updated",
        description: "The user's permissions have been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating permissions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle permission toggle
  const handleToggle = (key: keyof AdminPermission) => {
    if (!permissions) return;
    
    const updatedPermissions = {
      ...permissions,
      [key]: !permissions[key],
    };
    
    setPermissions(updatedPermissions);
  };

  // Save all permission changes
  const handleSave = () => {
    if (!permissions) return;
    updatePermissions.mutate(permissions);
  };

  // Reset to original permissions
  const handleReset = () => {
    setPermissions(userPermissions || null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="coaching">Coaching</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
        </TabsList>

        {/* General Permissions */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Admin Permissions</CardTitle>
              <CardDescription>
                Manage user access to administrative features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">User Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Can manage user accounts
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canManageUsers || false}
                  onCheckedChange={() => handleToggle("canManageUsers")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Admin Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Can manage admin permissions
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canManageAdmins || false}
                  onCheckedChange={() => handleToggle("canManageAdmins")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">View Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Can view performance analytics
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canViewAnalytics || false}
                  onCheckedChange={() => handleToggle("canViewAnalytics")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Permissions */}
        <TabsContent value="alerts">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts Permissions</CardTitle>
              <CardDescription>
                Manage stock alerts creation and modification access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Create Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Can create new stock alerts
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canCreateAlerts || false}
                  onCheckedChange={() => handleToggle("canCreateAlerts")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Edit Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Can modify existing stock alerts
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canEditAlerts || false}
                  onCheckedChange={() => handleToggle("canEditAlerts")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Delete Alerts</h4>
                  <p className="text-sm text-muted-foreground">
                    Can delete stock alerts
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canDeleteAlerts || false}
                  onCheckedChange={() => handleToggle("canDeleteAlerts")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education Permissions */}
        <TabsContent value="education">
          <Card>
            <CardHeader>
              <CardTitle>Education Content Permissions</CardTitle>
              <CardDescription>
                Manage education resources access
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Create Education Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Can add new education resources
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canCreateEducation || false}
                  onCheckedChange={() => handleToggle("canCreateEducation")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Edit Education Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Can modify existing education resources
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canEditEducation || false}
                  onCheckedChange={() => handleToggle("canEditEducation")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Delete Education Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Can remove education resources
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canDeleteEducation || false}
                  onCheckedChange={() => handleToggle("canDeleteEducation")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Coaching Permissions */}
        <TabsContent value="coaching">
          <Card>
            <CardHeader>
              <CardTitle>Coaching Permissions</CardTitle>
              <CardDescription>
                Manage coaching sessions and scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Manage Coaching</h4>
                  <p className="text-sm text-muted-foreground">
                    Can manage coaching system
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canManageCoaching || false}
                  onCheckedChange={() => handleToggle("canManageCoaching")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Manage Group Sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    Can create and manage group coaching sessions
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canManageGroupSessions || false}
                  onCheckedChange={() => handleToggle("canManageGroupSessions")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Schedule Sessions</h4>
                  <p className="text-sm text-muted-foreground">
                    Can schedule coaching sessions
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canScheduleSessions || false}
                  onCheckedChange={() => handleToggle("canScheduleSessions")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">View Session Details</h4>
                  <p className="text-sm text-muted-foreground">
                    Can view coaching session details
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canViewSessionDetails || false}
                  onCheckedChange={() => handleToggle("canViewSessionDetails")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Permissions */}
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Content Management Permissions</CardTitle>
              <CardDescription>
                Manage articles and content creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Create Articles</h4>
                  <p className="text-sm text-muted-foreground">
                    Can add new articles and blog posts
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canCreateArticles || false}
                  onCheckedChange={() => handleToggle("canCreateArticles")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Edit Articles</h4>
                  <p className="text-sm text-muted-foreground">
                    Can modify existing articles
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canEditArticles || false}
                  onCheckedChange={() => handleToggle("canEditArticles")}
                />
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <h4 className="font-medium">Delete Articles</h4>
                  <p className="text-sm text-muted-foreground">
                    Can delete articles
                  </p>
                </div>
                <Switch 
                  checked={permissions?.canDeleteArticles || false}
                  onCheckedChange={() => handleToggle("canDeleteArticles")}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 mt-4">
        <Button 
          variant="outline" 
          onClick={handleReset} 
          disabled={updatePermissions.isPending}
        >
          Reset
        </Button>
        <Button 
          onClick={handleSave}
          disabled={updatePermissions.isPending}
        >
          {updatePermissions.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Permissions"
          )}
        </Button>
      </div>
    </div>
  );
}