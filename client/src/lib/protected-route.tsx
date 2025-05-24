import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getUserTier } from "@/lib/modassembly/supabase/profiles";
import { useEffect, useState } from "react";

// Constants for localStorage
const TIER_CACHE_KEY = 'userTier';
const TIER_CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element | null;
}) {
  const { user, isLoading } = useAuth();
  const [hasTier, setHasTier] = useState<boolean | null>(null);
  const [isCheckingTier, setIsCheckingTier] = useState(false);
  
  // Check for demo mode
  const isDemoMode = localStorage.getItem('demoMode') === 'true';
  // Check if we're on the subscribe page
  const isSubscribePage = path === "/subscribe";

  useEffect(() => {
    // Only check tier if we have a user and not already on subscribe page
    if (!user || isSubscribePage) {
      return;
    }

    setIsCheckingTier(true);
    
    // Check cache first
    const cachedTierData = getCachedTier(String(user.id));
    if (cachedTierData !== null) {
      setHasTier(cachedTierData.stripe_tier !== null);
      setIsCheckingTier(false);
      return;
    }
    
    // If no cache or expired, check tier status
    getUserTier(String(user.id))
      .then(data => {
        if (data) {
          // User has a valid tier if stripe_tier is not null
          setHasTier(data.stripe_tier !== null);
          // Cache the result
          setCachedTier(String(user.id), data);
        } else {
          setHasTier(false);
        }
      })
      .catch(() => setHasTier(false))
      .finally(() => setIsCheckingTier(false));
  }, [user, isSubscribePage]);

  // Show loading while checking auth or tier
  if (isLoading || isCheckingTier) {
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

// Helper functions for caching
function getCachedTier(userId: string) {
  try {
    const cachedItem = localStorage.getItem(`${TIER_CACHE_KEY}_${userId}`);
    if (!cachedItem) return null;
    
    const { data, timestamp } = JSON.parse(cachedItem);
    
    // Check if cache is expired
    if (Date.now() - timestamp > TIER_CACHE_EXPIRY) {
      localStorage.removeItem(`${TIER_CACHE_KEY}_${userId}`);
      return null;
    }
    
    return data;
  } catch (error) {
    return null;
  }
}

function setCachedTier(userId: string, tierData: any) {
  try {
    const cacheItem = {
      data: tierData,
      timestamp: Date.now()
    };
    localStorage.setItem(`${TIER_CACHE_KEY}_${userId}`, JSON.stringify(cacheItem));
  } catch (error) {
    // Silently fail if localStorage is not available
  }
}
