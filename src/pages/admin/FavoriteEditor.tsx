import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Link as LinkIcon, Plus, X } from "lucide-react";
import { toast } from "sonner";

const types = [
  { value: "art", label: "Art" },
  { value: "music", label: "Music" },
  { value: "movie", label: "Movie" },
  { value: "book", label: "Book" },
  { value: "article", label: "Article" },
  { value: "research", label: "Research" },
  { value: "creator", label: "Creator" },
  { value: "other", label: "Other" },
];

const FavoriteEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    type: "art" as string,
    source_url: "",
    image_url: "",
    creator_name: "",
    creator_url: "",
    creator_location: "",
    description: "",
    impact_statement: "",
    is_current: false,
    discovered_date: "",
    tags: [] as string[],
  });

  const [newTag, setNewTag] = useState("");
  const [importing, setImporting] = useState(false);

  const { data: favorite, isLoading } = useQuery({
    queryKey: ["favorite-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("favorites")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (favorite) {
      setForm({
        title: favorite.title || "",
        type: favorite.type || "art",
        source_url: favorite.source_url || "",
        image_url: favorite.image_url || "",
        creator_name: favorite.creator_name || "",
        creator_url: favorite.creator_url || "",
        creator_location: favorite.creator_location || "",
        description: favorite.description || "",
        impact_statement: favorite.impact_statement || "",
        is_current: favorite.is_current || false,
        discovered_date: favorite.discovered_date || "",
        tags: favorite.tags || [],
      });
    }
  }, [favorite]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        source_url: form.source_url || null,
        image_url: form.image_url || null,
        creator_name: form.creator_name || null,
        creator_url: form.creator_url || null,
        creator_location: form.creator_location || null,
        description: form.description || null,
        impact_statement: form.impact_statement || null,
        discovered_date: form.discovered_date || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("favorites")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("favorites").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-favorites"] });
      toast.success(isEditing ? "Favorite updated" : "Favorite added");
      navigate("/admin/favorites");
    },
    onError: (error) => {
      toast.error("Failed to save");
      console.error(error);
    },
  });

  const importFromUrl = async () => {
    if (!form.source_url) {
      toast.error("Enter a URL first");
      return;
    }

    setImporting(true);
    try {
      // Use analyze-site function to fetch metadata
      const { data, error } = await supabase.functions.invoke("analyze-site", {
        body: { url: form.source_url },
      });

      if (error) throw error;

      if (data) {
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          image_url: data.og_image || prev.image_url,
        }));
        toast.success("Imported metadata from URL");
      }
    } catch (error) {
      toast.error("Failed to import from URL");
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const addTag = () => {
    if (newTag && !form.tags.includes(newTag)) {
      setForm(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      setNewTag("");
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/favorites")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Favorite" : "Add Favorite"}
            </h1>
          </div>
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="favorite"
          onImport={(data) => {
            if (data.title) setForm(prev => ({ ...prev, title: String(data.title) }));
            if (data.description) setForm(prev => ({ ...prev, description: String(data.description) }));
            if (data.impact_statement) setForm(prev => ({ ...prev, impact_statement: String(data.impact_statement) }));
            if (data.creator_name) setForm(prev => ({ ...prev, creator_name: String(data.creator_name) }));
            if (data.type) setForm(prev => ({ ...prev, type: String(data.type) }));
            if (data.tags) setForm(prev => ({ ...prev, tags: Array.isArray(data.tags) ? data.tags : [] }));
          }}
        />

        {/* Import from URL */}
        <ComicPanel className="p-6 bg-pop-cyan/10">
          <h2 className="text-xl font-display mb-4">Import from URL</h2>
          <div className="flex gap-2">
            <Input
              value={form.source_url}
              onChange={(e) => setForm(prev => ({ ...prev, source_url: e.target.value }))}
              placeholder="https://example.com/content"
            />
            <PopButton onClick={importFromUrl} disabled={importing}>
              {importing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <LinkIcon className="w-4 h-4 mr-2" />
              )}
              Import
            </PopButton>
          </div>
        </ComicPanel>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Content Details</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="impact">How it affected me</Label>
              <Textarea
                id="impact"
                value={form.impact_statement}
                onChange={(e) => setForm(prev => ({ ...prev, impact_statement: e.target.value }))}
                rows={4}
                placeholder="Describe how this content impacted or inspired you..."
              />
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Image"
              folder="favorites"
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_current"
                checked={form.is_current}
                onChange={(e) => setForm(prev => ({ ...prev, is_current: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_current">Currently enjoying this</Label>
            </div>

            <div>
              <Label htmlFor="discovered_date">When I discovered it</Label>
              <Input
                id="discovered_date"
                type="date"
                value={form.discovered_date}
                onChange={(e) => setForm(prev => ({ ...prev, discovered_date: e.target.value }))}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Creator Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Creator Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="creator_name">Creator Name</Label>
                <Input
                  id="creator_name"
                  value={form.creator_name}
                  onChange={(e) => setForm(prev => ({ ...prev, creator_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="creator_location">Location (continent/country)</Label>
                <Input
                  id="creator_location"
                  value={form.creator_location}
                  onChange={(e) => setForm(prev => ({ ...prev, creator_location: e.target.value }))}
                  placeholder="e.g., Europe, Japan, USA"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="creator_url">Creator URL</Label>
              <Input
                id="creator_url"
                value={form.creator_url}
                onChange={(e) => setForm(prev => ({ ...prev, creator_url: e.target.value }))}
                placeholder="https://creator-website.com"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Tags */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Tags</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-muted border-2 border-foreground font-bold text-sm">
                {tag}
                <button onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Add tag..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
            />
            <button onClick={addTag} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </ComicPanel>

        {/* Save */}
        <div className="flex justify-end">
          <PopButton onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Save"} Favorite
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FavoriteEditor;
