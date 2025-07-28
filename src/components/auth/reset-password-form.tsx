"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updatePassword } from "@/lib/auth";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export function ResetPasswordForm({ onSuccess }: ResetPasswordFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const token = searchParams.get("token");
  const type = searchParams.get("type");
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isPasswordResetFlow, setIsPasswordResetFlow] = useState(false);
  const [isFromResetLink, setIsFromResetLink] = useState(false);

  // Check if we have the required parameters or URL fragments indicating password reset
  const hasValidToken = token && type === "recovery";

  // Detect reset flow immediately on mount, before fragments get cleared
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasUrlFragments =
        window.location.hash.includes("access_token") ||
        window.location.hash.includes("type=recovery");
      const hasResetParams = token && type === "recovery";

      // Store in sessionStorage so we don't lose this info
      if (hasUrlFragments || hasResetParams) {
        sessionStorage.setItem("isPasswordResetFlow", "true");
        setIsFromResetLink(true);
        console.log("Detected password reset flow:", {
          hasUrlFragments,
          hasResetParams,
          hash: window.location.hash,
          search: window.location.search,
        });
      }

      // Also check if we have it stored from before
      if (sessionStorage.getItem("isPasswordResetFlow") === "true") {
        setIsFromResetLink(true);
      }
    }
  }, [token, type]);

  // Handle password reset session when component mounts
  useEffect(() => {
    const handlePasswordReset = async () => {
      // Wait a bit for the reset flow detection
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!hasValidToken && !isFromResetLink) {
        setSessionLoading(false);
        return;
      }

      try {
        // Import here to avoid circular dependencies
        const { supabase } = await import("@/lib/supabase");

        // Check for existing session first
        const { data: sessionData } = await supabase.auth.getSession();

        console.log("Session check:", {
          hasSession: !!sessionData?.session?.user,
          hasValidToken,
          isFromResetLink,
          sessionStorage: sessionStorage.getItem("isPasswordResetFlow"),
        });

        // If user is already logged in and this is a password reset flow, allow them to proceed
        if (sessionData?.session?.user && (hasValidToken || isFromResetLink)) {
          setIsPasswordResetFlow(true);
          setSessionLoading(false);
          console.log("Password reset flow activated for logged in user");
          return;
        }

        if (sessionData?.session?.user) {
          setSessionLoading(false);
          return;
        }

        // Check if we have URL fragments (access_token, refresh_token)
        if (typeof window !== "undefined") {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            // Set session using the tokens from URL
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw new Error(error.message || "Failed to establish session");
            }

            if (data?.session?.user) {
              setIsPasswordResetFlow(true);
              setSessionLoading(false);
              console.log("Session established from URL fragments");
              // Clear the URL fragments for security
              window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
              );
              return;
            }
          }
        }

        // Method 2: Try verifying OTP token (old format) - fallback for query params
        if (token && type === "recovery") {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: "recovery",
          });

          if (error) {
            throw new Error(error.message || "Invalid or expired reset token");
          }

          if (data?.user) {
            setIsPasswordResetFlow(true);
            setSessionLoading(false);
            console.log("Session established from OTP verification");
            return;
          }
        }

        // If no session could be established, show error
        setSessionError("Invalid or expired reset token");
        setSessionLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to verify reset token";
        setSessionError(errorMessage);
        setSessionLoading(false);
      }
    };

    handlePasswordReset();
  }, [hasValidToken, isFromResetLink, token, type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validation
      if (!formData.password || !formData.confirmPassword) {
        throw new Error("Please fill in all fields");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (!hasValidToken && !isPasswordResetFlow) {
        throw new Error("Invalid or missing reset token");
      }

      const { error: updateError } = await updatePassword(formData.password);

      if (updateError) {
        const errorMsg =
          (updateError as Error)?.message || "Failed to update password";
        throw new Error(errorMsg);
      }

      setSuccess(true);
      toast.success("Password updated successfully!");

      // Clear the reset flow flag
      sessionStorage.removeItem("isPasswordResetFlow");

      // Sign out the user and redirect to login
      setTimeout(async () => {
        try {
          // Import here to avoid circular dependencies
          const { signOut } = await import("@/lib/auth");
          await signOut();
        } catch (error) {
          console.error("Error signing out:", error);
        }

        if (onSuccess) {
          onSuccess();
        } else {
          router.push(
            "/login?message=Password updated successfully. Please sign in with your new password."
          );
        }
      }, 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
    };

  // Show loading while verifying session
  if (sessionLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            Verifying Reset Link
          </CardTitle>
          <CardDescription>
            Please wait while we verify your password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your reset token...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show error if missing token or session error (but not if we're in password reset flow)
  if (
    (!hasValidToken && !isFromResetLink && !isPasswordResetFlow) ||
    sessionError
  ) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Invalid Reset Link
          </CardTitle>
          <CardDescription>
            This password reset link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The password reset link is invalid, expired, or has already been
              used. Please request a new password reset.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <Button
              className="w-full"
              onClick={() => router.push("/forgot-password")}
            >
              Request New Reset Link
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show success message
  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Password Updated!
          </CardTitle>
          <CardDescription>
            Your password has been successfully updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Your password has been updated. You will be redirected to the sign
              in page shortly.
            </AlertDescription>
          </Alert>

          <Button className="w-full" onClick={() => router.push("/login")}>
            Continue to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">
          Reset Your Password
        </CardTitle>
        <CardDescription>Enter your new password below</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isPasswordResetFlow && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                You&apos;ve been authenticated via your password reset link.
                Please enter your new password below.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password (min 6 characters)"
                value={formData.password}
                onChange={handleChange("password")}
                disabled={isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                value={formData.confirmPassword}
                onChange={handleChange("confirmPassword")}
                disabled={isLoading}
                autoComplete="new-password"
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading || !formData.password || !formData.confirmPassword
            }
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Updating Password...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Update Password
              </div>
            )}
          </Button>

          <div className="text-center">
            <Link
              href="/login"
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Back to Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
