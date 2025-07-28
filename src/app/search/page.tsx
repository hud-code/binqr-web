"use client";

import { useState, useMemo, useCallback } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, MapPin, X, Eye, Edit } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { getStoredBoxes, getStoredLocations } from "@/lib/database";
import { Box } from "@/lib/types";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string }>
  >([]);

  // Load data from database
  useEffect(() => {
    const loadData = async () => {
      const storedBoxes = await getStoredBoxes();
      const storedLocations = await getStoredLocations();

      setBoxes(storedBoxes);
      setLocations(
        storedLocations.map((loc) => ({ id: loc.id, name: loc.name }))
      );
    };
    loadData();
  }, []);

  // Helper function to get location name from ID
  const getLocationName = useCallback(
    (locationId: string): string => {
      const location = locations.find((loc) => loc.id === locationId);
      return location?.name || "Unknown Location";
    },
    [locations]
  );

  // Filter and search logic
  const filteredResults = useMemo(() => {
    let results = boxes;

    // Filter by location
    if (locationFilter !== "all") {
      results = results.filter(
        (box) => getLocationName(box.locationId) === locationFilter
      );
    }

    // Search across box names, descriptions, and contents
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (box) =>
          box.name.toLowerCase().includes(query) ||
          (box.description && box.description.toLowerCase().includes(query)) ||
          box.contents.some((item) => item.toLowerCase().includes(query))
      );
    }

    return results;
  }, [searchQuery, locationFilter, boxes, getLocationName]);

  // Get search matches for highlighting
  const getSearchMatches = (box: { contents: string[] }): string[] => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const matches: string[] = [];

    // Check contents for matches
    box.contents.forEach((item: string) => {
      if (item.toLowerCase().includes(query)) {
        matches.push(item);
      }
    });

    return matches;
  };

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("all");
  };

  const hasActiveFilters = searchQuery.trim() || locationFilter !== "all";

  // Helper function to shorten QR code for display
  const getShortQRCode = (qrCode: string): string => {
    if (qrCode.length <= 12) return qrCode;
    return `${qrCode.substring(0, 8)}...${qrCode.substring(qrCode.length - 4)}`;
  };

  return (
    <div>
      <div className="p-4 space-y-6">
        {/* Search Header */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search boxes and contents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.name}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {filteredResults.length} box
              {filteredResults.length !== 1 ? "es" : ""} found
            </p>
            {searchQuery.trim() && (
              <p className="text-xs text-gray-500">
                Search: &quot;{searchQuery}&quot;
              </p>
            )}
          </div>

          {searchQuery.trim() && (
            <Badge
              variant="secondary"
              className="bg-blue-50 text-blue-700 border-blue-200"
            >
              {filteredResults.reduce(
                (total, box) => total + getSearchMatches(box).length,
                0
              )}{" "}
              item matches
            </Badge>
          )}
        </div>

        {/* Search Results */}
        <div className="space-y-4">
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">
                  No boxes found
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery.trim()
                    ? "Try adjusting your search terms or filters"
                    : "Create your first box to get started"}
                </p>
                <Link href="/create">
                  <Button>Create New Box</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredResults.map((box) => {
              const matches = getSearchMatches(box);

              return (
                <Card
                  key={box.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate">
                            {box.name}
                          </h3>
                        </div>
                        {box.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {box.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">
                              {getLocationName(box.locationId)}
                            </span>
                          </span>
                          <span className="whitespace-nowrap">
                            {box.contents.length} items
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
                            {box.updatedAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setSelectedBox(
                              selectedBox?.id === box.id ? null : box
                            )
                          }
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Link href="/scan">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Search Matches */}
                    {matches.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-2">
                          Matching items ({matches.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {matches.slice(0, 4).map((match, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border-blue-200"
                            >
                              {match}
                            </Badge>
                          ))}
                          {matches.length > 4 && (
                            <Badge
                              variant="outline"
                              className="text-xs px-2 py-1 bg-gray-50 text-gray-600"
                            >
                              +{matches.length - 4} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Expanded Contents */}
                    {selectedBox?.id === box.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                          All Contents ({box.contents.length} items):
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {box.contents.map((item: string, index: number) => (
                            <div
                              key={index}
                              className={`flex items-center gap-2 p-2 rounded-lg text-sm transition-colors ${
                                matches.includes(item)
                                  ? "bg-blue-50 border border-blue-200"
                                  : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <div
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  matches.includes(item)
                                    ? "bg-blue-500"
                                    : "bg-gray-400"
                                }`}
                              ></div>
                              <span
                                className={`truncate ${
                                  matches.includes(item)
                                    ? "font-medium text-blue-900"
                                    : "text-gray-700"
                                }`}
                              >
                                {item}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Quick Stats */}
        {filteredResults.length > 0 && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Search Summary</h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold text-blue-600">
                    {filteredResults.length}
                  </div>
                  <div className="text-xs text-gray-600">Boxes</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-green-600">
                    {filteredResults.reduce(
                      (total, box) => total + box.contents.length,
                      0
                    )}
                  </div>
                  <div className="text-xs text-gray-600">Total Items</div>
                </div>
                <div>
                  <div className="text-lg font-semibold text-purple-600">
                    {
                      new Set(
                        filteredResults.map((box) =>
                          getLocationName(box.locationId)
                        )
                      ).size
                    }
                  </div>
                  <div className="text-xs text-gray-600">Locations</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
