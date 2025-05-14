import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
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
  
  // Check if we are in demo mode from localStorage
  const isDemoMode = localStorage.getItem('demoMode') === 'true';
  
  // Create a demo user
  const demoUser: SelectUser = {
    id: 9999,
    username: "demo_user",
    password: "",
    email: "demo@tradeedgepro.com",
    firstName: "Jane",
    lastName: "Smith",
    phone: null,
    tier: "standard",
    profilePicture: null,
    completedLessons: [],
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    isAdmin: true, // Set to true to allow admin access in demo mode
    createdAt: new Date()
  };
  
  const {
    data: user,
    error,
    isLoading,
    refetch: refetchUser
  } = useQuery<SelectUser | null, Error>({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (!authUser) return null;

      // Get additional profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (!profile) return null;

      // Combine auth user and profile data
      return {
        id: authUser.id,
        email: authUser.email!,
        username: profile.username,
        firstName: profile.full_name?.split(' ')[0] || '',
        lastName: profile.full_name?.split(' ')[1] || '',
        phone: profile.phone_number,
        tier: "free", // Default to free, update based on your subscription logic
        profilePicture: null,
        completedLessons: [],
        stripeCustomerId: null,
        stripeSubscriptionId: null,
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

  // Use demo user if in demo mode, otherwise use server user
  const authUser = isDemoMode ? demoUser : user;

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) throw error;
      if (!user) throw new Error('No user returned after login');

      // Get profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email!,
        username: profile.username,
        firstName: profile.full_name?.split(' ')[0] || '',
        lastName: profile.full_name?.split(' ')[1] || '',
        phone: profile.phone_number,
        tier: "free",
        profilePicture: null,
        completedLessons: [],
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        isAdmin: false,
        createdAt: new Date(user.created_at)
      };
    },
    onSuccess: (user: SelectUser) => {
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
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          username: data.username,
          full_name: `${data.firstName} ${data.lastName}`
        })
        .eq('id', user.id);

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
    onSuccess: (user: SelectUser) => {
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
        user: authUser ?? null,
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
