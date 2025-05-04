import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { User as UserType } from "@shared/schema";

export default function DemoUserManagementPage() {
  const [_, setLocation] = useLocation();
  
  // Fetch demouser data - we know the ID is 1
  const { data: user, isLoading } = useQuery<UserType>({
    queryKey: ["/api/admin/users/1"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/admin/users/1");
        if (!res.ok) {
          throw new Error(`Failed to fetch user data: ${res.statusText}`);
        }
        return await res.json();
      } catch (error) {
        console.error("Error fetching demouser data:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Error loading demouser:", error);
      toast({
        title: "Error Loading User",
        description: "Could not load demouser data. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Redirect to the regular manage-combined page with the proper ID
  useEffect(() => {
    if (user && user.id) {
      console.log("Redirecting to proper manage page with ID:", user.id);
      // Small delay to ensure we have time to see the log message
      const redirectTimer = setTimeout(() => {
        setLocation(`/admin/users/manage-combined/${user.id}`);
      }, 200);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [user, setLocation]);

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 size={40} className="animate-spin mb-4 text-primary" />
          <h2 className="text-xl font-medium mb-2">Loading Demouser Data</h2>
          <p className="text-gray-500">Please wait while we prepare the management interface...</p>
        </div>
      </div>
    </AdminLayout>
  );
}