import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";
import { AppLayout } from "@/components/app-layout";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BinQR - Smart Box Indexing",
  description:
    "AI-powered QR code box organization system. Index, search, and track your storage boxes with smart content analysis.",
  manifest: "/manifest.json",
  viewport:
    "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  themeColor: "#000000",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/binqr-logo.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/binqr-logo.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BinQR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full bg-background`}
      >
        <AuthProvider>
          <AppLayout title="BinQR">{children}</AppLayout>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
