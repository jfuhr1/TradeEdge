import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { NotificationCard } from "./notification-card";
import { UserNotification } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Check, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function NotificationsTab() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>("all");
  const [categoryFilters, setCategoryFilters] = useState<Record<string, boolean>>({
    stock_alert: true,
    target_approach: true,
    education: true,
    article: true,
  });

  const { data: notifications, isLoading } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const { data: unreadNotifications, isLoading: isLoadingUnread } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications/unread"],
    enabled: !!user,
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/notifications/stats"],
    enabled: !!user,
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PUT", "/api/notifications/read/all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/stats"] });
    },
  });

  const handleToggleCategory = (category: string) => {
    setCategoryFilters(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const filterNotifications = (notifs: UserNotification[] | undefined) => {
    if (!notifs) return [];
    return notifs.filter(notification => categoryFilters[notification.category]);
  };

  if (!user) {
    return (
      <Alert>
        <AlertTitle>Authentication required</AlertTitle>
        <AlertDescription>
          Please sign in to view your notifications.
        </AlertDescription>
      </Alert>
    );
  }

  const filteredNotifications = filterNotifications(
    filter === "unread" ? unreadNotifications : notifications
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <div className="flex items-center gap-2">
          {/* Category filter dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={categoryFilters.stock_alert}
                onCheckedChange={() => handleToggleCategory('stock_alert')}
              >
                Stock Alerts
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={categoryFilters.target_approach}
                onCheckedChange={() => handleToggleCategory('target_approach')}
              >
                Approaching Targets
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={categoryFilters.education}
                onCheckedChange={() => handleToggleCategory('education')}
              >
                Educational Content
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={categoryFilters.article}
                onCheckedChange={() => handleToggleCategory('article')}
              >
                Articles
              </DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <div className="p-2 text-xs text-muted-foreground">
                Filter notifications by category
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mark all as read button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending || (unreadNotifications?.length === 0)}
          >
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setFilter}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all" className="relative">
            All
            {stats?.totalUnread > 0 && filter !== "all" && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread" className="relative">
            Unread
            {stats?.totalUnread > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {stats.totalUnread}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          {isLoading || isLoadingUnread ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-xl font-semibold">No notifications</h3>
              <p className="text-muted-foreground">
                {filter === "unread"
                  ? "You've read all your notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <NotificationCard key={notification.id} notification={notification} />
              ))}
            </div>
          )}
        </div>
      </Tabs>
    </div>
  );
}