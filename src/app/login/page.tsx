"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const message = searchParams.get("message");
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

      {/* Message Alert */}
      {message && (
        <div className="w-full max-w-md mb-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Login Form */}
      <LoginForm
        redirectTo={redirectTo}
        onSuccess={() => {
          // Handle successful login
          router.push(redirectTo);
        }}
      />

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>© 2025 BinQR. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginPageContent />
    </Suspense>
  );
}
