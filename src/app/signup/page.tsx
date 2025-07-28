"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { SignUpForm } from "@/components/auth/signup-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Users } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

function SignUpPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const inviteCode = searchParams.get("invite") || "";
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const { user } = await getCurrentUser();
        if (user) {
          router.push(redirectTo);
          return;
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, redirectTo]);

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Logo Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Image
            src="/binqr-logo.png"
            alt="BinQR Logo"
            width={48}
            height={48}
            className="w-12 h-12"
          />
          <Image
            src="/binqr-wordmark.png"
            alt="BinQR"
            width={144}
            height={48}
            className="h-12 w-auto"
          />
        </div>
        <p className="text-gray-600 text-sm">
          Smart organization for your storage boxes
        </p>
      </div>

      {/* Invite-Only Notice */}
      <div className="w-full max-w-md mb-6">
        <Alert className="border-blue-200 bg-blue-50">
          <Users className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Invite-Only Launch:</strong> BinQR is currently in private
            beta. You need an invite code from an existing user to join.
          </AlertDescription>
        </Alert>
      </div>

      {/* Pre-filled invite code notice */}
      {inviteCode && (
        <div className="w-full max-w-md mb-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Great! Your invite code has been pre-filled. Complete the form
              below to create your account.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* SignUp Form */}
      <SignUpForm
        initialInviteCode={inviteCode}
        redirectTo={redirectTo}
        onSuccess={() => {
          // Handle successful signup - redirect to login with message
          router.push(
            "/login?message=Account created! Please check your email to verify your account."
          );
        }}
      />

      {/* Help Text */}
      <div className="mt-6 w-full max-w-md">
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            <strong>Don&apos;t have an invite code?</strong>
          </p>
          <p>
            Ask a friend who&apos;s already using BinQR to send you one, or
            contact us to join the waitlist.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>© 2025 BinQR. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignUpPageContent />
    </Suspense>
  );
}
