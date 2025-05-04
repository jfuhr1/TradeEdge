import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Search, UserCog, Shield, Mail, RefreshCw, ArrowUpDown, UserPlus } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminUsers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: "ascending" | "descending";
  }>({
    key: "createdAt",
    direction: "descending",
  });

  // Fetch users
  const { data: users, isLoading, refetch } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const handleSort = (key: keyof User) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    });
  };

  const filteredUsers = users
    ? users
        .filter((user) => {
          const matchesSearch =
            search === "" ||
            user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            (user.firstName && user.firstName.toLowerCase().includes(search.toLowerCase())) ||
            (user.lastName && user.lastName.toLowerCase().includes(search.toLowerCase()));

          const matchesTier = tierFilter === "all" || user.tier === tierFilter;

          return matchesSearch && matchesTier;
        })
        .sort((a, b) => {
          // Handle different types of columns for sorting
          if (sortConfig.key === "createdAt") {
            const aDate = new Date(a.createdAt).getTime();
            const bDate = new Date(b.createdAt).getTime();
            return sortConfig.direction === "ascending" ? aDate - bDate : bDate - aDate;
          }

          if (typeof a[sortConfig.key] === "string" && typeof b[sortConfig.key] === "string") {
            const aValue = (a[sortConfig.key] as string).toLowerCase();
            const bValue = (b[sortConfig.key] as string).toLowerCase();
            return sortConfig.direction === "ascending"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }

          return 0;
        })
    : [];

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshed",
      description: "User list has been refreshed",
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "free":
        return "bg-gray-200 hover:bg-gray-300 text-gray-800";
      case "paid":
        return "bg-blue-100 hover:bg-blue-200 text-blue-800";
      case "premium":
        return "bg-purple-100 hover:bg-purple-200 text-purple-800";
      case "mentorship":
        return "bg-amber-100 hover:bg-amber-200 text-amber-800";
      default:
        return "bg-gray-100 hover:bg-gray-200 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-4 md:flex-row md:justify-between md:items-center md:space-y-0 mb-6">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">
              Manage user accounts, permissions and memberships
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button asChild>
              <Link href="/admin/users/add-user">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter controls */}
        <div className="flex flex-col md:flex-row justify-between space-y-4 md:space-y-0 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or email"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex space-x-2 items-center">
            <span className="text-sm font-medium whitespace-nowrap">Filter by tier:</span>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Tiers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="mentorship">Mentorship</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Users table */}
        <div className="bg-card rounded-md border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">Admin</TableHead>
                <TableHead className="w-[250px]">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("username")}
                  >
                    User
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-[120px]">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("tier")}
                  >
                    Tier
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="w-[130px]">
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    Joined
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    </div>
                    <div className="mt-2 text-muted-foreground">Loading users...</div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="text-muted-foreground">No users found</div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="text-center">
                      {user.isAdmin && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="inline-flex items-center justify-center w-6 h-6 cursor-help">
                                <Shield className="h-4 w-4 text-primary" />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-xs">
                                <p className="font-medium">Admin Roles:</p>
                                {user.adminRoles && Array.isArray(user.adminRoles) && user.adminRoles.length > 0 ? (
                                  <ul className="list-disc pl-4 mt-1">
                                    {user.adminRoles.map((role, index) => (
                                      <li key={index} className="capitalize">{role.replace('_', ' ')}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p>No specific roles</p>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground mr-2">
                          {user.firstName?.charAt(0) || user.username.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium">{user.username}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.firstName && user.lastName 
                              ? `${user.firstName} ${user.lastName}` 
                              : "No name provided"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        {user.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTierColor(user.tier)}>{user.tier}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.createdAt.toString())}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-1">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/users/manage/${user.id}`}>
                            <UserCog className="h-4 w-4 mr-1" />
                            Manage
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <UserCog className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href={`/admin/users/manage/${user.id}`}>
                              <DropdownMenuItem>
                                <UserCog className="h-4 w-4 mr-2" />
                                Manage User
                              </DropdownMenuItem>
                            </Link>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination placeholder */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">{filteredUsers.length}</span> of{" "}
            <span className="font-medium">{users?.length || 0}</span> users
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}