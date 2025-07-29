"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Plus,
  MapPin,
  ScanLine,
  Settings,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { LogoutButton } from "./auth/logout-button";
import { useAuth } from "./auth/auth-provider";
import { Button } from "./ui/button";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: Home,
  },
  {
    href: "/create",
    label: "Create",
    icon: Plus,
  },
  {
    href: "/scan",
    label: "Scan",
    icon: ScanLine,
  },
  {
    href: "/search",
    label: "Search",
    icon: Search,
  },
  {
    href: "/locations",
    label: "Locations",
    icon: MapPin,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

export function Navigation() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  // Don't show navigation on auth pages, marketing pages, or if not authenticated
  if (
    !isAuthenticated ||
    [
      "/login",
      "/signup",
      "/forgot-password",
      "/reset-password",
      "/",
      "/support",
    ].includes(pathname)
  ) {
    return null;
  }

  return (
    <nav className="bg-white border-t border-gray-200 px-4 py-2">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                isActive && "text-blue-600 bg-blue-50"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Header({ title }: { title: string }) {
  const { isAuthenticated, profile } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Image
              src="/binqr-logo.png"
              alt="BinQR Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <Image
              src="/binqr-wordmark.png"
              alt="BinQR"
              width={96}
              height={32}
              className="h-8 w-auto"
            />
          </div>
          {title !== "BinQR" && (
            <>
              <div className="w-px h-6 bg-gray-300"></div>
              <h1 className="text-lg font-medium text-gray-700">{title}</h1>
            </>
          )}
        </div>

        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">
                {profile?.full_name || profile?.email || "User"}
              </span>
            </div>
            <LogoutButton size="sm" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => (window.location.href = "/login")}
            >
              Sign In
            </Button>
            <Button
              size="sm"
              onClick={() => (window.location.href = "/signup")}
            >
              Sign Up
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
