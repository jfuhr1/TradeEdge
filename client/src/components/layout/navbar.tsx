import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { AlertNotifications } from "@/components/alerts/alert-notifications";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  BarChart2,
  BookOpen,
  Calendar,
  Home,
  LogOut,
  Menu,
  Settings,
  User,
  Trophy,
  X
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Different navbar for logged out users
  if (!user) {
    return (
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center mr-6">
              <span className="font-bold text-xl">TradeEdge Pro</span>
            </Link>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="default" size="sm" asChild>
              <Link href="/auth">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>
    );
  }

  const isAdmin = user?.isAdmin === true;

  const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: <Home className="h-4 w-4 mr-2" /> },
    { label: "Stock Alerts", href: "/stock-alerts", icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { label: "Portfolio", href: "/portfolio", icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { label: "Education", href: "/education", icon: <BookOpen className="h-4 w-4 mr-2" /> },
    { label: "Coaching", href: "/coaching", icon: <Calendar className="h-4 w-4 mr-2" /> },
  ];

  const mobileNav = (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="font-bold text-2xl">TradeEdge Pro</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Separator className="mb-6" />
          <div className="space-y-2">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant={location === item.href ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link href={item.href}>
                  {item.icon}
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button
              variant={location === "/settings" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
              onClick={() => setIsOpen(false)}
            >
              <Link href="/settings">
                <Settings className="h-4 w-4 mr-2" />
                User Settings
              </Link>
            </Button>
            <Button
              variant={location === "/notification-settings" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
              onClick={() => setIsOpen(false)}
            >
              <Link href="/notification-settings">
                <Settings className="h-4 w-4 mr-2" />
                Notification Settings
              </Link>
            </Button>
            <Button
              variant={location === "/alert-settings" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
              onClick={() => setIsOpen(false)}
            >
              <Link href="/alert-settings">
                <Settings className="h-4 w-4 mr-2" />
                Alert Settings
              </Link>
            </Button>
            
            {isAdmin && (
              <Button
                variant={location.startsWith("/admin") ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
                onClick={() => setIsOpen(false)}
              >
                <Link href="/admin/create-alert">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin
                </Link>
              </Button>
            )}
          </div>
          <Separator className="my-6" />
          <div className="space-y-2">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>{user.name} ({user.email})</span>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground">
                {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier
              </span>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-red-500"
              onClick={() => logoutMutation.mutate()}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  const desktopNav = (
    <div className="flex items-center space-x-1">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant={location === item.href ? "default" : "ghost"}
          size="sm"
          asChild
        >
          <Link href={item.href}>{item.label}</Link>
        </Button>
      ))}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            Settings
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/settings">User Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/notification-settings">Notification Settings</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/alert-settings">Alert Settings</Link>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/admin/create-alert">Create Alert</Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const userDropdown = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {user.name}
          <ChevronDown className="ml-1 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <span className="text-sm font-medium">
            {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)} Tier
          </span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logoutMutation.mutate()}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          {isMobile && mobileNav}
          <Link href="/dashboard" className="flex items-center mr-6">
            <span className="font-bold text-xl">TradeEdge Pro</span>
          </Link>
          {!isMobile && desktopNav}
        </div>
        <div className="flex items-center space-x-2">
          <AlertNotifications />
          {!isMobile && userDropdown}
        </div>
      </div>
    </header>
  );
}