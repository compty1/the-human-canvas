import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PopButton } from "@/components/pop-art";
import { Loader2, RotateCcw } from "lucide-react";

interface ImageCropperProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  filename: string;
  onCropComplete: (croppedBlob: Blob, newFilename: string) => void;
}

type AspectRatio = "free" | "1:1" | "16:9" | "4:3" | "3:2";

const aspectRatioValues: Record<AspectRatio, number | null> = {
  free: null,
  "1:1": 1,
  "16:9": 16 / 9,
  "4:3": 4 / 3,
  "3:2": 3 / 2,
};

export const ImageCropper = ({
  open,
  onClose,
  imageUrl,
  filename,
  onCropComplete,
}: ImageCropperProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("free");
  const [cropping, setCropping] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imgElement, setImgElement] = useState<HTMLImageElement | null>(null);
  
  // Crop selection state
  const [selection, setSelection] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [displayScale, setDisplayScale] = useState(1);

  // Load image
  useEffect(() => {
    if (open && imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImgElement(img);
        setImageLoaded(true);
        
        // Calculate display scale
        const maxWidth = 600;
        const maxHeight = 400;
        const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
        setDisplayScale(scale);
        
        // Set initial selection
        const displayWidth = img.width * scale;
        const displayHeight = img.height * scale;
        setSelection({
          x: displayWidth * 0.1,
          y: displayHeight * 0.1,
          width: displayWidth * 0.8,
          height: displayHeight * 0.8,
        });
      };
      img.src = imageUrl;
    } else {
      setImageLoaded(false);
      setImgElement(null);
    }
  }, [open, imageUrl]);

  // Apply aspect ratio constraint
  useEffect(() => {
    if (!imgElement || !imageLoaded) return;
    
    const ratio = aspectRatioValues[aspectRatio];
    if (!ratio) return;
    
    setSelection(prev => {
      const newHeight = prev.width / ratio;
      return { ...prev, height: newHeight };
    });
  }, [aspectRatio, imgElement, imageLoaded]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - rect.left - selection.x,
      y: e.clientY - rect.top - selection.y,
    });
  }, [selection]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current || !imgElement) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const displayWidth = imgElement.width * displayScale;
    const displayHeight = imgElement.height * displayScale;
    
    let newX = e.clientX - rect.left - dragStart.x;
    let newY = e.clientY - rect.top - dragStart.y;
    
    // Constrain to image bounds
    newX = Math.max(0, Math.min(newX, displayWidth - selection.width));
    newY = Math.max(0, Math.min(newY, displayHeight - selection.height));
    
    setSelection(prev => ({ ...prev, x: newX, y: newY }));
  }, [isDragging, dragStart, selection.width, selection.height, imgElement, displayScale]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetSelection = useCallback(() => {
    if (!imgElement) return;
    const displayWidth = imgElement.width * displayScale;
    const displayHeight = imgElement.height * displayScale;
    setSelection({
      x: displayWidth * 0.1,
      y: displayHeight * 0.1,
      width: displayWidth * 0.8,
      height: displayHeight * 0.8,
    });
    setAspectRatio("free");
  }, [imgElement, displayScale]);

  const handleCrop = useCallback(async () => {
    if (!imgElement || !canvasRef.current) return;
    
    setCropping(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      // Convert display coordinates to actual image coordinates
      const actualX = selection.x / displayScale;
      const actualY = selection.y / displayScale;
      const actualWidth = selection.width / displayScale;
      const actualHeight = selection.height / displayScale;
      
      // Set canvas size to cropped dimensions
      canvas.width = actualWidth;
      canvas.height = actualHeight;
      
      // Draw cropped portion
      ctx.drawImage(
        imgElement,
        actualX, actualY, actualWidth, actualHeight,
        0, 0, actualWidth, actualHeight
      );
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob"));
          },
          "image/jpeg",
          0.9
        );
      });
      
      // Generate new filename
      const baseName = filename.replace(/\.[^/.]+$/, "");
      const newFilename = `${baseName}-cropped.jpg`;
      
      onCropComplete(blob, newFilename);
      onClose();
    } catch (error) {
      console.error("Crop failed:", error);
    } finally {
      setCropping(false);
    }
  }, [imgElement, selection, displayScale, filename, onCropComplete, onClose]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Crop Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Aspect Ratio Options */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Aspect Ratio:</span>
            {(Object.keys(aspectRatioValues) as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-3 py-1 text-sm border-2 transition-colors ${
                  aspectRatio === ratio
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-foreground hover:bg-muted"
                }`}
              >
                {ratio === "free" ? "Free" : ratio}
              </button>
            ))}
            <button
              onClick={resetSelection}
              className="ml-auto p-2 hover:bg-muted rounded"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          
          {/* Image with selection overlay */}
          <div
            ref={containerRef}
            className="relative bg-black flex items-center justify-center overflow-hidden"
            style={{
              width: imgElement ? imgElement.width * displayScale : 600,
              height: imgElement ? imgElement.height * displayScale : 400,
              maxWidth: "100%",
              margin: "0 auto",
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {imageLoaded && imgElement ? (
              <>
                {/* Darkened background image */}
                <img
                  src={imageUrl}
                  alt="Original"
                  className="absolute inset-0 opacity-40"
                  style={{
                    width: imgElement.width * displayScale,
                    height: imgElement.height * displayScale,
                  }}
                />
                
                {/* Selection overlay */}
                <div
                  className="absolute border-2 border-white border-dashed cursor-move"
                  style={{
                    left: selection.x,
                    top: selection.y,
                    width: selection.width,
                    height: selection.height,
                    backgroundImage: `url(${imageUrl})`,
                    backgroundSize: `${imgElement.width * displayScale}px ${imgElement.height * displayScale}px`,
                    backgroundPosition: `-${selection.x}px -${selection.y}px`,
                  }}
                  onMouseDown={handleMouseDown}
                >
                  {/* Corner handles */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-black" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-black" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-black" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-black" />
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center w-full h-64">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
          </div>
          
          {/* Hidden canvas for cropping */}
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        <DialogFooter>
          <PopButton variant="outline" onClick={onClose}>
            Cancel
          </PopButton>
          <PopButton onClick={handleCrop} disabled={cropping || !imageLoaded}>
            {cropping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Cropping...
              </>
            ) : (
              "Save Cropped Image"
            )}
          </PopButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};