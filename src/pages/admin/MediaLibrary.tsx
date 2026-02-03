import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Search,
  Upload,
  Trash2,
  Copy,
  Loader2,
  Image as ImageIcon,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
  alt_text: string | null;
  tags: string[] | null;
  file_size: number | null;
  width: number | null;
  height: number | null;
  uploaded_at: string;
}

const MediaLibrary = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: media = [], isLoading } = useQuery({
    queryKey: ["media-library"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as MediaItem[];
    },
  });

  const filteredMedia = media.filter((item) => {
    const searchLower = search.toLowerCase();
    return (
      item.filename.toLowerCase().includes(searchLower) ||
      item.alt_text?.toLowerCase().includes(searchLower) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("media_library").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library"] });
      setSelectedItems([]);
      toast.success("Items deleted");
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of files) {
      try {
        const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("content-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("content-images")
          .getPublicUrl(uploadData.path);

        await supabase.from("media_library").insert({
          url: urlData.publicUrl,
          filename: file.name,
          file_size: file.size,
        });

        uploaded++;
      } catch (error) {
        console.error("Failed to upload:", file.name, error);
      }
    }

    setUploading(false);
    queryClient.invalidateQueries({ queryKey: ["media-library"] });
    toast.success(`Uploaded ${uploaded} of ${files.length} files`);
    e.target.value = "";
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("URL copied to clipboard");
  };

  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display">Media Library</h1>
            <p className="text-muted-foreground">Manage uploaded images</p>
          </div>
          <div>
            <input
              type="file"
              id="upload-input"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <PopButton onClick={() => document.getElementById("upload-input")?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Upload
            </PopButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-foreground">
              <span className="text-sm font-bold">{selectedItems.length} selected</span>
              <button onClick={() => deleteMutation.mutate(selectedItems)} className="p-1 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setSelectedItems([])} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : filteredMedia.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Media Found</h3>
            <p className="text-muted-foreground">Upload your first image</p>
          </ComicPanel>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className={`group relative border-2 cursor-pointer ${selectedItems.includes(item.id) ? "border-primary" : "border-foreground"}`}
                onClick={() => toggleSelect(item.id)}
              >
                <div className={`absolute top-2 left-2 z-10 w-5 h-5 border-2 flex items-center justify-center ${selectedItems.includes(item.id) ? "bg-primary border-primary text-white" : "bg-background border-foreground"}`}>
                  {selectedItems.includes(item.id) && <Check className="w-3 h-3" />}
                </div>
                <div className="aspect-square overflow-hidden bg-muted">
                  <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-white text-xs truncate">{item.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/70 text-[10px]">{formatFileSize(item.file_size)}</span>
                    <button onClick={(e) => { e.stopPropagation(); copyUrl(item.url); }} className="p-1 bg-white/20 hover:bg-white/30 rounded text-white">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          {media.length} items • Total: {formatFileSize(media.reduce((acc, m) => acc + (m.file_size || 0), 0))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default MediaLibrary;
