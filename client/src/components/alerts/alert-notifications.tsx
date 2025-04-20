import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { Bell, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { AlertPreference, StockAlert } from "@shared/schema";

interface AlertMessage {
  id: string;
  userId: number;
  stockAlertId: number;
  stockSymbol?: string;
  triggerType: string;
  message: string;
  createdAt: Date;
  read: boolean;
}

export function AlertNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { socket, connected } = useWebSocket();
  const [notifications, setNotifications] = useState<AlertMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  // Fetch user's alert preferences
  const { data: alertPreferences } = useQuery<AlertPreference[]>({
    queryKey: ['/api/alert-preferences'],
    enabled: !!user,
  });

  // Fetch stock alerts to get symbols
  const { data: stockAlerts } = useQuery<StockAlert[]>({
    queryKey: ['/api/stock-alerts'],
    enabled: !!user,
  });

  useEffect(() => {
    if (!socket || !connected || !user) return;

    const handleAlertTrigger = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'alert_trigger' && data.data.userId === user.id) {
        const stockAlert = stockAlerts?.find(alert => alert.id === data.data.stockAlertId);
        const stockSymbol = stockAlert?.symbol || 'Unknown';
        
        // Create a new notification
        const newNotification: AlertMessage = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          userId: data.data.userId,
          stockAlertId: data.data.stockAlertId,
          stockSymbol,
          triggerType: data.data.triggerType,
          message: data.data.message,
          createdAt: new Date(),
          read: false
        };
        
        setNotifications(prev => [newNotification, ...prev].slice(0, 10));
        setUnreadCount(prev => prev + 1);
        
        // Show toast for new notification
        toast({
          title: `${stockSymbol} Alert`,
          description: data.data.message,
        });
      }
    };

    // Check for custom event listener or fallback to basic
    if (socket.addEventListener) {
      socket.addEventListener('message', handleAlertTrigger);
    } else {
      socket.onmessage = handleAlertTrigger;
    }

    return () => {
      if (socket.removeEventListener) {
        socket.removeEventListener('message', handleAlertTrigger);
      } else {
        socket.onmessage = null;
      }
    };
  }, [socket, connected, user, stockAlerts, toast]);

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(note => ({ ...note, read: true })));
    setUnreadCount(0);
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(note => 
        note.id === id ? { ...note, read: true } : note
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => {
      const notification = prev.find(note => note.id === id);
      if (notification && !notification.read) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(note => note.id !== id);
    });
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 px-1.5 min-w-[20px] h-5 flex items-center justify-center"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <h3 className="font-medium">Notifications</h3>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 relative ${
                  notification.read ? "" : "bg-primary-50"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      markAsRead(notification.id);
                      setOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{notification.stockSymbol}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(notification.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{notification.message}</p>
                    <div className="mt-2">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-primary"
                        asChild
                      >
                        <Link href={`/stock/${notification.stockAlertId}`}>
                          View Stock Details
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            asChild
          >
            <Link href="/alert-settings">
              Manage Alert Settings
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}