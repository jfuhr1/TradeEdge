import React, { useState, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import {
  BarChart3,
  Users,
  BellRing,
  GraduationCap,
  CalendarDays,
  FileText,
  Settings,
  Menu,
  X,
  Home,
  LogOut,
  Ticket,
  Tags,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { logoutMutation } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const { hasPermission, canManageAdmins, isLoading } = useAdminPermissions();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
      requiredPermission: null, // Accessible to all admins
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      requiredPermission: "canManageUsers",
    },
    {
      name: "Analytics",
      href: "/admin/analytics",
      icon: BarChart3,
      requiredPermission: "canViewAnalytics",
    },
    {
      name: "Stock Alerts",
      href: "/admin/stock-alerts",
      icon: BellRing,
      requiredPermission: "canCreateAlerts",
    },
    {
      name: "Education",
      href: "/admin/education",
      icon: GraduationCap,
      requiredPermission: "canCreateEducation",
    },
    {
      name: "Coaching",
      href: "/admin/coaching",
      icon: CalendarDays,
      requiredPermission: "canManageCoaching",
    },
    {
      name: "Content",
      href: "/admin/content",
      icon: FileText,
      requiredPermission: "canCreateContent",
    },
    {
      name: "Promotions",
      href: "/admin/promotions",
      icon: Percent,
      requiredPermission: "canManageUsers", // Using user management permission
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      requiredPermission: null, // Accessible to all admins
    },
  ];

  // Utility function to check if a nav item should be shown
  const shouldShowNavItem = (item: any) => {
    // If no specific permission is required, show to all admins
    if (item.requiredPermission === null) {
      return true;
    }
    
    // For admin management, use the special canManageAdmins check
    if (item.requiredPermission === "canManageAdmins") {
      return canManageAdmins();
    }

    // Otherwise, check the specific permission
    return hasPermission(item.requiredPermission as any);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Navigation Toggle */}
      <div className="md:hidden p-4 border-b flex items-center justify-between sticky top-0 bg-background z-10">
        <h1 className="text-lg font-semibold">TradeEdge Pro Admin</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
        >
          {mobileNavOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile Navigation */}
      {mobileNavOpen && (
        <div className="md:hidden fixed inset-0 bg-background z-50 pt-16">
          <ScrollArea className="h-full">
          <nav className="px-2 py-4">
            {navigationItems.filter(shouldShowNavItem).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileNavOpen(false)}
              >
                <a
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium my-1 ${
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 mr-2 shrink-0" />
                  {item.name}
                </a>
              </Link>
            ))}
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => logoutMutation.mutate()}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
          </ScrollArea>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 border-r shrink-0">
        <div className="p-6">
          <h1 className="text-xl font-bold">TradeEdge Pro</h1>
          <p className="text-sm text-muted-foreground">Admin Portal</p>
        </div>
        <nav className="flex-1 px-4 py-2">
          {navigationItems.filter(shouldShowNavItem).map((item) => (
            <Link key={item.name} href={item.href}>
              <a
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium my-1 ${
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-4 w-4 mr-2 shrink-0" />
                {item.name}
              </a>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}