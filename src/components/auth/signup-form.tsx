"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { signUp, validateInviteCode } from "@/lib/auth";
import type { SignUpFormData } from "@/lib/types";

interface SignUpFormProps {
  onSuccess?: () => void;
  redirectTo?: string;
  initialInviteCode?: string;
}

export function SignUpForm({
  onSuccess,
  redirectTo = "/",
  initialInviteCode = "",
}: SignUpFormProps) {
  // redirectTo is available for future use
  console.log("SignUpForm redirectTo:", redirectTo);
  const router = useRouter();
  const [formData, setFormData] = useState<SignUpFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    inviteCode: initialInviteCode,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteValidation, setInviteValidation] = useState<{
    isValidating: boolean;
    isValid: boolean | null;
    message: string;
  }>({
    isValidating: false,
    isValid: null,
    message: "",
  });

  const validateInvite = async (code: string) => {
    if (!code.trim()) {
      setInviteValidation({ isValidating: false, isValid: null, message: "" });
      return;
    }

    setInviteValidation({ isValidating: true, isValid: null, message: "" });

    try {
      const result = await validateInviteCode(code);
      setInviteValidation({
        isValidating: false,
        isValid: result.valid,
        message: result.message || "",
      });
    } catch {
      setInviteValidation({
        isValidating: false,
        isValid: false,
        message: "Error validating invite code",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation
      if (
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword ||
        !formData.inviteCode
      ) {
        throw new Error("Please fill in all required fields");
      }

      if (!formData.email.includes("@")) {
        throw new Error("Please enter a valid email address");
      }

      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      if (inviteValidation.isValid !== true) {
        throw new Error("Please enter a valid invite code");
      }

      const { data, error: signUpError } = await signUp({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        invite_code: formData.inviteCode,
      });

      if (signUpError || !data?.user) {
        const errorMsg =
          (signUpError as Error)?.message || "Failed to create account";
        throw new Error(errorMsg);
      }

      toast.success(
        "Account created successfully! Please check your email to verify your account."
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(
          "/login?message=Please check your email to verify your account"
        );
      }
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
    (field: keyof SignUpFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));

      if (error) setError(null); // Clear error when user starts typing

      // Validate invite code when it changes
      if (field === "inviteCode") {
        const debounceTimer = setTimeout(() => validateInvite(value), 500);
        return () => clearTimeout(debounceTimer);
      }
    };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Join BinQR</CardTitle>
        <CardDescription>
          Create your account with an invite code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="inviteCode">
              Invite Code <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter your invite code"
                value={formData.inviteCode}
                onChange={handleChange("inviteCode")}
                disabled={isLoading}
                className="pr-10"
                maxLength={8}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {inviteValidation.isValidating && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                {!inviteValidation.isValidating &&
                  inviteValidation.isValid === true && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                {!inviteValidation.isValidating &&
                  inviteValidation.isValid === false && (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
              </div>
            </div>
            {inviteValidation.message && (
              <p
                className={`text-xs ${
                  inviteValidation.isValid ? "text-green-600" : "text-red-600"
                }`}
              >
                {inviteValidation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange("fullName")}
              disabled={isLoading}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange("email")}
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password (min 6 characters)"
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
            <Label htmlFor="confirmPassword">
              Confirm Password <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
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
            disabled={isLoading || inviteValidation.isValid !== true}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating account...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Account
              </div>
            )}
          </Button>

          <div className="text-center">
            <div className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
              >
                Sign in
              </Link>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
