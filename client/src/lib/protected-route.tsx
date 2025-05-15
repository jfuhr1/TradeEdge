import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [hasTier, setHasTier] = useState<boolean | null>(null);
  const [isCheckingTier, setIsCheckingTier] = useState(true);
  
  // Check for demo mode in localStorage
  const isDemoMode = localStorage.getItem('demoMode') === 'true';

  useEffect(() => {
    async function checkTier() {
      if (!user) {
        setIsCheckingTier(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('stripe_tier')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setHasTier(!!data.stripe_tier);
      } catch (error) {
        console.error('Error checking tier:', error);
        setHasTier(false);
      } finally {
        setIsCheckingTier(false);
      }
    }

    checkTier();
  }, [user]);

  return (
    <Route path={path}>
      {isLoading || isCheckingTier ? (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : user ? (
        hasTier ? (
          <Component />
        ) : path === "/subscribe" ? (
          <Component />
        ) : (
          <Redirect to="/subscribe" />
        )
      ) : isDemoMode ? (
        <Component />
      ) : (
        <Redirect to="/auth" />
      )}
    </Route>
  );
}
