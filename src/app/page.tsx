"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  ScanLine,
  Search,
  Zap,
  Shield,
  Cloud,
  CheckCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  const features = [
    {
      icon: Package,
      title: "Smart Box Indexing",
      description:
        "AI-powered content analysis automatically catalogs your stored items",
    },
    {
      icon: ScanLine,
      title: "QR Code Generation",
      description: "Generate unique QR codes for instant box identification",
    },
    {
      icon: Search,
      title: "Instant Search",
      description: "Find any item across all your boxes in seconds",
    },
    {
      icon: Cloud,
      title: "Cloud Sync",
      description: "Access your inventory from anywhere with automatic sync",
    },
    {
      icon: Shield,
      title: "Secure Storage",
      description: "Your data is encrypted and stored safely in the cloud",
    },
    {
      icon: Zap,
      title: "Quick Actions",
      description: "Streamlined workflows for common tasks and updates",
    },
  ];

  const benefits = [
    "Never lose track of stored items again",
    "Reduce time spent searching through boxes",
    "Keep detailed inventory with photos",
    "Share access with family or team members",
    "Mobile-friendly for on-the-go management",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              src="/binqr-logo.png"
              alt="BinQR Logo"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <Image
              src="/binqr-wordmark.png"
              alt="BinQR"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link href="/support">
              <Button variant="ghost">Support</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Organization for
            <span className="text-blue-600"> All Your Storage</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your storage chaos into an organized, searchable
            inventory. BinQR uses AI to catalog your boxes and QR codes for
            instant access.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-8 py-3">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                View Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Everything You Need to Stay Organized
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make storage management effortless
              and efficient.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose BinQR?
            </h2>
            <p className="text-lg text-gray-600">
              Join thousands of users who've revolutionized their storage
              management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 text-lg">{benefit}</p>
                </div>
              ))}
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl p-8 text-center">
              <Package className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Ready to Get Started?
              </h3>
              <p className="text-gray-600 mb-6">
                Create your account and start organizing today. No credit card
                required.
              </p>
              <Link href="/signup">
                <Button size="lg" className="w-full">
                  Sign Up Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image
                  src="/binqr-logo.png"
                  alt="BinQR Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-xl font-bold">BinQR</span>
              </div>
              <p className="text-gray-400 mb-4">
                Smart organization for all your storage boxes. Never lose track
                of your items again.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <div className="space-y-2 text-gray-400">
                <Link
                  href="/dashboard"
                  className="block hover:text-white transition-colors"
                >
                  Demo
                </Link>
                <Link
                  href="/signup"
                  className="block hover:text-white transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/login"
                  className="block hover:text-white transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <div className="space-y-2 text-gray-400">
                <Link
                  href="/support"
                  className="block hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 BinQR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
