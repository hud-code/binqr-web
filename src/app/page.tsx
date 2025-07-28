"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  ScanLine,
  Search,
  Package,
  MapPin,
  Zap,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { getStoredBoxes, getStoredLocations } from "@/lib/database";
import { Box, Location } from "@/lib/types";

export default function Home() {
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load real data from database
  useEffect(() => {
    const loadData = async () => {
      try {
        const [boxesData, locationsData] = await Promise.all([
          getStoredBoxes(),
          getStoredLocations(),
        ]);
        setBoxes(boxesData);
        setLocations(locationsData);
      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to get location name by ID
  const getLocationName = (locationId: string): string => {
    const location = locations.find((loc) => loc.id === locationId);
    return location?.name || "Unknown Location";
  };

  // Helper function to format relative time
  const getRelativeTime = (date: Date): string => {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30)
      return `${Math.floor(diffInDays / 7)} week${
        Math.floor(diffInDays / 7) === 1 ? "" : "s"
      } ago`;
    return `${Math.floor(diffInDays / 30)} month${
      Math.floor(diffInDays / 30) === 1 ? "" : "s"
    } ago`;
  };

  // Helper function to shorten QR code for display
  const getShortQRCode = (qrCode: string): string => {
    if (qrCode.length <= 12) return qrCode;
    return `${qrCode.substring(0, 8)}...${qrCode.substring(qrCode.length - 4)}`;
  };

  // Get recent boxes (most recently updated, limit 3)
  const recentBoxes = boxes.slice(0, 3).map((box) => ({
    id: box.id,
    name: box.name,
    location: getLocationName(box.locationId),
    itemCount: box.contents.length,
    lastUpdated: getRelativeTime(box.updatedAt),
    qrCode: box.qrCode,
  }));

  // Calculate real statistics
  const totalBoxes = boxes.length;
  const totalItems = boxes.reduce((sum, box) => sum + box.contents.length, 0);
  const totalLocations = locations.length;

  const quickActions = [
    {
      title: "Create New Box",
      description: "Take a photo and generate QR code",
      icon: Plus,
      href: "/create",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      title: "Scan QR Code",
      description: "Update existing box contents",
      icon: ScanLine,
      href: "/scan",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      title: "Search Boxes",
      description: "Find items across all boxes",
      icon: Search,
      href: "/search",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      title: "Manage Locations",
      description: "Organize storage areas",
      icon: MapPin,
      href: "/locations",
      color: "bg-orange-500 hover:bg-orange-600",
    },
  ];

  return (
    <div>
      <div className="p-4 space-y-6">
        {/* Welcome Section */}
        <div className="text-center py-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to BinQR
          </h2>
          <p className="text-gray-600">
            Smart organization for all your storage boxes
          </p>
        </div>

        {/* Quick Actions */}
        <section>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-2">
                      <div
                        className={`w-7 h-7 rounded-lg ${action.color} flex items-center justify-center mb-1`}
                      >
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-0.5 text-xs leading-tight">
                        {action.title}
                      </h4>
                      <p className="text-[10px] text-gray-600 leading-tight">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent Boxes */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Boxes
            </h3>
            <Link href="/search">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              // Loading state
              [1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-5 bg-gray-200 rounded w-16 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : recentBoxes.length > 0 ? (
              // Real data
              recentBoxes.map((box) => (
                <Card
                  key={box.id}
                  className="hover:shadow-sm transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <h4 className="font-semibold text-gray-900 truncate">
                            {box.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{box.location}</span>
                          </span>
                          <span className="whitespace-nowrap">
                            {box.itemCount} items
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1"
                            title={box.qrCode}
                          >
                            {getShortQRCode(box.qrCode)}
                          </Badge>
                          <p className="text-xs text-gray-500 ml-2">
                            {box.lastUpdated}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Empty state
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">
                    No boxes yet
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Create your first box to get started
                  </p>
                  <Link href="/create">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Box
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Stats Section */}
        <section>
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {totalBoxes}
                    </div>
                    <div className="text-sm text-gray-600">Total Boxes</div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      {totalItems}
                    </div>
                    <div className="text-sm text-gray-600">Items Indexed</div>
                  </>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-purple-600">
                      {totalLocations}
                    </div>
                    <div className="text-sm text-gray-600">Locations</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
