import { useQuery } from "@tanstack/react-query";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { UserNotification } from "@shared/schema";
import { NotificationCard } from "./notification-card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export function NotificationPopover() {
  const { user } = useAuth();
  
  const { data: unreadNotifications, isLoading } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  interface NotificationStats {
    totalUnread: number;
    categoryCounts: Record<string, number>;
  }

  const { data: stats } = useQuery<NotificationStats>({
    queryKey: ["/api/notifications/stats"],
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!user) return null;

  const unreadCount = stats?.totalUnread || 0;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Recent Notifications</h4>
            <Link to="/notifications">
              <Button variant="ghost" size="sm" className="p-0 h-auto text-xs">
                View all
              </Button>
            </Link>
          </div>
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2">
          {isLoading ? (
            <div className="space-y-4 p-4">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : unreadNotifications?.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No new notifications
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {unreadNotifications?.slice(0, 5).map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
              {unreadNotifications && unreadNotifications.length > 5 && (
                <div className="text-center p-2 text-sm text-muted-foreground">
                  <Link to="/notifications">
                    <Button variant="ghost" size="sm">
                      View {unreadNotifications.length - 5} more notifications
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}