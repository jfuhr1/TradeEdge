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

  // This effect handles the tier check
  useEffect(() => {
    let isMounted = true;
    
    async function checkTier() {
      if (!user) {
        if (isMounted) {
          setIsCheckingTier(false);
        }
        return;
      }

      setIsCheckingTier(true); // Ensure we're in checking state

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('stripe_tier')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (isMounted) {
          // Consider "free" as a valid tier - only redirect if tier is null
          setHasTier(data.stripe_tier !== null);
          setIsCheckingTier(false);
        }
      } catch (error) {
        if (isMounted) {
          setHasTier(false);
          setIsCheckingTier(false);
        }
      }
    }

    // Wait for user to be loaded before checking tier
    if (!isLoading) {
      if (user) {
        checkTier();
      } else {
        setIsCheckingTier(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user, isLoading]); // Add isLoading as a dependency

  // Check if we're on the subscribe page
  const isSubscribePage = path === "/subscribe";

  // Simplify the loading condition
  const showLoading = isLoading || (user && isCheckingTier);
  
  // Only show loading for non-subscribe pages if we're checking tier
  if (showLoading && !isSubscribePage) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading...</span>
        </div>
      </Route>
    );
  }

  // Only when we're done checking everything, decide on rendering
  return (
    <Route path={path}>
      {!user && !isDemoMode ? (
        <Redirect to="/auth" />
      ) : hasTier === false && !isSubscribePage ? (
        <Redirect to="/subscribe" />
      ) : (
        <Component />
      )}
    </Route>
  );
}
