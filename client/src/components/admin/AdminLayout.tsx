import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  Calendar,
  ChevronDown,
  FileText,
  Home,
  LogOut,
  Settings,
  Users2,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { AdminPermission } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Fetch admin permissions
  const { data: permissions } = useQuery<AdminPermission>({
    queryKey: ['/api/admin/permissions'],
    enabled: !!user?.isAdmin,
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Mobile menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild className="md:hidden absolute top-4 left-4 z-30">
          <Button variant="outline" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SheetHeader className="py-4 px-6">
            <div className="flex justify-between items-center">
              <SheetTitle>TradeEdge Pro</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto px-3 py-2">
              <nav className="flex flex-col space-y-1">
                {renderNavItems(permissions, location, () => setIsOpen(false))}
              </nav>
            </div>
            <div className="px-3 py-4 border-t">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  {user?.name?.charAt(0) || user?.username?.charAt(0) || "A"}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium">{user?.name || user?.username}</p>
                  <p className="text-xs text-muted-foreground">{user?.adminRole || 'Admin'}</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:border-r bg-card">
        <div className="flex items-center h-16 px-6 border-b">
          <Link href="/admin" className="flex items-center">
            <span className="text-xl font-bold">TradeEdge Pro</span>
          </Link>
        </div>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto px-3 py-4">
            <nav className="flex flex-col space-y-1">
              {renderNavItems(permissions, location)}
            </nav>
          </div>
          <div className="px-3 py-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                      {user?.name?.charAt(0) || user?.username?.charAt(0) || "A"}
                    </div>
                    <div className="ml-2 text-left">
                      <p className="text-sm font-medium">{user?.name || user?.username}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                        {user?.adminRole || 'Admin'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <Link href="/admin/settings">
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-background">
        <header className="h-16 flex items-center px-6 border-b md:px-8">
          <div className="md:hidden w-8">
            {/* Spacer for mobile to align title */}
          </div>
          <div className="flex-1 flex justify-center md:justify-start">
            <h1 className="text-xl font-semibold">Admin Portal</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                Return to App
              </Button>
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

function renderNavItems(permissions: AdminPermission | undefined, currentPath: string, onClick?: () => void) {
  const navItems = [
    {
      path: "/admin",
      label: "Dashboard",
      icon: <Home className="h-5 w-5" />,
      visible: true,
    },
    {
      path: "/admin/users",
      label: "User Management",
      icon: <Users2 className="h-5 w-5" />,
      visible: permissions?.canManageUsers,
    },
    {
      path: "/admin/create-alert",
      label: "Create Alert",
      icon: <AlertCircle className="h-5 w-5" />,
      visible: permissions?.canCreateAlerts,
    },
    {
      path: "/admin/alerts",
      label: "Manage Alerts",
      icon: <AlertCircle className="h-5 w-5" />,
      visible: permissions?.canEditAlerts || permissions?.canDeleteAlerts,
    },
    {
      path: "/admin/education",
      label: "Education Content",
      icon: <BookOpen className="h-5 w-5" />,
      visible: permissions?.canCreateEducation || permissions?.canEditEducation || permissions?.canDeleteEducation,
    },
    {
      path: "/admin/articles",
      label: "Articles",
      icon: <FileText className="h-5 w-5" />,
      visible: permissions?.canCreateArticles || permissions?.canEditArticles || permissions?.canDeleteArticles,
    },
    {
      path: "/admin/coaching",
      label: "Coaching",
      icon: <Calendar className="h-5 w-5" />,
      visible: permissions?.canManageCoaching || permissions?.canManageGroupSessions || permissions?.canScheduleSessions,
    },
    {
      path: "/admin/performance",
      label: "Performance",
      icon: <BarChart3 className="h-5 w-5" />,
      visible: permissions?.canViewAnalytics,
    },
    {
      path: "/admin/settings",
      label: "Settings",
      icon: <Settings className="h-5 w-5" />,
      visible: true,
    },
  ];

  return navItems
    .filter((item) => item.visible)
    .map((item) => (
      <Link
        key={item.path}
        href={item.path}
        onClick={onClick}
      >
        <Button
          variant={currentPath === item.path ? "default" : "ghost"}
          className="w-full justify-start"
        >
          {React.cloneElement(item.icon, {
            className: `mr-2 h-5 w-5 ${currentPath === item.path ? "text-primary-foreground" : "text-muted-foreground"}`,
          })}
          {item.label}
        </Button>
      </Link>
    ));
}