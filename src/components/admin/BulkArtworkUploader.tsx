import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  X, 
  Check, 
  Loader2, 
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImagePreview {
  id: string;
  file: File;
  preview: string;
  title: string;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
}

interface BulkArtworkUploaderProps {
  onComplete: () => void;
  onCancel: () => void;
}

const CATEGORIES = [
  "portrait",
  "landscape",
  "photography",
  "mixed",
  "abstract",
  "digital",
  "traditional",
];

export const BulkArtworkUploader = ({ onComplete, onCancel }: BulkArtworkUploaderProps) => {
  const [images, setImages] = useState<ImagePreview[]>([]);
  const [category, setCategory] = useState("mixed");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const generateId = () => Math.random().toString(36).substring(7);

  const getTitleFromFilename = (filename: string): string => {
    // Remove extension and clean up
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    // Replace underscores and hyphens with spaces
    const cleaned = nameWithoutExt.replace(/[_-]/g, " ");
    // Capitalize words
    return cleaned
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleFilesSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newImages: ImagePreview[] = [];

    for (const file of Array.from(selectedFiles)) {
      // Only accept images
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      const preview = URL.createObjectURL(file);
      newImages.push({
        id: generateId(),
        file,
        preview,
        title: getTitleFromFilename(file.name),
        status: "pending",
      });
    }

    setImages(prev => [...prev, ...newImages]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelect(e.dataTransfer.files);
  }, [handleFilesSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = (id: string) => {
    setImages(prev => {
      const img = prev.find(i => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter(i => i.id !== id);
    });
  };

  const updateTitle = (id: string, title: string) => {
    setImages(prev => 
      prev.map(img => img.id === id ? { ...img, title } : img)
    );
  };

  const uploadAll = async () => {
    if (images.length === 0) {
      toast.error("No images to upload");
      return;
    }

    setUploading(true);
    setProgress(0);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      
      // Update status to uploading
      setImages(prev => 
        prev.map(p => p.id === img.id ? { ...p, status: "uploading" } : p)
      );

      try {
        // Generate unique filename
        const ext = img.file.name.split(".").pop();
        const filename = `${Date.now()}-${img.id}.${ext}`;
        const filePath = `artwork/${filename}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from("content-images")
          .upload(filePath, img.file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from("content-images")
          .getPublicUrl(filePath);

        // Create artwork record
        const { error: dbError } = await supabase
          .from("artwork")
          .insert({
            title: img.title,
            image_url: publicUrl,
            category: category,
          });

        if (dbError) throw dbError;

        // Update status to success
        setImages(prev => 
          prev.map(p => p.id === img.id ? { ...p, status: "success" } : p)
        );
        successCount++;
      } catch (error) {
        // Update status to error
        setImages(prev => 
          prev.map(p => p.id === img.id ? { 
            ...p, 
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed"
          } : p)
        );
        errorCount++;
      }

      setProgress(Math.round(((i + 1) / images.length) * 100));
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} images`);
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} images failed to upload`);
    }

    // If all succeeded, close after a brief delay
    if (errorCount === 0 && successCount > 0) {
      setTimeout(onComplete, 1000);
    }
  };

  const clearAll = () => {
    images.forEach(img => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const pendingCount = images.filter(i => i.status === "pending").length;
  const successCount = images.filter(i => i.status === "success").length;

  return (
    <ComicPanel className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display">Bulk Artwork Upload</h2>
          <p className="text-sm text-muted-foreground">Upload multiple images at once</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-muted rounded">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Category Selection */}
      <div className="flex items-center gap-4">
        <Label className="font-bold">Category:</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Drop Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
          isDragging 
            ? "border-primary bg-primary/10" 
            : "border-foreground hover:bg-muted/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFilesSelect(e.target.files)}
          className="hidden"
        />
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="font-bold">Drop images here or click to select</p>
        <p className="text-sm text-muted-foreground">PNG, JPG, WEBP up to 10MB each</p>
      </div>

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold">{images.length} images selected</p>
            <button 
              onClick={clearAll}
              className="text-sm text-destructive hover:underline flex items-center gap-1"
              disabled={uploading}
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
            {images.map((img) => (
              <div 
                key={img.id} 
                className={`relative border-2 border-foreground p-2 space-y-2 ${
                  img.status === "success" ? "bg-green-50 dark:bg-green-900/20" :
                  img.status === "error" ? "bg-red-50 dark:bg-red-900/20" : ""
                }`}
              >
                {/* Status indicator */}
                {img.status === "uploading" && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                )}
                {img.status === "success" && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white p-1 rounded-full z-10">
                    <Check className="w-3 h-3" />
                  </div>
                )}

                {/* Image preview */}
                <div className="aspect-square bg-muted overflow-hidden">
                  <img 
                    src={img.preview} 
                    alt={img.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Title input */}
                <Input
                  value={img.title}
                  onChange={(e) => updateTitle(img.id, e.target.value)}
                  className="text-xs h-8"
                  disabled={uploading || img.status !== "pending"}
                  placeholder="Title"
                />

                {/* Remove button */}
                {img.status === "pending" && !uploading && (
                  <button
                    onClick={() => removeImage(img.id)}
                    className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground hover:bg-destructive/80 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Error message */}
                {img.error && (
                  <p className="text-xs text-destructive truncate">{img.error}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="space-y-2">
          <Progress value={progress} className="h-3" />
          <p className="text-sm text-center text-muted-foreground">
            Uploading... {progress}%
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <PopButton
          onClick={uploadAll}
          disabled={uploading || pendingCount === 0}
          className="flex-1"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              Upload {pendingCount} Image{pendingCount !== 1 ? "s" : ""}
            </>
          )}
        </PopButton>
        <PopButton
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
        >
          Cancel
        </PopButton>
      </div>

      {/* Summary after upload */}
      {!uploading && successCount > 0 && (
        <p className="text-center text-green-600 dark:text-green-400 font-bold">
          ✓ {successCount} images uploaded successfully
        </p>
      )}
    </ComicPanel>
  );
};
