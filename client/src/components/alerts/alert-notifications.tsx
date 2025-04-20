import { useEffect, useState } from "react";
import { useWebSocket } from "@/hooks/use-websocket";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Bell } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

type AlertTrigger = {
  userId: number;
  stockAlertId: number;
  triggerType: string;
  message: string;
  timestamp?: string;
};

export function AlertNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected, lastMessage } = useWebSocket();
  const [notifications, setNotifications] = useState<AlertTrigger[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  
  // Process incoming alert triggers from WebSocket
  useEffect(() => {
    if (lastMessage && lastMessage.type === "alert_trigger") {
      const trigger = lastMessage.data as AlertTrigger;
      
      // Only process alerts for the current user
      if (user && trigger.userId === user.id) {
        // Add timestamp for display purposes
        const notificationWithTimestamp = {
          ...trigger,
          timestamp: new Date().toISOString(),
        };
        
        // Add to notifications list
        setNotifications(prev => [notificationWithTimestamp, ...prev]);
        
        // Increment unread count if popover is closed
        if (!isOpen) {
          setUnreadCount(prev => prev + 1);
        }
        
        // Show toast notification
        toast({
          title: `Alert for ${getTriggerTitle(trigger.triggerType)}`,
          description: trigger.message,
        });
      }
    }
  }, [lastMessage, user, toast, isOpen]);
  
  // Reset unread count when opening the popover
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);
  
  // Helper function to format trigger types for display
  const getTriggerTitle = (triggerType: string) => {
    switch (triggerType) {
      case 'target1':
        return 'Target 1';
      case 'target2':
        return 'Target 2';
      case 'target3':
        return 'Target 3';
      case 'percent':
        return 'Percent Change';
      case 'custom':
        return 'Custom Target';
      default:
        return 'Price Alert';
    }
  };

  // Format timestamps
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (!user || !connected) {
    return null;
  }
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 flex items-center justify-between">
          <h3 className="font-medium">Alerts</h3>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setNotifications([])}
            >
              Clear All
            </Button>
          )}
        </div>
        <Separator />
        <ScrollArea className="h-80">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 p-4 text-center">
              <Bell className="text-muted-foreground h-8 w-8 mb-2" />
              <p className="text-muted-foreground">No alerts yet</p>
              <p className="text-xs text-muted-foreground mt-1">Alerts will appear here when stock prices hit your targets</p>
            </div>
          ) : (
            <div className="flex flex-col">
              {notifications.map((notification, index) => (
                <div key={`${notification.stockAlertId}-${index}`} className="p-4 border-b last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <Badge variant="outline" className="mr-2">
                          {getTriggerTitle(notification.triggerType)}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {notification.timestamp && formatTime(notification.timestamp)}
                        </span>
                      </div>
                      <p className="mt-2">{notification.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}