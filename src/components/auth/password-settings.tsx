"use client";

import { useState } from "react";
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
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  CheckCircle,
  AlertCircle,
  Key,
} from "lucide-react";
import { toast } from "sonner";
import { resetPassword, updatePassword } from "@/lib/auth";
import { useAuth } from "./auth-provider";

interface PasswordSettingsProps {
  userEmail?: string;
}

export function PasswordSettings({ userEmail }: PasswordSettingsProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
      if (success) setSuccess(null);
    };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validation
      if (
        !formData.currentPassword ||
        !formData.newPassword ||
        !formData.confirmPassword
      ) {
        throw new Error("Please fill in all fields");
      }

      if (formData.newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters long");
      }

      if (formData.newPassword !== formData.confirmPassword) {
        throw new Error("New passwords do not match");
      }

      if (formData.currentPassword === formData.newPassword) {
        throw new Error("New password must be different from current password");
      }

      // First verify current password by trying to sign in
      const { signIn } = await import("@/lib/auth");
      const { error: signInError } = await signIn({
        email: user?.email || userEmail || "",
        password: formData.currentPassword,
      });

      if (signInError) {
        throw new Error("Current password is incorrect");
      }

      // Update password
      const { error: updateError } = await updatePassword(formData.newPassword);

      if (updateError) {
        const errorMsg =
          (updateError as Error)?.message || "Failed to update password";
        throw new Error(errorMsg);
      }

      setSuccess("Password updated successfully!");
      toast.success("Password updated successfully!");

      // Clear form
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const email = user?.email || userEmail;
      if (!email) {
        throw new Error("No email address found");
      }

      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        const errorMsg =
          (resetError as Error)?.message || "Failed to send reset email";
        throw new Error(errorMsg);
      }

      setResetEmailSent(true);
      setSuccess(`Password reset email sent to ${email}`);
      toast.success("Password reset email sent!");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (resetEmailSent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password Reset
          </CardTitle>
          <CardDescription>
            Check your email for reset instructions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              We sent a password reset link to{" "}
              <strong>{user?.email || userEmail}</strong>. Check your inbox and
              click the link to reset your password.
            </AlertDescription>
          </Alert>

          <div className="mt-4 space-y-2">
            <Button
              variant="outline"
              onClick={() => {
                setResetEmailSent(false);
                setSuccess(null);
              }}
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Password & Security
        </CardTitle>
        <CardDescription>
          Change your password or request a reset
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Change Password Form */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-4 h-4" />
            <h3 className="font-medium">Change Password</h3>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChange={handleChange("currentPassword")}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  disabled={isLoading}
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter your new password (min 6 characters)"
                  value={formData.newPassword}
                  onChange={handleChange("newPassword")}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? (
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
              disabled={
                isLoading ||
                !formData.currentPassword ||
                !formData.newPassword ||
                !formData.confirmPassword
              }
              className="w-full"
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
          </form>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-px bg-gray-200"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-200"></div>
        </div>

        {/* Reset Password Option */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4" />
            <h3 className="font-medium">Forgot Password?</h3>
          </div>

          <p className="text-sm text-gray-600">
            Can&apos;t remember your current password? We&apos;ll send you a
            reset link via email.
          </p>

          <Button
            variant="outline"
            onClick={handleRequestReset}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                Sending Reset Email...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Send Password Reset Email
              </div>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
