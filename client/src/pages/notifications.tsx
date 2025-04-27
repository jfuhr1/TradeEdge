import { NotificationsTab } from "@/components/notifications/notifications-tab";
import { Container } from "@/components/ui/container";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink } from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";

export default function NotificationsPage() {
  return (
    <Container className="py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center">
            <Home className="h-4 w-4 mr-1" />
            Home
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem>
          <ChevronRight className="h-4 w-4" />
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink>Notifications</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      
      <NotificationsTab />
    </Container>
  );
}