import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, GripVertical, Star, FolderOpen } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { MediaLibraryPicker } from "./MediaLibraryPicker";

interface EnhancedImageManagerProps {
  mainImage: string;
  screenshots: string[];
  onMainImageChange: (url: string) => void;
  onScreenshotsChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  className?: string;
}

export const EnhancedImageManager = ({
  mainImage,
  screenshots,
  onMainImageChange,
  onScreenshotsChange,
  folder = "content",
  maxImages = 20,
  className,
}: EnhancedImageManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const allImages = mainImage ? [mainImage, ...screenshots] : [...screenshots];

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const remaining = maxImages - allImages.length;
      if (files.length > remaining) {
        toast.error(`Can only add ${remaining} more image(s)`);
        return;
      }

      setUploading(true);
      const newUrls: string[] = [];

      try {
        for (const file of Array.from(files)) {
          const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`;
          const { data, error } = await supabase.storage
            .from("content-images")
            .upload(fileName, file);
          if (error) throw error;
          const { data: urlData } = supabase.storage
            .from("content-images")
            .getPublicUrl(data.path);
          newUrls.push(urlData.publicUrl);
        }

        if (!mainImage && newUrls.length > 0) {
          onMainImageChange(newUrls[0]);
          onScreenshotsChange([...screenshots, ...newUrls.slice(1)]);
        } else {
          onScreenshotsChange([...screenshots, ...newUrls]);
        }
        toast.success(`${newUrls.length} image(s) uploaded`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload images");
      } finally {
        setUploading(false);
      }
    },
    [mainImage, screenshots, onMainImageChange, onScreenshotsChange, folder, maxImages, allImages.length]
  );

  const setAsMain = (index: number) => {
    const clickedUrl = allImages[index];
    const oldMain = mainImage;
    const newScreenshots = allImages.filter((_, i) => i !== index);
    if (oldMain && index !== 0) {
      // Old main goes back to screenshots (at position 0)
      newScreenshots.splice(0, 0); // already excluded from filter
    }
    onMainImageChange(clickedUrl);
    onScreenshotsChange(newScreenshots.filter((u) => u !== clickedUrl));
  };

  const removeImage = (index: number) => {
    if (index === 0 && mainImage) {
      onMainImageChange(screenshots[0] || "");
      onScreenshotsChange(screenshots.slice(1));
    } else {
      const screenshotIndex = mainImage ? index - 1 : index;
      onScreenshotsChange(screenshots.filter((_, i) => i !== screenshotIndex));
    }
  };

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newAll = [...allImages];
    const dragged = newAll[draggedIndex];
    newAll.splice(draggedIndex, 1);
    newAll.splice(index, 0, dragged);

    // First item is always main image
    onMainImageChange(newAll[0] || "");
    onScreenshotsChange(newAll.slice(1));
    setDraggedIndex(index);
  };

  const handleDragEnd = () => setDraggedIndex(null);

  const handleLibrarySelect = (urls: string[]) => {
    const remaining = maxImages - allImages.length;
    const toAdd = urls.slice(0, remaining);
    if (!mainImage && toAdd.length > 0) {
      onMainImageChange(toAdd[0]);
      onScreenshotsChange([...screenshots, ...toAdd.slice(1)]);
    } else {
      onScreenshotsChange([...screenshots, ...toAdd]);
    }
    setShowLibrary(false);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <Label className="text-sm font-bold flex items-center justify-between">
        Images
        <span className="text-muted-foreground font-normal">
          {allImages.length}/{maxImages}
        </span>
      </Label>

      {/* Image Grid */}
      {allImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {allImages.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative group aspect-square border-2 cursor-move overflow-hidden",
                index === 0 && mainImage ? "border-primary ring-2 ring-primary/30" : "border-foreground",
                draggedIndex === index && "opacity-50"
              )}
            >
              <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />

              {/* Main badge */}
              {index === 0 && mainImage && (
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] font-bold flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5" fill="currentColor" /> MAIN
                </div>
              )}

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors" />

              {/* Actions */}
              <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {(index !== 0 || !mainImage) && (
                  <button
                    type="button"
                    onClick={() => setAsMain(index)}
                    className="p-1 bg-primary text-primary-foreground text-[10px] font-bold hover:bg-primary/80"
                    title="Set as main image"
                  >
                    <Star className="w-3 h-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1 bg-background border border-foreground hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              {/* Drag handle */}
              <div className="absolute bottom-1 left-1 p-1 bg-background/80 border border-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload + Library buttons */}
      {allImages.length < maxImages && (
        <div className="flex gap-2">
          <label
            className={cn(
              "flex-1 flex flex-col items-center justify-center h-20 border-2 border-dashed border-foreground cursor-pointer hover:bg-muted transition-colors",
              uploading && "opacity-50 cursor-not-allowed"
            )}
          >
            <Upload className="w-5 h-5 mb-1" />
            <span className="text-xs text-muted-foreground">
              {uploading ? "Uploading..." : "Upload Images"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleUpload(e.target.files)}
              disabled={uploading}
              className="hidden"
            />
          </label>
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="flex flex-col items-center justify-center h-20 w-24 border-2 border-dashed border-foreground cursor-pointer hover:bg-muted transition-colors"
          >
            <FolderOpen className="w-5 h-5 mb-1" />
            <span className="text-xs text-muted-foreground">Library</span>
          </button>
        </div>
      )}

      <MediaLibraryPicker
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={(url) => handleLibrarySelect([url])}
        multiple
        onSelectMultiple={handleLibrarySelect}
      />
    </div>
  );
};
