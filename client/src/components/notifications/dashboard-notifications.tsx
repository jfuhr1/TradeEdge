import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserNotification } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, ChevronDown, ChevronUp, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export function DashboardNotifications() {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(true);
  const limit = 5; // Default number of notifications to show

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<UserNotification[]>({
    queryKey: ["/api/notifications"],
    enabled: !!user && isExpanded,
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/notifications?limit=${limit}`);
      return response.json();
    }
  });

  const { data: stats } = useQuery<{ totalUnread: number }>({
    queryKey: ["/api/notifications/stats"],
    enabled: !!user
  });

  const unreadCount = stats?.totalUnread || 0;

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const markAsRead = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/notifications/${id}/read`);
      // Invalidate notifications queries to reflect the change
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread"] });
      queryClient.invalidateQueries({ queryKey: ["/api/notifications/stats"] });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Get icon based on notification category
  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'stock_alert':
        return "bg-blue-100 text-blue-600";
      case 'target_approach':
        return "bg-amber-100 text-amber-600";
      case 'education':
        return "bg-green-100 text-green-600";
      case 'article':
        return "bg-purple-100 text-purple-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // Get short text for the category
  const getCategoryShortText = (category: string) => {
    switch (category) {
      case 'stock_alert':
        return "Stock";
      case 'target_approach':
        return "Target";
      case 'education':
        return "Edu";
      case 'article':
        return "Article";
      default:
        return category;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Card className="mb-8">
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold">Recent Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="rounded-full text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="h-8 px-2">
                <ChevronRight className="h-4 w-4" />
                <span className="ml-1">View all</span>
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleExpand} 
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="px-4 pt-0 pb-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !notifications?.length ? (
            <div className="text-center py-3">
              <Bell className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
              <p className="text-sm text-muted-foreground mt-1">No notifications yet</p>
            </div>
          ) : (
            <ul className="space-y-1 text-sm">
              {notifications.map((notification) => (
                <li 
                  key={notification.id} 
                  className={cn(
                    "flex items-start py-1 px-1 rounded-md hover:bg-accent/50 transition-colors",
                    notification.read ? "opacity-70" : "font-medium"
                  )}
                >
                  <div className="flex-shrink-0 mr-2 mt-0.5">
                    <span className={cn(
                      "inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-medium",
                      getIconForCategory(notification.category)
                    )}>
                      {getCategoryShortText(notification.category)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="truncate max-w-[200px] text-xs">
                        {notification.title}
                      </p>
                      <span className="text-[10px] text-muted-foreground ml-1 whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => markAsRead(notification.id)}
                      className="h-5 w-5 text-muted-foreground hover:text-foreground ml-1"
                      title="Mark as read"
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}