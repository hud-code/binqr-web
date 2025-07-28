"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getCurrentUser, onAuthStateChange, signOut } from "@/lib/auth";
import type { AuthUser, Profile } from "@/lib/types";

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

// Routes that should redirect to login if not authenticated
const PROTECTED_ROUTES = [
  "/",
  "/create",
  "/scan",
  "/search",
  "/locations",
  "/settings",
];

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = !!user;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isProtectedRoute = PROTECTED_ROUTES.includes(pathname);

  const refreshProfile = async () => {
    if (!user) return;

    try {
      // Import here to avoid circular dependencies
      const { getUserProfile } = await import("@/lib/auth");
      const userProfile = await getUserProfile(user.id);
      setProfile(userProfile);
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      setUser(null);
      setProfile(null);
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  useEffect(() => {
    // Initial auth check
    const checkInitialAuth = async () => {
      try {
        const { user: currentUser } = await getCurrentUser();

        if (currentUser) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error("Error checking initial auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialAuth();

    // Set up auth state listener
    const {
      data: { subscription },
    } = onAuthStateChange(async (authUser) => {
      if (authUser) {
        const typedUser = authUser as AuthUser;
        setUser(typedUser);
        // Refresh profile when user signs in
        const { getUserProfile } = await import("@/lib/auth");
        const userProfile = await getUserProfile(typedUser.id);
        setProfile(userProfile);
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Handle route protection
  useEffect(() => {
    if (isLoading) return;

    // If user is not authenticated and trying to access protected route
    if (!isAuthenticated && isProtectedRoute) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // If user is authenticated and trying to access public auth routes, redirect to app
    // Exception: allow authenticated users on reset-password page (they came via reset link)
    if (isAuthenticated && isPublicRoute && pathname !== "/reset-password") {
      router.push("/");
      return;
    }
  }, [
    isAuthenticated,
    isLoading,
    isProtectedRoute,
    isPublicRoute,
    pathname,
    router,
  ]);

  const contextValue: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    signOut: handleSignOut,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protecting pages
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  redirectTo: string = "/login"
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(`${redirectTo}?redirect=${encodeURIComponent(pathname)}`);
      }
    }, [isAuthenticated, isLoading, router, pathname]);

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Will redirect
    }

    return <Component {...props} />;
  };
}
