"use client";

import { usePathname } from "next/navigation";
import { AppLayout } from "./app-layout";
import { ReactNode } from "react";

interface ConditionalLayoutProps {
  children: ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();

  // Routes that should not use the app layout (marketing pages)
  const marketingRoutes = ["/", "/support"];

  // Routes that should not use the app layout (auth pages)
  const authRoutes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ];

  const shouldUseAppLayout =
    !marketingRoutes.includes(pathname) && !authRoutes.includes(pathname);

  if (shouldUseAppLayout) {
    return <AppLayout title="BinQR">{children}</AppLayout>;
  }

  return <>{children}</>;
}
