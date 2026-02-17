import { useState, useEffect, useRef } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Pencil,
  Tag,
  LayoutGrid,
  Layers,
  ChevronDown,
  Sparkles,
  GripVertical,
  ArrowUpDown,
  AlertTriangle,
  Eye,
  FolderOpen,
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
  folder: string | null;
}

const MediaLibrary = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [usageFilter, setUsageFilter] = useState<"all" | "used" | "unused" | "duplicates">("all");
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<Array<{ url: string; description: string; alt_text: string; details: string; suggested_tags: string[] }> | null>(null);
  const [folderFilter, setFolderFilter] = useState<string>("all");

  // New state for inline rename
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  // New state for grouped view
  const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");
  const [tagFilter, setTagFilter] = useState<string>("all");

  // New state for bulk tagging
  const [tagPopoverOpen, setTagPopoverOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [autoCategorizing, setAutoCategorizing] = useState(false);

  // Drag reorder state
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  // Sort state
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "filename" | "size" | "duplicates" | "type">("date-desc");

  // Focus rename input when editing
  useEffect(() => {
    if (editingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [editingId]);

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

  // Fetch files directly from storage bucket (scan all known subfolders)
  const { data: storageFiles = [], isLoading: storageLoading, refetch: refetchStorage } = useQuery({
    queryKey: ["media-storage-bucket"],
    queryFn: async () => {
      const folders = ["", "artwork", "edited", "experiences", "life-periods", "experiments", "uploads", "artwork/process", "life-periods/gallery", "inspirations", "inspirations/gallery", "favorites", "certifications", "content"];
      const allFiles: any[] = [];
      
      for (const folder of folders) {
        try {
          const { data } = await supabase.storage
            .from("content-images")
            .list(folder, { limit: 1000, sortBy: { column: "created_at", order: "desc" } });
          
          if (data) {
            const prefix = folder ? `${folder}/` : "";
            data.filter(f => f.name && !f.id?.includes("folder")).forEach(f => {
              allFiles.push({ ...f, name: `${prefix}${f.name}` });
            });
          }
        } catch {}
      }
      
      return allFiles;
    },
  });

  // Fetch URLs used in content tables
  const { data: usedUrls = [], isLoading: usageLoading } = useQuery({
    queryKey: ["media-usage"],
    queryFn: async () => {
      const urls: { url: string; source: string }[] = [];
      
      const { data: artwork } = await supabase.from("artwork").select("image_url, images, title");
      artwork?.forEach(a => {
        if (a.image_url) urls.push({ url: a.image_url, source: `Artwork: ${a.title}` });
        ((a as any).images || []).forEach((img: string) => urls.push({ url: img, source: `Artwork: ${a.title}` }));
      });
      
      const { data: projects } = await supabase.from("projects").select("image_url, screenshots, title");
      projects?.forEach(p => {
        if (p.image_url) urls.push({ url: p.image_url, source: `Project: ${p.title}` });
        p.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Project: ${p.title}` }));
      });
      
      const { data: articles } = await supabase.from("articles").select("featured_image, title");
      articles?.forEach(a => a.featured_image && urls.push({ url: a.featured_image, source: `Article: ${a.title}` }));
      
      const { data: favorites } = await supabase.from("favorites").select("image_url, title");
      favorites?.forEach(f => f.image_url && urls.push({ url: f.image_url, source: `Favorite: ${f.title}` }));
      
      const { data: products } = await supabase.from("products").select("images, name");
      products?.forEach(p => {
        p.images?.forEach((img: string) => urls.push({ url: img, source: `Product: ${p.name}` }));
      });
      
      const { data: experiments } = await supabase.from("experiments").select("image_url, screenshots, name");
      experiments?.forEach(e => {
        if (e.image_url) urls.push({ url: e.image_url, source: `Experiment: ${e.name}` });
        e.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Experiment: ${e.name}` }));
      });
      
      const { data: experiences } = await supabase.from("experiences").select("image_url, screenshots, title");
      experiences?.forEach(e => {
        if (e.image_url) urls.push({ url: e.image_url, source: `Experience: ${e.title}` });
        e.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Experience: ${e.title}` }));
      });

      const { data: lifePeriods } = await supabase.from("life_periods").select("image_url, images, title");
      lifePeriods?.forEach(lp => {
        if (lp.image_url) urls.push({ url: lp.image_url, source: `Life Period: ${lp.title}` });
        ((lp as any).images || []).forEach((img: string) => urls.push({ url: img, source: `Life Period: ${lp.title}` }));
      });

      const { data: certifications } = await supabase.from("certifications").select("image_url, name");
      certifications?.forEach(c => c.image_url && urls.push({ url: c.image_url, source: `Certification: ${c.name}` }));

      const { data: clientProjects } = await supabase.from("client_projects").select("image_url, screenshots, project_name");
      clientProjects?.forEach(cp => {
        if (cp.image_url) urls.push({ url: cp.image_url, source: `Client Project: ${cp.project_name}` });
        cp.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Client Project: ${cp.project_name}` }));
      });

      const { data: productReviews } = await supabase.from("product_reviews").select("featured_image, screenshots, product_name");
      productReviews?.forEach(pr => {
        if (pr.featured_image) urls.push({ url: pr.featured_image, source: `Review: ${pr.product_name}` });
        pr.screenshots?.forEach((s: string) => urls.push({ url: s, source: `Review: ${pr.product_name}` }));
      });

      const { data: inspirations } = await supabase.from("inspirations").select("image_url, images, title");
      inspirations?.forEach(i => {
        if (i.image_url) urls.push({ url: i.image_url, source: `Inspiration: ${i.title}` });
        ((i as any).images || []).forEach((img: string) => urls.push({ url: img, source: `Inspiration: ${i.title}` }));
      });
      
      return urls;
    },
  });

  // Combine and deduplicate media from both sources
  const allMedia: MediaItem[] = (() => {
    const items: MediaItem[] = [];
    const seenUrls = new Set<string>();
    
    libraryMedia.forEach(item => {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        const usedIn = usedUrls.filter(u => u.url === item.url).map(u => u.source);
        items.push({
          ...item,
          source: "library",
          inUse: usedIn.length > 0,
          usedIn,
          folder: (item as any).folder || null,
        });
      }
    });
    
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
          folder: null,
        });
      }
    });
    
    return items;
  })();

  // Collect all unique tags for filtering
  const allTags = Array.from(new Set(allMedia.flatMap(m => m.tags || []))).sort();

  // Detect duplicates (same URL or similar filename ignoring UUID prefixes)
  const duplicateIds = new Set<string>();
  (() => {
    const urlMap = new Map<string, string[]>();
    const nameMap = new Map<string, string[]>();
    allMedia.forEach(item => {
      // Group by URL
      const ids = urlMap.get(item.url) || [];
      ids.push(item.id);
      urlMap.set(item.url, ids);
      // Group by cleaned filename (strip UUID prefix patterns)
      const cleanName = item.filename.replace(/^[a-f0-9-]{36,}-?/i, "").toLowerCase();
      const nameIds = nameMap.get(cleanName) || [];
      nameIds.push(item.id);
      nameMap.set(cleanName, nameIds);
    });
    urlMap.forEach(ids => { if (ids.length > 1) ids.forEach(id => duplicateIds.add(id)); });
    nameMap.forEach(ids => { if (ids.length > 1) ids.forEach(id => duplicateIds.add(id)); });
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
      (usageFilter === "unused" && !item.inUse) ||
      (usageFilter === "duplicates" && duplicateIds.has(item.id));

    const matchesTag =
      tagFilter === "all" ||
      (tagFilter === "uncategorized" ? (!item.tags || item.tags.length === 0) : item.tags?.includes(tagFilter));
    
    return matchesSearch && matchesUsage && matchesTag;
  });

  // Apply sorting
  const sortedMedia = [...filteredMedia].sort((a, b) => {
    switch (sortBy) {
      case "date-asc":
        return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime();
      case "filename":
        return a.filename.localeCompare(b.filename);
      case "size":
        return (b.file_size || 0) - (a.file_size || 0);
      case "duplicates": {
        const aIsDup = duplicateIds.has(a.id) ? 0 : 1;
        const bIsDup = duplicateIds.has(b.id) ? 0 : 1;
        return aIsDup - bIsDup;
      }
      case "type": {
        const aExt = a.filename.split(".").pop()?.toLowerCase() || "";
        const bExt = b.filename.split(".").pop()?.toLowerCase() || "";
        return aExt.localeCompare(bExt);
      }
      default: // date-desc
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime();
    }
  });

  // Group media by first tag for grouped view
  const groupedMedia = (() => {
    const groups: Record<string, MediaItem[]> = {};
    sortedMedia.forEach(item => {
      const tag = item.tags && item.tags.length > 0 ? item.tags[0] : "Uncategorized";
      if (!groups[tag]) groups[tag] = [];
      groups[tag].push(item);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Uncategorized") return 1;
      if (b === "Uncategorized") return -1;
      return a.localeCompare(b);
    });
    return sortedKeys.map(key => ({ tag: key, items: groups[key] }));
  })();

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const libraryIds = allMedia
        .filter(m => ids.includes(m.id) && m.source === "library")
        .map(m => m.id);
      
      if (libraryIds.length > 0) {
        const { error } = await supabase.from("media_library").delete().in("id", libraryIds);
        if (error) throw error;
      }
      
      const storageItems = allMedia.filter(m => ids.includes(m.id));
      for (const item of storageItems) {
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

  // Inline rename mutation
  const renameMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const { error } = await supabase
        .from("media_library")
        .update({ filename: newName })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
      setEditingId(null);
      toast.success("Renamed");
    },
    onError: () => {
      toast.error("Failed to rename");
    },
  });

  // Bulk tag mutation
  const bulkTagMutation = useMutation({
    mutationFn: async ({ ids, tag }: { ids: string[]; tag: string }) => {
      const libraryItems = allMedia.filter(m => ids.includes(m.id) && m.source === "library");
      for (const item of libraryItems) {
        const currentTags = item.tags || [];
        if (!currentTags.includes(tag)) {
          const { error } = await supabase
            .from("media_library")
            .update({ tags: [...currentTags, tag] })
            .eq("id", item.id);
          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
      setNewTagInput("");
      toast.success("Tags updated");
    },
    onError: () => {
      toast.error("Failed to update tags");
    },
  });

  const handleStartRename = (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    if (item.source !== "library") return;
    setEditingId(item.id);
    setEditingName(item.filename);
  };

  const handleSaveRename = () => {
    if (!editingId || !editingName.trim()) return;
    renameMutation.mutate({ id: editingId, newName: editingName.trim() });
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleAddTag = () => {
    const tag = newTagInput.trim().toLowerCase();
    if (!tag || selectedItems.length === 0) return;
    const libraryIds = allMedia
      .filter(m => selectedItems.includes(m.id) && m.source === "library")
      .map(m => m.id);
    if (libraryIds.length === 0) {
      toast.error("Only library items can be tagged");
      return;
    }
    bulkTagMutation.mutate({ ids: libraryIds, tag });
  };

  const handleAutoCategorize = async () => {
    const selectedMedia = allMedia.filter(m => selectedItems.includes(m.id));
    if (selectedMedia.length === 0) return;

    setAutoCategorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke("categorize-images", {
        body: { urls: selectedMedia.map(m => m.url) },
      });

      if (error) throw error;

      const results = data?.results as Array<{ url: string; tags: string[] }> | undefined;
      if (!results) throw new Error("No results returned");

      let updated = 0;
      for (const result of results) {
        const item = allMedia.find(m => m.url === result.url && m.source === "library");
        if (item && result.tags.length > 0) {
          const existingTags = item.tags || [];
          const mergedTags = Array.from(new Set([...existingTags, ...result.tags]));
          const { error: updateError } = await supabase
            .from("media_library")
            .update({ tags: mergedTags })
            .eq("id", item.id);
          if (!updateError) updated++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
      toast.success(`Auto-categorized ${updated} image(s)`);
    } catch (error) {
      console.error("Auto-categorize error:", error);
      toast.error("Failed to auto-categorize images");
    } finally {
      setAutoCategorizing(false);
    }
  };

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

  const handleAnalyzeSelected = async () => {
    const selectedMedia = allMedia.filter(m => selectedItems.includes(m.id));
    if (selectedMedia.length === 0) return;
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-media", {
        body: { urls: selectedMedia.map(m => m.url) },
      });
      if (error) throw error;
      if (data?.results) {
        setAnalysisResults(data.results);
        // Auto-update alt_text and tags for library items
        let updated = 0;
        for (const result of data.results) {
          if (result.error) continue;
          const item = allMedia.find(m => m.url === result.url && m.source === "library");
          if (item) {
            const existingTags = item.tags || [];
            const mergedTags = Array.from(new Set([...existingTags, ...(result.suggested_tags || [])]));
            await supabase.from("media_library").update({ 
              alt_text: result.alt_text || item.alt_text,
              tags: mergedTags,
            }).eq("id", item.id);
            updated++;
          }
        }
        queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
        toast.success(`Analyzed ${data.results.length} image(s), updated ${updated}`);
      }
    } catch (error) {
      console.error("Analyze error:", error);
      toast.error("Failed to analyze images");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleBulkDeleteDuplicates = async () => {
    // Group duplicates by cleaned filename
    const nameMap = new Map<string, MediaItem[]>();
    allMedia.forEach(item => {
      const cleanName = item.filename.replace(/^[a-f0-9-]{36,}-?/i, "").toLowerCase();
      const items = nameMap.get(cleanName) || [];
      items.push(item);
      nameMap.set(cleanName, items);
    });
    
    const toDelete: string[] = [];
    nameMap.forEach(items => {
      if (items.length > 1) {
        // Keep the oldest (first uploaded), delete the rest
        const sorted = items.sort((a, b) => new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime());
        sorted.slice(1).forEach(item => toDelete.push(item.id));
      }
    });

    if (toDelete.length === 0) {
      toast.info("No duplicates to delete");
      return;
    }

    if (!confirm(`Delete ${toDelete.length} duplicate(s)? The oldest version of each will be kept.`)) return;
    deleteMutation.mutate(toDelete);
  };

  // Get unique folders for filter
  const allFolders = Array.from(new Set(allMedia.map(m => m.folder).filter(Boolean) as string[])).sort();

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isLoading = libraryLoading || storageLoading || usageLoading;
  const usedCount = allMedia.filter(m => m.inUse).length;
  const unusedCount = allMedia.filter(m => !m.inUse).length;
  const duplicateCount = duplicateIds.size;

  // Drag handlers for media grid reorder
  const handleMediaDragStart = (e: React.DragEvent, item: MediaItem) => {
    setDraggedId(item.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleMediaDragOver = (e: React.DragEvent, item: MediaItem) => {
    e.preventDefault();
    if (draggedId && draggedId !== item.id) {
      setDragOverId(item.id);
    }
  };
  const handleMediaDragEnd = async () => {
    if (draggedId && dragOverId && draggedId !== dragOverId) {
      // Swap uploaded_at timestamps to persist order
      const draggedItem = allMedia.find(m => m.id === draggedId);
      const overItem = allMedia.find(m => m.id === dragOverId);
      if (draggedItem?.source === "library" && overItem?.source === "library") {
        await supabase.from("media_library").update({ uploaded_at: overItem.uploaded_at }).eq("id", draggedItem.id);
        await supabase.from("media_library").update({ uploaded_at: draggedItem.uploaded_at }).eq("id", overItem.id);
        queryClient.invalidateQueries({ queryKey: ["media-library-table"] });
        toast.success("Reordered");
      }
    }
    setDraggedId(null);
    setDragOverId(null);
  };

  // Render a single media card
  const renderMediaCard = (item: MediaItem) => (
    <div
      key={item.id}
      draggable={item.source === "library"}
      onDragStart={(e) => handleMediaDragStart(e, item)}
      onDragOver={(e) => handleMediaDragOver(e, item)}
      onDragEnd={handleMediaDragEnd}
      className={`group relative border-2 cursor-pointer transition-all ${
        selectedItems.includes(item.id) ? "border-primary" : "border-foreground"
      } ${dragOverId === item.id ? "ring-2 ring-primary scale-[1.02]" : ""} ${draggedId === item.id ? "opacity-50" : ""}`}
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

      {/* Duplicate badge */}
      {duplicateIds.has(item.id) && (
        <Badge variant="destructive" className="absolute top-2 right-2 z-10" style={item.inUse ? { top: '2rem' } : {}}>
          <AlertTriangle className="w-2.5 h-2.5 mr-0.5" /> Duplicate
        </Badge>
      )}

      {/* Drag handle */}
      {item.source === "library" && (
        <div className="absolute bottom-2 left-2 z-10 p-1 bg-background/80 border border-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
          <GripVertical className="w-3 h-3" />
        </div>
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

      {/* Inline rename area */}
      {editingId === item.id ? (
        <div className="p-1 bg-background" onClick={e => e.stopPropagation()}>
          <input
            ref={renameInputRef}
            value={editingName}
            onChange={e => setEditingName(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter") handleSaveRename();
              if (e.key === "Escape") handleCancelRename();
            }}
            className="w-full px-1 py-0.5 text-xs border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex gap-1 mt-1">
            <button onClick={handleSaveRename} className="p-0.5 text-green-600 hover:bg-green-100 rounded">
              <Check className="w-3 h-3" />
            </button>
            <button onClick={handleCancelRename} className="p-0.5 text-destructive hover:bg-destructive/10 rounded">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Hover overlay */}
      {editingId !== item.id && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
          <p className="text-white text-xs truncate">{item.filename}</p>
          {/* Tags preview */}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-0.5 mt-0.5">
              {item.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[9px] px-1 py-0 bg-white/20 text-white rounded">
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-[9px] px-1 py-0 bg-white/20 text-white rounded">+{item.tags.length - 3}</span>
              )}
            </div>
          )}
          <div className="flex items-center justify-between mt-1">
            <span className="text-white/70 text-[10px]">
              {formatFileSize(item.file_size)}
            </span>
            <div className="flex gap-1">
              {item.source === "library" && (
                <button
                  onClick={(e) => handleStartRename(e, item)}
                  className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                  title="Rename"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
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
      )}
    </div>
  );

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
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All ({allMedia.length})</SelectItem>
              <SelectItem value="used">In Use ({usedCount})</SelectItem>
              <SelectItem value="unused">Unused ({unusedCount})</SelectItem>
              <SelectItem value="duplicates">Duplicates ({duplicateCount})</SelectItem>
            </SelectContent>
          </Select>

          {/* Tag filter */}
          <Select value={tagFilter} onValueChange={setTagFilter}>
            <SelectTrigger className="w-44">
              <Tag className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          <div className="flex border-2 border-foreground">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("grouped")}
              className={`p-2 ${viewMode === "grouped" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              title="Grouped by tag"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={(v: typeof sortBy) => setSortBy(v)}>
            <SelectTrigger className="w-44">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Date (newest)</SelectItem>
              <SelectItem value="date-asc">Date (oldest)</SelectItem>
              <SelectItem value="filename">Filename</SelectItem>
              <SelectItem value="size">File size</SelectItem>
              <SelectItem value="duplicates">Duplicates first</SelectItem>
              <SelectItem value="type">By type</SelectItem>
            </SelectContent>
          </Select>

          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted border-2 border-foreground flex-wrap">
              <span className="text-sm font-bold">{selectedItems.length} selected</span>
              <button onClick={() => handleBatchEdit("rotate")} disabled={processingEdit} className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground" title="Rotate 90°">↻ Rotate</button>
              <button onClick={() => handleBatchEdit("removeBg")} disabled={processingEdit} className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground" title="Remove Background">✂ Remove BG</button>
              <button onClick={() => handleBatchEdit("autoCrop")} disabled={processingEdit} className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground" title="Auto-crop whitespace">⬡ Auto-Crop</button>
              
              {/* Bulk Tag */}
              <Popover open={tagPopoverOpen} onOpenChange={setTagPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground" title="Tag selected">
                    <Tag className="w-3 h-3 inline mr-1" /> Tag
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <p className="text-sm font-bold">Add tag to selected</p>
                    <div className="flex gap-1">
                      <Input
                        value={newTagInput}
                        onChange={e => setNewTagInput(e.target.value)}
                        placeholder="Tag name..."
                        className="text-sm"
                        onKeyDown={e => e.key === "Enter" && handleAddTag()}
                      />
                      <button onClick={handleAddTag} className="p-2 border border-foreground hover:bg-muted">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                    {allTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {allTags.slice(0, 15).map(tag => (
                          <button
                            key={tag}
                            onClick={() => {
                              const libraryIds = allMedia
                                .filter(m => selectedItems.includes(m.id) && m.source === "library")
                                .map(m => m.id);
                              if (libraryIds.length > 0) {
                                bulkTagMutation.mutate({ ids: libraryIds, tag });
                              }
                            }}
                            className="px-2 py-0.5 text-xs bg-muted border border-foreground hover:bg-primary hover:text-primary-foreground"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Auto-Categorize */}
              <button
                onClick={handleAutoCategorize}
                disabled={autoCategorizing}
                className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground"
                title="AI auto-categorize"
              >
                {autoCategorizing ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : <Sparkles className="w-3 h-3 inline mr-1" />}
                Auto-Tag
              </button>

              {/* AI Analyze */}
              <button
                onClick={handleAnalyzeSelected}
                disabled={analyzing}
                className="px-2 py-1 text-xs font-bold border border-foreground hover:bg-primary hover:text-primary-foreground"
                title="AI analyze images"
              >
                {analyzing ? <Loader2 className="w-3 h-3 inline animate-spin mr-1" /> : <Eye className="w-3 h-3 inline mr-1" />}
                Analyze
              </button>

              {/* Bulk Delete Duplicates */}
              {duplicateCount > 0 && (
                <button
                  onClick={handleBulkDeleteDuplicates}
                  className="px-2 py-1 text-xs font-bold border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  title="Delete all duplicates (keeps oldest)"
                >
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Delete Dupes
                </button>
              )}

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

        {/* Media Grid / Grouped View */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : sortedMedia.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Media Found</h3>
            <p className="text-muted-foreground">Upload your first image or scan storage</p>
          </ComicPanel>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {sortedMedia.map(renderMediaCard)}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMedia.map(group => (
              <Collapsible key={group.tag} defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-3 bg-muted border-2 border-foreground hover:bg-accent text-left font-bold">
                  <ChevronDown className="w-4 h-4" />
                  <Tag className="w-4 h-4" />
                  <span className="capitalize">{group.tag}</span>
                  <Badge variant="secondary" className="ml-auto">{group.items.length}</Badge>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4 border-2 border-t-0 border-foreground">
                    {group.items.map(renderMediaCard)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
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
