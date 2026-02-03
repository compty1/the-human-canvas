import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Loader2, GripVertical } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  folder?: string;
  maxImages?: number;
  className?: string;
}

export const MultiImageUploader = ({
  value = [],
  onChange,
  label = "Images",
  folder = "content",
  maxImages = 10,
  className,
}: MultiImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      if (value.length + files.length > maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      const newUrls: string[] = [];

      try {
        for (const file of Array.from(files)) {
          const fileName = `${folder}/${Date.now()}-${file.name}`;
          const { data, error } = await supabase.storage
            .from("content-images")
            .upload(fileName, file);

          if (error) throw error;

          const { data: urlData } = supabase.storage
            .from("content-images")
            .getPublicUrl(data.path);

          newUrls.push(urlData.publicUrl);
        }

        onChange([...value, ...newUrls]);
        toast.success(`${newUrls.length} image(s) uploaded`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload images");
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, folder, maxImages]
  );

  const removeImage = (index: number) => {
    const newUrls = value.filter((_, i) => i !== index);
    onChange(newUrls);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newUrls = [...value];
    const draggedItem = newUrls[draggedIndex];
    newUrls.splice(draggedIndex, 1);
    newUrls.splice(index, 0, draggedItem);
    onChange(newUrls);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-bold flex items-center justify-between">
          {label}
          <span className="text-muted-foreground font-normal">
            {value.length}/{maxImages}
          </span>
        </Label>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {value.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "relative group aspect-square border-2 border-foreground cursor-move",
                draggedIndex === index && "opacity-50"
              )}
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 bg-background border-2 border-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute top-1 left-1 p-1 bg-background/80 border border-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Zone */}
      {value.length < maxImages && (
        <label
          className={cn(
            "flex flex-col items-center justify-center h-24 border-2 border-dashed border-foreground cursor-pointer hover:bg-muted transition-colors",
            uploading && "opacity-50 cursor-not-allowed"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin mb-1" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 mb-1" />
              <span className="text-sm text-muted-foreground">
                Click or drag images here
              </span>
              <span className="text-xs text-muted-foreground">
                (Select multiple files)
              </span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            disabled={uploading}
            className="hidden"
          />
        </label>
      )}
    </div>
  );
};
