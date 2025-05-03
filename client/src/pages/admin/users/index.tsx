import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import { AdminStatusToggle } from "@/components/admin/AdminStatusToggle";
import { RoleSelector } from "@/components/admin/RoleSelector";
import { PermissionsManager } from "@/components/admin/PermissionsManager";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Settings, User as UserIcon } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminUsersPage() {
  const { currentUserPermissions, isLoadingPermissions } = useAdminPermissions();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all-users");

  // Fetch all users
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!currentUserPermissions?.canManageUsers,
  });

  // Fetch admin users
  const {
    data: adminUsers,
    isLoading: isLoadingAdminUsers,
    error: adminUsersError,
  } = useQuery<User[]>({
    queryKey: ['/api/admin/users/admins'],
    enabled: !!currentUserPermissions?.canManageAdmins || !!currentUserPermissions?.canManageUsers,
  });

  if (isLoadingPermissions) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!currentUserPermissions?.canManageUsers && !currentUserPermissions?.canManageAdmins) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground mt-2">
            You don't have permission to manage users or admins.
          </p>
        </div>
      </AdminLayout>
    );
  }

  const filterUsers = (userList: User[] | undefined) => {
    if (!userList) return [];
    
    return userList.filter(user => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        (user.adminRole && user.adminRole.toLowerCase().includes(query))
      );
    });
  };

  const filteredUsers = filterUsers(users);
  const filteredAdminUsers = filterUsers(adminUsers);

  const isUserSuperAdmin = (user: User) => user.adminRole === 'super_admin';

  return (
    <AdminLayout>
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage users and admin permissions
              </CardDescription>
            </div>
            <div className="relative w-full md:w-auto">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 w-full md:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full md:w-[400px] grid-cols-2">
              <TabsTrigger value="all-users">All Users</TabsTrigger>
              <TabsTrigger value="admin-users">Admin Users</TabsTrigger>
            </TabsList>

            <TabsContent value="all-users" className="space-y-4">
              {isLoadingUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : usersError ? (
                <div className="text-red-500 py-4">
                  Error loading users: {usersError.message}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Membership</TableHead>
                      <TableHead>Admin Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          {searchQuery
                            ? "No users match your search query"
                            : "No users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                <UserIcon className="h-4 w-4 text-primary" />
                              </div>
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.tier === 'Premium' ? 'default' : 'secondary'}>
                              {user.tier || 'Free'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {currentUserPermissions.canManageAdmins ? (
                              <AdminStatusToggle user={user} disabled={isUserSuperAdmin(user)} />
                            ) : (
                              <Badge variant={user.isAdmin ? 'default' : 'outline'}>
                                {user.isAdmin ? (
                                  <>
                                    Admin
                                    {user.adminRole && ` (${user.adminRole})`}
                                  </>
                                ) : (
                                  "User"
                                )}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.isAdmin && (
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedUserId(user.id)}
                                  >
                                    <Settings className="h-4 w-4 mr-1" />
                                    Manage
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                  <DialogHeader>
                                    <DialogTitle>
                                      Manage Admin: {user.name}
                                    </DialogTitle>
                                    <DialogDescription>
                                      Configure role and permissions for this admin user
                                    </DialogDescription>
                                  </DialogHeader>
                                  
                                  <div className="py-4">
                                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start mb-6">
                                      <div>
                                        <h3 className="text-lg font-semibold mb-1">Admin Role</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          Assign a role to this admin user
                                        </p>
                                        <RoleSelector user={user} disabled={isUserSuperAdmin(user)} />
                                      </div>
                                      
                                      <div>
                                        <h3 className="text-lg font-semibold mb-1">Admin Status</h3>
                                        <p className="text-sm text-muted-foreground mb-2">
                                          Toggle admin status for this user
                                        </p>
                                        <AdminStatusToggle user={user} disabled={isUserSuperAdmin(user)} />
                                      </div>
                                    </div>
                                    
                                    {selectedUserId && (
                                      <PermissionsManager userId={selectedUserId} />
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="admin-users" className="space-y-4">
              {isLoadingAdminUsers ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : adminUsersError ? (
                <div className="text-red-500 py-4">
                  Error loading admin users: {adminUsersError.message}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdminUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          {searchQuery
                            ? "No admin users match your search query"
                            : "No admin users found"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAdminUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                <UserIcon className="h-4 w-4 text-primary" />
                              </div>
                              {user.name}
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {currentUserPermissions.canManageAdmins ? (
                              <RoleSelector user={user} disabled={isUserSuperAdmin(user) && user.id !== currentUserPermissions.userId} />
                            ) : (
                              <Badge variant="default">
                                {user.adminRole || 'Admin'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedUserId(user.id)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Permissions
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>
                                    Admin Permissions: {user.name}
                                  </DialogTitle>
                                  <DialogDescription>
                                    Configure permissions for this admin user
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedUserId && (
                                  <PermissionsManager userId={selectedUserId} />
                                )}
                              </DialogContent>
                            </Dialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}