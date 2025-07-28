"use client";

import { Suspense } from "react";
import Image from "next/image";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

function ResetPasswordContent() {
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

      {/* Reset Password Form */}
      <ResetPasswordForm />

      {/* Footer */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>© 2025 BinQR. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
