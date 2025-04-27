import { UserNotification } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Bell, AlertCircle, BookOpen, TrendingUp, Clock, Target } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface NotificationCardProps {
  notification: UserNotification;
  onDismiss?: () => void;
}

export function NotificationCard({ notification, onDismiss }: NotificationCardProps) {
  const {
    id,
    title,
    message,
    category,
    read,
    createdAt,
    linkUrl,
    important,
    icon
  } = notification;

  // Determine icon based on category or specified icon
  const getIcon = () => {
    if (icon) {
      // If a specific icon is provided in the notification
      return icon;
    }
    
    // Default icons based on category
    switch (category) {
      case 'stock_alert':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'target_approach':
        return <Target className="h-5 w-5 text-amber-500" />;
      case 'education':
        return <BookOpen className="h-5 w-5 text-green-500" />;
      case 'article':
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getCategoryBadge = () => {
    switch (category) {
      case 'stock_alert':
        return <Badge variant="default" className="bg-blue-500">Stock Alert</Badge>;
      case 'target_approach':
        return <Badge variant="default" className="bg-amber-500">Target Approaching</Badge>;
      case 'education':
        return <Badge variant="default" className="bg-green-500">Education</Badge>;
      case 'article':
        return <Badge variant="default" className="bg-purple-500">Article</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  const markAsRead = async () => {
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

  return (
    <Card className={`mb-3 relative transition duration-300 ${read ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700 shadow-md'} ${important ? 'border-l-4 border-l-red-500' : ''}`}>
      {!read && (
        <div className="absolute top-2 right-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={markAsRead}
            className="h-6 w-6 text-muted-foreground hover:text-primary"
            title="Mark as read"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {typeof getIcon() === 'string' ? (
              <span className="material-icons text-xl">{getIcon()}</span>
            ) : (
              getIcon()
            )}
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 items-center mb-1">
              <h4 className="font-semibold text-base">{title}</h4>
              {getCategoryBadge()}
              {important && (
                <Badge variant="outline" className="border-red-500 text-red-500">
                  <AlertCircle className="h-3 w-3 mr-1" /> Important
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{message}</p>
            <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
              </span>
              {linkUrl && (
                <Link to={linkUrl}>
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    View details
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}