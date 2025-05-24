import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getUserRole } from "@/lib/modassembly/supabase/profiles";
import { useEffect, useState } from "react";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingAccess, setIsCheckingAccess] = useState(false);

  useEffect(() => {
    // Only check access if we have a user
    if (!user) {
      return;
    }

    setIsCheckingAccess(true);
    
    // Check admin role
    checkUserRole(String(user.id))
      .then((roleResult) => {
        setIsAdmin(roleResult);
      })
      .catch(() => {
        setIsAdmin(false);
      })
      .finally(() => setIsCheckingAccess(false));
  }, [user]);

  // Helper function to check user role
  const checkUserRole = async (userId: string): Promise<boolean> => {
    const data = await getUserRole(userId);
    if (data) {
      return data.role === 'admin';
    }
    return false;
  };

  // Show loading while checking auth or access
  if (isLoading || isCheckingAccess) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </Route>
    );
  }

  return (
    <Route path={path}>
      {!user ? (
        <Redirect to="/auth" />
      ) : isAdmin === false ? (
        <Redirect to="/dashboard" />
      ) : (
        <Component />
      )}
    </Route>
  );
}
