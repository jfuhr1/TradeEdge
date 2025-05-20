import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getUserTier } from "@/lib/modassembly/supabase/profiles";
import { useEffect, useState } from "react";

// Constants for localStorage
const TIER_CACHE_KEY = 'userTier';

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

    const getCachedTier = (userId: string) => {
      const cachedTier = localStorage.getItem(`${TIER_CACHE_KEY}_${userId}`);
      return cachedTier ? JSON.parse(cachedTier) : null;
    };

    const setCachedTier = (userId: string, tierData: any) => {
      localStorage.setItem(`${TIER_CACHE_KEY}_${userId}`, JSON.stringify(tierData));
    };
    
    async function checkTier() {
      if (!user) {
        if (isMounted) {
          setIsCheckingTier(false);
        }
        return;
      }

      setIsCheckingTier(true);

      // Check cache first
      const cachedTierData = getCachedTier(String(user.id));
      if (cachedTierData !== null) {
        if (isMounted) {
          setHasTier(cachedTierData.stripe_tier !== null);
          setIsCheckingTier(false);
        }
        return;
      }

      try {
        const data = await getUserTier(String(user.id));

        if (!data) {
          throw new Error('Failed to get user tier data');
        }
        
        if (isMounted) {
          // Consider "free" as a valid tier - only redirect if tier is null
          setHasTier(data.stripe_tier !== null);
          setIsCheckingTier(false);
          // Cache the result
          setCachedTier(String(user.id), data);
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
  }, [user, isLoading]);

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
