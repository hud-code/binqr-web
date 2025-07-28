"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "./auth-provider";

interface LogoutButtonProps {
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function LogoutButton({
  variant = "ghost",
  size = "default",
  showIcon = true,
  children = "Sign Out",
}: LogoutButtonProps) {
  const { signOut } = useAuth();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={signOut}
      className="flex items-center gap-2"
    >
      {showIcon && <LogOut className="w-4 h-4" />}
      {children}
    </Button>
  );
}
