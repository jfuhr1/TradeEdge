import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  
  // Check for demo mode in localStorage
  const isDemoMode = localStorage.getItem('demoMode') === 'true';

  return (
    <Route path={path}>
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user || isDemoMode ? (
        <Component />
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}
