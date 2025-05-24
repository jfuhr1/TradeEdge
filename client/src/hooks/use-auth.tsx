import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/modassembly/supabase/client";
import { getProfile, updateProfile } from "@/lib/modassembly/supabase/profiles";

// Custom user type for Supabase context (UUID instead of number ID)
type SupabaseUser = {
  id: string; // UUID from Supabase
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  tier: string;
  profilePicture: string | null;
  completedLessons: any[];
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  isAdmin: boolean;
  createdAt: Date;
};

type AuthContextType = {
  user: SupabaseUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SupabaseUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SupabaseUser, Error, RegisterData>;
};

type LoginData = {
  email: string;
  password: string;
};

type RegisterData = {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<SupabaseUser | null, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return null;

      // Get additional profile data
      const profile = await getProfile(authUser.id);

      if (!profile) return null;

      // Combine auth user and profile data
      return {
        id: authUser.id,
        email: authUser.email!,
        username: profile.username,
        firstName: profile.full_name?.split(' ')[0] || '',
        lastName: profile.full_name?.split(' ')[1] || '',
        phone: profile.phone_number,
        tier: profile.stripe_tier || "free",
        profilePicture: null,
        completedLessons: [],
        stripeCustomerId: profile.stripe_customer_id || null,
        stripeSubscriptionId: profile.stripe_subscription_id || null,
        isAdmin: false, // You'll need to implement admin role logic
        createdAt: new Date(authUser.created_at)
      };
    }
  });

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        refetchUser();
      } else if (event === 'SIGNED_OUT') {
        refetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refetchUser]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!user) throw new Error('No user returned after login');

      // Get profile data
      const profile = await getProfile(user.id);

      return {
        id: user.id,
        email: user.email!,
        username: profile.username,
        firstName: profile.full_name?.split(' ')[0] || '',
        lastName: profile.full_name?.split(' ')[1] || '',
        phone: profile.phone_number,
        tier: profile.stripe_tier || "free",
        profilePicture: null,
        completedLessons: [],
        stripeCustomerId: profile.stripe_customer_id || null,
        stripeSubscriptionId: profile.stripe_subscription_id || null,
        isAdmin: false,
        createdAt: new Date(user.created_at)
      };
    },
    onSuccess: (user: SupabaseUser) => {
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.firstName} ${user.lastName}!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      // Step 1: Sign up with Supabase Auth
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: `${data.firstName} ${data.lastName}`
          }
        }
      });

      if (signUpError) throw signUpError;
      if (!user) throw new Error('No user returned after registration');

      // Step 2: Update profile with additional information
      const { error: profileError } = await updateProfile(user.id, {
        username: data.username,
        full_name: `${data.firstName} ${data.lastName}`
      });

      if (profileError) throw profileError;

      return {
        id: user.id,
        email: user.email!,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: null,
        tier: "free",
        profilePicture: null,
        completedLessons: [],
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        isAdmin: false,
        createdAt: new Date(user.created_at)
      };
    },
    onSuccess: (user: SupabaseUser) => {
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
