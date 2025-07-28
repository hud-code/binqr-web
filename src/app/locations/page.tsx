"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Plus,
  Package,
  Edit,
  Trash2,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getStoredLocations,
  saveLocation,
  updateLocation,
  deleteLocation,
  getBoxCountForLocation,
  getStoredBoxes,
} from "@/lib/database";
import { Location, Box } from "@/lib/types";
import { QRCodeDisplay } from "@/components/qr-code";

interface LocationWithCount extends Location {
  boxCount: number;
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<LocationWithCount[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationWithCount | null>(null);
  const [boxesInLocation, setBoxesInLocation] = useState<Box[]>([]);
  const [selectedBoxForQR, setSelectedBoxForQR] = useState<Box | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] =
    useState<LocationWithCount | null>(null);
  const [newLocation, setNewLocation] = useState({
    name: "",
    description: "",
  });

  // Load locations and their box counts
  useEffect(() => {
    loadLocations();
  }, []);

  const loadLocations = async () => {
    setIsLoading(true);
    try {
      const [locationsData, boxesData] = await Promise.all([
        getStoredLocations(),
        getStoredBoxes(),
      ]);

      // Calculate box counts for each location
      const locationsWithCounts: LocationWithCount[] = locationsData.map(
        (location) => ({
          ...location,
          boxCount: boxesData.filter((box) => box.locationId === location.id)
            .length,
        })
      );

      setLocations(locationsWithCounts);
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error("Failed to load locations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLocation.name.trim()) {
      toast.error("Location name is required");
      return;
    }

    try {
      await saveLocation({
        name: newLocation.name.trim(),
        description: newLocation.description.trim() || undefined,
      });

      await loadLocations();

      setNewLocation({ name: "", description: "" });
      setIsAddDialogOpen(false);
      toast.success("Location added successfully!");
    } catch (error) {
      console.error("Error adding location:", error);
      toast.error("Failed to add location");
    }
  };

  const handleEditLocation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingLocation || !editingLocation.name.trim()) {
      toast.error("Location name is required");
      return;
    }

    try {
      await updateLocation(editingLocation.id, {
        name: editingLocation.name.trim(),
        description: editingLocation.description?.trim() || undefined,
      });

      await loadLocations();

      setEditingLocation(null);
      setIsEditDialogOpen(false);
      toast.success("Location updated successfully!");
    } catch (error) {
      console.error("Error updating location:", error);
      toast.error("Failed to update location");
    }
  };

  const handleDeleteLocation = async (location: LocationWithCount) => {
    if (location.boxCount > 0) {
      toast.error(
        "Cannot delete location with boxes. Move or delete boxes first."
      );
      return;
    }

    if (!confirm(`Are you sure you want to delete "${location.name}"?`)) {
      return;
    }

    try {
      await deleteLocation(location.id);
      await loadLocations();
      toast.success("Location deleted successfully!");
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const handleLocationClick = async (location: LocationWithCount) => {
    try {
      const boxes = await getStoredBoxes();
      const locationBoxes = boxes.filter(
        (box) => box.locationId === location.id
      );
      setBoxesInLocation(locationBoxes);
      setSelectedLocation(location);
    } catch (error) {
      console.error("Error loading boxes for location:", error);
      toast.error("Failed to load boxes for this location");
    }
  };

  const openEditDialog = (location: LocationWithCount) => {
    setEditingLocation({ ...location });
    setIsEditDialogOpen(true);
  };

  // If viewing a specific location's boxes
  if (selectedLocation) {
    return (
      <div className="p-4 space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedLocation(null)}
            className="p-2"
          >
            ← Back to Locations
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {selectedLocation.name}
              <Badge variant="secondary" className="ml-2">
                {boxesInLocation.length}{" "}
                {boxesInLocation.length === 1 ? "box" : "boxes"}
              </Badge>
            </CardTitle>
            {selectedLocation.description && (
              <p className="text-gray-600">{selectedLocation.description}</p>
            )}
          </CardHeader>
          <CardContent>
            {boxesInLocation.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No boxes in this location yet</p>
                <p className="text-sm">
                  Create a box and assign it to this location
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {boxesInLocation.map((box) => (
                  <Card
                    key={box.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedBoxForQR(box)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium">{box.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {box.contents.length} items
                        </Badge>
                      </div>
                      {box.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {box.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          Created {box.createdAt.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">
                          Click to view QR
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main locations view
  return (
    <div className="p-4 space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Locations</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddLocation} className="space-y-4">
              <div>
                <Label htmlFor="name">Location Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Garage, Storage Room"
                  value={newLocation.name}
                  onChange={(e) =>
                    setNewLocation({ ...newLocation, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about this location..."
                  value={newLocation.description}
                  onChange={(e) =>
                    setNewLocation({
                      ...newLocation,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Add Location
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Locations List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading locations...</p>
          </CardContent>
        </Card>
      ) : locations.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium text-gray-900 mb-2">No locations yet</h3>
            <p className="text-gray-600 mb-4">
              Add your first location to start organizing your boxes
            </p>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Location
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card
              key={location.id}
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleLocationClick(location)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium">{location.name}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditDialog(location);
                      }}
                      className="p-1 h-6 w-6"
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLocation(location);
                      }}
                      className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                      disabled={location.boxCount > 0}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {location.description && (
                  <p className="text-sm text-gray-600 mb-3">
                    {location.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Package className="w-4 h-4" />
                    <span>
                      {location.boxCount}{" "}
                      {location.boxCount === 1 ? "box" : "boxes"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <span>View details</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>

                {location.boxCount > 0 && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Cannot delete - contains boxes
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
          </DialogHeader>
          {editingLocation && (
            <form onSubmit={handleEditLocation} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Location Name *</Label>
                <Input
                  id="edit-name"
                  placeholder="e.g., Garage, Storage Room"
                  value={editingLocation.name}
                  onChange={(e) =>
                    setEditingLocation({
                      ...editingLocation,
                      name: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Description (Optional)</Label>
                <Textarea
                  id="edit-description"
                  placeholder="Additional details about this location..."
                  value={editingLocation.description || ""}
                  onChange={(e) =>
                    setEditingLocation({
                      ...editingLocation,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Update Location
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog
        open={!!selectedBoxForQR}
        onOpenChange={() => setSelectedBoxForQR(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              {selectedBoxForQR?.name}
            </DialogTitle>
            <p className="text-sm text-gray-600">
              Scan or print this QR code to identify the box
            </p>
          </DialogHeader>

          {selectedBoxForQR && (
            <div className="space-y-4">
              {/* Box Details */}
              <div className="space-y-2">
                {selectedBoxForQR.description && (
                  <p className="text-sm text-gray-700">
                    {selectedBoxForQR.description}
                  </p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>
                    Created: {selectedBoxForQR.createdAt.toLocaleDateString()}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {selectedBoxForQR.contents.length} items
                  </Badge>
                </div>
              </div>

              {/* QR Code Display */}
              <div className="flex justify-center">
                <QRCodeDisplay
                  value={selectedBoxForQR.qrCode}
                  size={250}
                  showControls={true}
                  boxName={selectedBoxForQR.name}
                />
              </div>

              {/* Contents Preview */}
              {selectedBoxForQR.contents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Contents:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {selectedBoxForQR.contents.map((content, index) => (
                      <div
                        key={index}
                        className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded"
                      >
                        {content}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
