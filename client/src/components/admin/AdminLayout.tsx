import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAdminPermissions } from '@/hooks/use-admin-permissions';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Users,
  BookOpenText,
  FileText,
  Calendar,
  BellRing,
  Settings,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [location] = useLocation();
  const { currentUserPermissions, isLoadingPermissions } = useAdminPermissions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <BarChart3 className="h-5 w-5" />,
      showWhen: () => true,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Users className="h-5 w-5" />,
      showWhen: () => currentUserPermissions?.canManageUsers || currentUserPermissions?.canManageAdmins,
    },
    {
      name: 'Alerts',
      href: '/admin/alerts',
      icon: <BellRing className="h-5 w-5" />,
      showWhen: () => currentUserPermissions?.canCreateAlerts || currentUserPermissions?.canEditAlerts || currentUserPermissions?.canDeleteAlerts,
    },
    {
      name: 'Education',
      href: '/admin/education',
      icon: <BookOpenText className="h-5 w-5" />,
      showWhen: () => currentUserPermissions?.canCreateEducation || currentUserPermissions?.canEditEducation || currentUserPermissions?.canDeleteEducation,
    },
    {
      name: 'Articles',
      href: '/admin/articles',
      icon: <FileText className="h-5 w-5" />,
      showWhen: () => currentUserPermissions?.canCreateArticles || currentUserPermissions?.canEditArticles || currentUserPermissions?.canDeleteArticles,
    },
    {
      name: 'Coaching',
      href: '/admin/coaching',
      icon: <Calendar className="h-5 w-5" />,
      showWhen: () => currentUserPermissions?.canManageCoaching || currentUserPermissions?.canManageGroupSessions,
    },
    {
      name: 'Analytics',
      href: '/admin/performance',
      icon: <BarChart3 className="h-5 w-5" />,
      showWhen: () => currentUserPermissions?.canViewAnalytics,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Settings className="h-5 w-5" />,
      showWhen: () => true,
    }
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div 
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-card shadow-md transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-0 lg:w-20",
          isMobile && !isSidebarOpen && "hidden"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 py-4">
          <div className={cn("flex items-center", !isSidebarOpen && "lg:hidden")}>
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex"
          >
            <ChevronLeft className={cn("h-5 w-5 transition-all", !isSidebarOpen && "rotate-180")} />
          </Button>
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              item.showWhen() && (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors hover:bg-accent",
                      location === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                      !isSidebarOpen && "justify-center lg:px-2"
                    )}
                  >
                    {item.icon}
                    <span className={cn("ml-3", !isSidebarOpen && "hidden")}>{item.name}</span>
                  </a>
                </Link>
              )
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile overlay */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div 
        className={cn(
          "flex-1 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
        )}
      >
        <div className="sticky top-0 z-30 flex h-16 items-center bg-card shadow-sm px-4 lg:px-6">
          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarOpen(true)}
              className="mr-2"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-lg font-medium">TradeEdge Pro - Admin</h1>
          </div>
          <div className="ml-auto flex items-center space-x-4">
            <Link href="/">
              <a className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Return to App
              </a>
            </Link>
          </div>
        </div>
        
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}