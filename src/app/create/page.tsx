"use client";

/**
 * CreateBox
 *
 * Three-step guided flow to create a new storage box:
 * 1) Capture a photo for future AI analysis and easier identification
 * 2) Collect core details (name, location, optional description)
 * 3) Persist the box and present a scannable QR code
 *
 * Why: This wizard reduces friction by enforcing the minimal inputs and
 * producing a QR code that uniquely identifies each box for later lookup.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Camera, QrCode, CheckCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { getCurrentUser } from "@/lib/auth";
import { Box } from "@/lib/types";
import { saveBox, getStoredLocations } from "@/lib/database";
import { QRCodeDisplay } from "@/components/qr-code";

export default function CreateBox() {
  // Wizard step drives which card is rendered (photo → details → review)
  const [step, setStep] = useState<"photo" | "details" | "review">("photo");

  // Base64 data URL for the selected photo so it can be previewed and stored
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // User-provided metadata required to create a box
  const [boxDetails, setBoxDetails] = useState({
    name: "",
    description: "",
    locationId: "",
  });
  
  // QR content to encode and display once the box is persisted
  const [generatedQR, setGeneratedQR] = useState<string>("");

  // Busy-state used while simulating AI work and saving
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load locations from storage
  const [locations, setLocations] = useState<
    Array<{ id: string; name: string }>
  >([]);

  useEffect(() => {
    // Load saved storage locations once to populate the Select options
    const loadLocations = async () => {
      const storedLocations = await getStoredLocations();
      setLocations(
        storedLocations.map((loc) => ({ id: loc.id, name: loc.name }))
      );
    };
    loadLocations();
  }, []);

  const handleImageCapture = useCallback(
    // Convert the chosen file into a base64 data URL for previewing in the UI
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setCapturedImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  // Programmatically trigger the hidden file input to open the camera/gallery
  const openCamera = () => {
    fileInputRef.current?.click();
  };

  // Clear captured photo and return to the first step
  const retakePhoto = () => {
    setCapturedImage(null);
    setStep("photo");
  };

  // Enforce capturing a photo before proceeding so AI/context has input
  const proceedToDetails = () => {
    if (!capturedImage) {
      toast.error("Please take a photo first");
      return;
    }
    setStep("details");
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!boxDetails.name || !boxDetails.locationId) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate AI processing to keep UX responsive while "analyzing" the photo
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Ensure the user is authenticated before associating ownership
      const { user } = await getCurrentUser();
      if (!user) {
        toast.error("Please sign in to create boxes");
        setStep("photo");
        return;
      }

      // Assemble the persisted payload and generate a unique QR namespace
      const boxId = uuidv4();
      const qrData = `BinQR:${boxId}`;
      const now = new Date();

      const newBox: Box = {
        id: boxId,
        name: boxDetails.name,
        description: boxDetails.description,
        qrCode: qrData,
        imageUrl: capturedImage || undefined,
        locationId: boxDetails.locationId,
        user_id: user.id,
        // Contents may be populated later by AI or manual entry
        contents: [],
        aiAnalysis: "AI analysis pending...",
        createdAt: now,
        updatedAt: now,
      };

      // Persist the new box and expose the QR for the review step
      await saveBox(newBox);
      setGeneratedQR(qrData);

      setStep("review");
      toast.success("Box created successfully!");
    } catch {
      // Surface failure to the user without throwing to the console
      toast.error("Failed to create box");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset local state so the user can immediately create another box
  const handleSaveBox = () => {
    toast.success("Box saved successfully!");
    // Reset form and go back to step 1
    setCapturedImage(null);
    setBoxDetails({ name: "", description: "", locationId: "" });
    setGeneratedQR("");
    setStep("photo");
  };

  return (
    <div>
      <div className="p-4 space-y-6">
        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          {["photo", "details", "review"].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName
                    ? "bg-blue-600 text-white"
                    : index < ["photo", "details", "review"].indexOf(step)
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index < ["photo", "details", "review"].indexOf(step) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < 2 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    index < ["photo", "details", "review"].indexOf(step)
                      ? "bg-green-600"
                      : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Photo Capture */}
        {step === "photo" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Take a Photo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!capturedImage ? (
                <div className="text-center">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">
                      Take a photo of your box contents for AI analysis
                    </p>
                    <Button onClick={openCamera} className="mb-2">
                      <Camera className="w-4 h-4 mr-2" />
                      Open Camera
                    </Button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageCapture}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={capturedImage}
                      alt="Captured box contents"
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <Button
                      onClick={retakePhoto}
                      variant="secondary"
                      size="sm"
                      className="absolute top-2 right-2"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retake
                    </Button>
                  </div>
                  <Button onClick={proceedToDetails} className="w-full">
                    Continue to Details
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 2: Box Details */}
        {step === "details" && (
          <Card>
            <CardHeader>
              <CardTitle>Box Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleDetailsSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Box Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Holiday Decorations"
                    value={boxDetails.name}
                    onChange={(e) =>
                      setBoxDetails({ ...boxDetails, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Additional details about the box contents..."
                    value={boxDetails.description}
                    onChange={(e) =>
                      setBoxDetails({
                        ...boxDetails,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="location">Storage Location *</Label>
                  <Select
                    onValueChange={(value) =>
                      setBoxDetails({ ...boxDetails, locationId: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("photo")}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? "Processing..." : "Generate QR Code"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Review & QR Code */}
        {step === "review" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Box Created Successfully!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Box Details</h4>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Name:</strong> {boxDetails.name}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      <strong>Location:</strong>{" "}
                      {
                        locations.find((l) => l.id === boxDetails.locationId)
                          ?.name
                      }
                    </p>
                    {boxDetails.description && (
                      <p className="text-sm text-gray-600">
                        <strong>Description:</strong> {boxDetails.description}
                      </p>
                    )}
                  </div>
                  <div>
                    {capturedImage && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={capturedImage}
                        alt="Box contents"
                        className="w-full h-24 object-cover rounded"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Your QR Code
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <QRCodeDisplay
                  value={generatedQR}
                  size={200}
                  boxName={boxDetails.name}
                  showControls={true}
                />
                <Badge variant="secondary" className="text-sm">
                  {generatedQR}
                </Badge>
                <Button onClick={handleSaveBox} className="w-full">
                  Save & Create Another
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
