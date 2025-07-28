"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import { toast } from "sonner";

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  showControls?: boolean;
  boxName?: string;
}

export function QRCodeDisplay({
  value,
  size = 200,
  showControls = true,
  boxName,
}: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const generateQRCode = async () => {
      if (!canvasRef.current || !value) return;

      try {
        // Generate QR code on canvas
        await QRCode.toCanvas(canvasRef.current, value, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });

        // Also generate data URL for downloading
        const dataUrl = await QRCode.toDataURL(value, {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        setQrCodeDataUrl(dataUrl);
      } catch (error) {
        console.error("Error generating QR code:", error);
        toast.error("Failed to generate QR code");
      }
    };

    generateQRCode();
  }, [value, size]);

  const handlePrint = () => {
    if (!qrCodeDataUrl) {
      toast.error("QR code not ready for printing");
      return;
    }

    // Create a new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Unable to open print window. Please check popup blockers.");
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print QR Code - ${boxName || "BinQR"}</title>
          <style>
            body {
              margin: 0;
              padding: 0.5in;
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .qr-container {
              page-break-inside: avoid;
              margin-bottom: 0.25in;
              border: 2px solid #333;
              padding: 0.25in;
              border-radius: 8px;
              background: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .qr-image {
              width: 5in;
              height: 5in;
              max-width: none;
            }
            .box-info {
              margin-top: 0.25in;
              font-size: 18px;
              font-weight: bold;
              color: #333;
            }
            .qr-code-text {
              font-family: monospace;
              font-size: 10px;
              color: #666;
              margin-top: 0.15in;
              word-break: break-all;
              max-width: 5in;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <img src="${qrCodeDataUrl}" alt="QR Code" class="qr-image" />
            ${
              boxName
                ? `<div class="box-info"><strong>${boxName}</strong></div>`
                : ""
            }
            <div class="qr-code-text">${value}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Small delay to ensure content loads before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast.success("QR code sent to printer!");
  };

  const handleDownload = () => {
    if (!qrCodeDataUrl) {
      toast.error("QR code not ready for download");
      return;
    }

    const link = document.createElement("a");
    link.download = `qr-code-${
      boxName?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "binqr"
    }.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("QR code downloaded!");
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
        <canvas
          ref={canvasRef}
          className="block"
          style={{ width: size, height: size }}
        />
      </div>

      {showControls && (
        <div className="flex gap-2">
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      )}
    </div>
  );
}
