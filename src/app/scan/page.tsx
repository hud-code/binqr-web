"use client";

import { useState, useRef, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ScanLine,
  Camera,
  Package,
  MapPin,
  Calendar,
  Edit,
  Save,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { getBoxByQRCode, saveBox, getStoredLocations } from "@/lib/database";
import { Box } from "@/lib/types";

export default function ScanBox() {
  const [scanStep, setScanStep] = useState<"scan" | "found" | "update">("scan");
  const [scannedQR, setScannedQR] = useState("");
  const [foundBox, setFoundBox] = useState<Box | null>(null);
  const [newImage, setNewImage] = useState<string | null>(null);
  const [updatedContents, setUpdatedContents] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [locations, setLocations] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    const loadLocations = async () => {
      const storedLocations = await getStoredLocations();
      setLocations(
        storedLocations.map((loc) => ({ id: loc.id, name: loc.name }))
      );
    };
    loadLocations();
  }, []);

  // Helper function to get location name from ID
  const getLocationName = (locationId: string): string => {
    const location = locations.find((loc) => loc.id === locationId);
    return location?.name || "Unknown Location";
  };

  // Helper function to format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString();
  };

  const handleQRInput = async (value: string) => {
    setScannedQR(value);

    try {
      // Look up box in database
      const box = await getBoxByQRCode(value);
      if (box) {
        setFoundBox(box);
        setUpdatedContents(box.contents.join(", "));
        setScanStep("found");
        toast.success("Box found!");
      } else {
        toast.error("Box not found. Please check the QR code.");
      }
    } catch (error) {
      console.error("Error looking up box:", error);
      toast.error("Error looking up box. Please try again.");
    }
  };

  const handleImageCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  const startUpdate = () => {
    setScanStep("update");
  };

  const handleSaveUpdate = async () => {
    if (!foundBox) return;

    setIsUpdating(true);

    try {
      // Simulate processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update the box with new data
      const updatedBox: Box = {
        ...foundBox,
        contents: updatedContents
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0),
        imageUrl: newImage || foundBox.imageUrl,
        updatedAt: new Date(),
      };

      // Save to database
      await saveBox(updatedBox);

      toast.success("Box updated successfully!");

      // Reset state
      setScanStep("scan");
      setScannedQR("");
      setFoundBox(null);
      setNewImage(null);
      setUpdatedContents("");
    } catch {
      toast.error("Failed to update box");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div>
      <div className="p-4 space-y-6">
        {/* Step 1: QR Code Scanning */}
        {scanStep === "scan" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ScanLine className="w-5 h-5" />
                  Scan QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                    <ScanLine className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Scan the QR code on your box to update its contents
                    </p>
                    <Button className="mb-4">
                      <Camera className="w-4 h-4 mr-2" />
                      Open QR Scanner
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-50 px-2 text-gray-500">
                      Or enter manually
                    </span>
                  </div>
                </div>

                <div>
                  <Label htmlFor="qr-input">QR Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="qr-input"
                      placeholder="Enter QR code (e.g., BinQR:123e4567...)"
                      value={scannedQR}
                      onChange={(e) => setScannedQR(e.target.value)}
                    />
                    <Button
                      onClick={() => handleQRInput(scannedQR)}
                      disabled={!scannedQR}
                    >
                      Find Box
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                For testing, try:{" "}
                <code className="bg-gray-100 px-1 rounded">
                  BinQR:123e4567-e89b-12d3-a456-426614174000
                </code>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 2: Box Found */}
        {scanStep === "found" && foundBox && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Box Found!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{foundBox.name}</h3>
                    <p className="text-gray-600 mb-2">{foundBox.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {getLocationName(foundBox.locationId)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Updated {formatDate(foundBox.updatedAt)}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary">{foundBox.qrCode}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {foundBox.contents.map((item: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setScanStep("scan")}
                className="flex-1"
              >
                Back to Scan
              </Button>
              <Button onClick={startUpdate} className="flex-1">
                <Edit className="w-4 h-4 mr-2" />
                Update Contents
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Update Box */}
        {scanStep === "update" && foundBox && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="w-5 h-5" />
                  Update Box Contents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-gray-600 mb-4">
                  Updating: <strong>{foundBox.name}</strong>
                </div>

                {/* Photo Update */}
                <div>
                  <Label>New Photo (Optional)</Label>
                  {!newImage ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        Take a new photo to help with AI analysis
                      </p>
                      <Button onClick={openCamera} variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={newImage}
                        alt="Updated box contents"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        onClick={() => setNewImage(null)}
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                </div>

                {/* Manual Contents Update */}
                <div>
                  <Label htmlFor="contents">Contents (comma-separated)</Label>
                  <Textarea
                    id="contents"
                    placeholder="List items separated by commas..."
                    value={updatedContents}
                    onChange={(e) => setUpdatedContents(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: You can add new items or remove existing ones
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setScanStep("found")}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveUpdate}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isUpdating ? "Saving..." : "Save Updates"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
