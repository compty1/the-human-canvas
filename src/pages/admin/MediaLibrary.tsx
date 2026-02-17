import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { ImageEditPreview } from "@/components/admin/ImageEditPreview";
import { rotateImage, flipImage, removeWhitespace, removeBackground } from "@/lib/imageEditing";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Upload,
  Trash2,
  Copy,
  Loader2,
  Image as ImageIcon,
  Check,
  X,
  RefreshCw,
  Crop,
  ExternalLink,
  Plus,
  Palette,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import { AddToContentModal } from "@/components/admin/AddToContentModal";

const artworkCategories = [
  { value: "mixed", label: "Mixed Media" },
  { value: "drawing", label: "Drawing" },
  { value: "painting", label: "Painting" },
  { value: "photography", label: "Photography" },
  { value: "digital", label: "Digital Art" },
  { value: "collage", label: "Collage" },
  { value: "sculpture", label: "Sculpture" },
  { value: "other", label: "Other" },
];

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
  source: "library" | "storage";
  inUse: boolean;
  usedIn?: string[];
}

const MediaLibrary = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused">("all");
  const [cropItem, setCropItem] = useState<MediaItem | null>(null);
  const [addToArtworkModal, setAddToArtworkModal] = useState(false);
  const [addToContentModal, setAddToContentModal] = useState(false);
  const [artworkForm, setArtworkForm] = useState({
    category: "mixed",
    title: "",
    description: "",
  });
  const [addingToArtwork, setAddingToArtwork] = useState(false);
  const [editResults, setEditResults] = useState<Array<{ originalUrl: string; editedBlob: Blob; filename: string }>>([]);
  const [showEditPreview, setShowEditPreview] = useState(false);
  const [processingEdit, setProcessingEdit] = useState(false);

  // Fetch media from library table
  const { data: libraryMedia = [], isLoading: libraryLoading } = useQuery({
    queryKey: ["media-library-table"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("media_library")
        .select("*")
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch files directly from storage bucket
  const { data: storageFiles = [], isLoading: storageLoading, refetch: refetchStorage } = useQuery({
    queryKey: ["media-storage-bucket"],
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("content-images")
        .list("", { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
      
      if (error) throw error;
      
      // Also check artwork folder
      const { data: artworkData } = await supabase.storage
        .from("content-images")
        .list("artwork", { limit: 1000 });
      
      const allFiles = [
        ...(data || []).filter(f => f.name && !f.id?.includes("folder")),
        ...(artworkData || []).map(f => ({ ...f, name: `artwork/${f.name}` })).filter(f => f.name),
      ];
      
      return allFiles;
    },
  });

  // Fetch URLs used in content tables
  const { data: usedUrls = [], isLoading: usageLoading } = useQuery({
    queryKey: ["media-usage"],
    queryFn: async () => {
      const urls: { url: string; source: string }[] = [];
      
      // Artwork
      const { data: artwork } = await supabase.from("artwork").select("image_url, title");
      artwork?.forEach(a => a.image_url && urls.push({ url: a.image_url, source: `Artwork: ${a.title}` }));
      
      // Projects
      const { data: projects } = await supabase.from("projects").select("image_url, screenshots, title");
      projects?.forEach(p => {
        if (p.image_url) urls.push({ url: p.image_url, source: `Project: ${p.title}` });
        p.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Project: ${p.title}` }));
      });
      
      // Articles
      const { data: articles } = await supabase.from("articles").select("featured_image, title");
      articles?.forEach(a => a.featured_image && urls.push({ url: a.featured_image, source: `Article: ${a.title}` }));
      
      // Favorites
      const { data: favorites } = await supabase.from("favorites").select("image_url, title");
      favorites?.forEach(f => f.image_url && urls.push({ url: f.image_url, source: `Favorite: ${f.title}` }));
      
      // Products
      const { data: products } = await supabase.from("products").select("images, name");
      products?.forEach(p => {
        p.images?.forEach((img: string) => urls.push({ url: img, source: `Product: ${p.name}` }));
      });
      
      // Experiments
      const { data: experiments } = await supabase.from("experiments").select("image_url, screenshots, name");
      experiments?.forEach(e => {
        if (e.image_url) urls.push({ url: e.image_url, source: `Experiment: ${e.name}` });
        e.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Experiment: ${e.name}` }));
      });
      
      // Experiences
      const { data: experiences } = await supabase.from("experiences").select("image_url, screenshots, title");
      experiences?.forEach(e => {
        if (e.image_url) urls.push({ url: e.image_url, source: `Experience: ${e.title}` });
        e.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Experience: ${e.title}` }));
      });
      
      return urls;
    },
  });

  // Combine and deduplicate media from both sources
  const allMedia: MediaItem[] = (() => {
    const items: MediaItem[] = [];
    const seenUrls = new Set<string>();
    
    // Add library items
    libraryMedia.forEach(item => {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        const usedIn = usedUrls.filter(u => u.url === item.url).map(u => u.source);
        items.push({
          ...item,
          source: "library",
          inUse: usedIn.length > 0,
          usedIn,
        });
      }
    });
    
    // Add storage items not in library
    storageFiles.forEach(file => {
      const { data } = supabase.storage.from("content-images").getPublicUrl(file.name);
      const url = data.publicUrl;
      
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        const usedIn = usedUrls.filter(u => u.url === url).map(u => u.source);
        items.push({
          id: file.id || file.name,
          url,
          filename: file.name.split("/").pop() || file.name,
          alt_text: null,
          tags: null,
          file_size: file.metadata?.size || null,
          width: null,
          height: null,
          uploaded_at: file.created_at || new Date().toISOString(),
          source: "storage",
          inUse: usedIn.length > 0,
          usedIn,
        });
      }
    });
    
    return items;
  })();

  // Apply filters
  const filteredMedia = allMedia.filter((item) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      item.filename.toLowerCase().includes(searchLower) ||
      item.alt_text?.toLowerCase().includes(searchLower) ||
      item.tags?.some((tag) => tag.toLowerCase().includes(searchLower)) ||
      item.usedIn?.some(u => u.toLowerCase().includes(searchLower));
    
    const matchesUsage =
      usageFilter === "all" ||
      (usageFilter === "used" && item.inUse) ||
      (usageFilter === "unused" && !item.inUse);
    
    return matchesSearch && matchesUsage;
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      // Delete from library table
      const libraryIds = allMedia
        .filter(m => ids.includes(m.id) && m.source === "library")
        .map(m => m.id);
      
      if (libraryIds.length > 0) {
        const { error } = await supabase.from("media_library").delete().in("id", libraryIds);
        if (error) throw error;
      }
      
      // Also try to delete from storage
      const storageItems = allMedia.filter(m => ids.includes(m.id));
      for (const item of storageItems) {
        // Extract path from URL
        const urlParts = item.url.split("/content-images/");
        if (urlParts[1]) {
          await supabase.storage.from("content-images").remove([urlParts[1]]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
      queryClient.invalidateQueries({ queryKey: ["media-storage-bucket"] });
      setSelectedItems([]);
      toast.success("Items deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete some items");
      console.error(error);
    },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of files) {
      try {
        const uniqueId = crypto.randomUUID();
        const ext = file.name.split(".").pop();
        const fileName = `${uniqueId}.${ext}`;
        
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
    queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
    queryClient.invalidateQueries({ queryKey: ["media-storage-bucket"] });
    toast.success(`Uploaded ${uploaded} of ${files.length} files`);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob, newFilename: string) => {
    try {
      const uniqueId = crypto.randomUUID();
      const fileName = `${uniqueId}-${newFilename}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("content-images")
        .upload(fileName, croppedBlob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("content-images")
        .getPublicUrl(uploadData.path);

      await supabase.from("media_library").insert({
        url: urlData.publicUrl,
        filename: newFilename,
        file_size: croppedBlob.size,
      });

      queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
      queryClient.invalidateQueries({ queryKey: ["media-storage-bucket"] });
      toast.success("Cropped image saved");
    } catch (error) {
      console.error("Failed to save cropped image:", error);
      toast.error("Failed to save cropped image");
    }
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

  // Add selected items to artwork
  const handleAddToArtwork = async () => {
    if (selectedItems.length === 0) return;
    
    setAddingToArtwork(true);
    try {
      const selectedMedia = allMedia.filter(m => selectedItems.includes(m.id));
      
      for (let i = 0; i < selectedMedia.length; i++) {
        const media = selectedMedia[i];
        const title = selectedItems.length === 1 && artworkForm.title 
          ? artworkForm.title 
          : media.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        
        await supabase.from("artwork").insert({
          title,
          image_url: media.url,
          category: artworkForm.category,
          description: selectedItems.length === 1 ? artworkForm.description : null,
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ["admin-artwork"] });
      toast.success(`Added ${selectedMedia.length} item(s) to artwork`);
      setAddToArtworkModal(false);
      setSelectedItems([]);
      setArtworkForm({ category: "mixed", title: "", description: "" });
    } catch (error) {
      console.error("Failed to add to artwork:", error);
      toast.error("Failed to add to artwork");
    } finally {
      setAddingToArtwork(false);
    }
  };

  const handleBatchEdit = async (action: "rotate" | "removeBg" | "autoCrop") => {
    const selectedMedia = allMedia.filter(m => selectedItems.includes(m.id));
    if (selectedMedia.length === 0) return;
    setProcessingEdit(true);
    const results: Array<{ originalUrl: string; editedBlob: Blob; filename: string }> = [];
    try {
      for (const item of selectedMedia) {
        let blob: Blob;
        if (action === "rotate") blob = await rotateImage(item.url, 90);
        else if (action === "removeBg") blob = await removeBackground(item.url);
        else blob = await removeWhitespace(item.url);
        results.push({ originalUrl: item.url, editedBlob: blob, filename: item.filename });
      }
      setEditResults(results);
      setShowEditPreview(true);
    } catch (error) {
      console.error("Edit error:", error);
      toast.error("Failed to process images. Some may have CORS restrictions.");
    } finally {
      setProcessingEdit(false);
    }
  };

  const handleApproveEdits = async (approved: Array<{ originalUrl: string; editedBlob: Blob; filename: string }>) => {
    for (const item of approved) {
      try {
        const uniqueId = crypto.randomUUID();
        const fileName = `edited/${uniqueId}-${item.filename}`;
        const { data: uploadData, error } = await supabase.storage.from("content-images").upload(fileName, item.editedBlob);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("content-images").getPublicUrl(uploadData.path);
        await supabase.from("media_library").insert({ url: urlData.publicUrl, filename: `edited-${item.filename}`, file_size: item.editedBlob.size });
      } catch (err) { console.error("Save error:", err); }
    }
    queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
    queryClient.invalidateQueries({ queryKey: ["media-storage-bucket"] });
    toast.success(`Saved ${approved.length} edited image(s)`);
    setShowEditPreview(false);
    setEditResults([]);
    setSelectedItems([]);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isLoading = libraryLoading || storageLoading || usageLoading;
  const usedCount = allMedia.filter(m => m.inUse).length;
  const unusedCount = allMedia.filter(m => !m.inUse).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display">Files & Media</h1>
            <p className="text-muted-foreground">
              Manage all uploaded images and files
            </p>
          </div>
          <div className="flex gap-2">
            <PopButton
              variant="outline"
              onClick={() => {
                setScanning(true);
                refetchStorage().finally(() => setScanning(false));
              }}
              disabled={scanning}
            >
              {scanning ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Scan Storage
            </PopButton>
            <input
              type="file"
              id="upload-input"
              multiple
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
            <PopButton
              onClick={() => document.getElementById("upload-input")?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              Upload
            </PopButton>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={usageFilter} onValueChange={(v: typeof usageFilter) => setUsageFilter(v)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({allMedia.length})</SelectItem>
              <SelectItem value="used">In Use ({usedCount})</SelectItem>
              <SelectItem value="unused">Unused ({unusedCount})</SelectItem>
            </SelectContent>
          </Select>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-foreground flex-wrap">
              <span className="text-sm font-bold">{selectedItems.length} selected</span>
              <button onClick={() => handleBatchEdit("rotate")} disabled={processingEdit} className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground" title="Rotate 90°">↻ Rotate</button>
              <button onClick={() => handleBatchEdit("removeBg")} disabled={processingEdit} className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground" title="Remove Background">✂ Remove BG</button>
              <button onClick={() => handleBatchEdit("autoCrop")} disabled={processingEdit} className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground" title="Auto-crop whitespace">⬡ Auto-Crop</button>
              <button
                onClick={() => setAddToContentModal(true)}
                className="p-1 text-primary hover:bg-primary/10 rounded"
                title="Add to Content"
              >
                <FolderPlus className="w-4 h-4" />
              </button>
              <button
                onClick={() => setAddToArtworkModal(true)}
                className="p-1 text-primary hover:bg-primary/10 rounded"
                title="Add to Artwork"
              >
                <Palette className="w-4 h-4" />
              </button>
              <button
                onClick={() => deleteMutation.mutate(selectedItems)}
                className="p-1 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={() => setSelectedItems([])} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Media Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredMedia.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Media Found</h3>
            <p className="text-muted-foreground">Upload your first image or scan storage</p>
          </ComicPanel>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                className={`group relative border-2 cursor-pointer ${
                  selectedItems.includes(item.id) ? "border-primary" : "border-foreground"
                }`}
                onClick={() => toggleSelect(item.id)}
              >
                {/* Selection checkbox */}
                <div
                  className={`absolute top-2 left-2 z-10 w-5 h-5 border-2 flex items-center justify-center ${
                    selectedItems.includes(item.id)
                      ? "bg-primary border-primary text-white"
                      : "bg-background border-foreground"
                  }`}
                >
                  {selectedItems.includes(item.id) && <Check className="w-3 h-3" />}
                </div>

                {/* In Use badge */}
                {item.inUse && (
                  <Badge className="absolute top-2 right-2 z-10 bg-green-600">
                    In Use
                  </Badge>
                )}

                {/* Image */}
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                  <p className="text-white text-xs truncate">{item.filename}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-white/70 text-[10px]">
                      {formatFileSize(item.file_size)}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCropItem(item);
                        }}
                        className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                        title="Crop"
                      >
                        <Crop className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyUrl(item.url);
                        }}
                        className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                        title="Copy URL"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                        title="Open"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  {item.usedIn && item.usedIn.length > 0 && (
                    <p className="text-white/60 text-[10px] mt-1 truncate">
                      {item.usedIn[0]}
                      {item.usedIn.length > 1 && ` +${item.usedIn.length - 1}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className="text-sm text-muted-foreground">
          {allMedia.length} items • {usedCount} in use • {unusedCount} unused • Total:{" "}
          {formatFileSize(allMedia.reduce((acc, m) => acc + (m.file_size || 0), 0))}
        </div>

        {/* Crop Dialog */}
        {cropItem && (
          <ImageCropper
            open={!!cropItem}
            onClose={() => setCropItem(null)}
            imageUrl={cropItem.url}
            filename={cropItem.filename}
            onCropComplete={handleCropComplete}
          />
        )}

        {/* Add to Artwork Dialog */}
        <Dialog open={addToArtworkModal} onOpenChange={setAddToArtworkModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Artwork Gallery</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Adding {selectedItems.length} item(s) to the artwork gallery
              </p>
              
              <div>
                <Label>Category</Label>
                <Select 
                  value={artworkForm.category} 
                  onValueChange={(v) => setArtworkForm(prev => ({ ...prev, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {artworkCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedItems.length === 1 && (
                <>
                  <div>
                    <Label>Title (optional)</Label>
                    <Input
                      value={artworkForm.title}
                      onChange={(e) => setArtworkForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Leave blank to use filename"
                    />
                  </div>
                  <div>
                    <Label>Description (optional)</Label>
                    <Textarea
                      value={artworkForm.description}
                      onChange={(e) => setArtworkForm(prev => ({ ...prev, description: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </>
              )}
              
              <div className="flex justify-end gap-2">
                <PopButton variant="outline" onClick={() => setAddToArtworkModal(false)}>
                  Cancel
                </PopButton>
                <PopButton onClick={handleAddToArtwork} disabled={addingToArtwork}>
                  {addingToArtwork ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add to Artwork
                </PopButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add to Content Modal */}
        <AddToContentModal
          open={addToContentModal}
          onOpenChange={setAddToContentModal}
          selectedMedia={allMedia.filter(m => selectedItems.includes(m.id)).map(m => ({ id: m.id, url: m.url, filename: m.filename }))}
          onSuccess={() => {
            setSelectedItems([]);
            queryClient.invalidateQueries({ queryKey: ["media-usage"] });
          }}
        />

        {/* Image Edit Preview */}
        <ImageEditPreview
          open={showEditPreview}
          onClose={() => { setShowEditPreview(false); setEditResults([]); }}
          results={editResults}
          onApprove={handleApproveEdits}
          isProcessing={processingEdit}
          title="Review Image Edits"
        />
      </div>
    </AdminLayout>
  );
};

export default MediaLibrary;