import { NotificationsTab } from "@/components/notifications/notifications-tab";
import { ChevronRight, Home } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="container mx-auto px-4 md:px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center text-sm text-muted-foreground">
        <span className="inline-flex items-center">
          <a href="/" className="transition-colors hover:text-foreground flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Home
          </a>
        </span>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="inline-flex items-center">
          <a href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </a>
        </span>
        <ChevronRight className="mx-2 h-4 w-4" />
        <span className="inline-flex items-center font-medium text-foreground">
          Notifications
        </span>
      </div>
      
      <NotificationsTab />
    </div>
  );
}