import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";

const UpdateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);

  // Fetch existing update if editing
  const { data: existingUpdate, isLoading: isLoadingUpdate } = useQuery({
    queryKey: ["update-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Populate form when editing
  useEffect(() => {
    if (existingUpdate) {
      setTitle(existingUpdate.title);
      setSlug(existingUpdate.slug);
      setContent(existingUpdate.content || "");
      setExcerpt(existingUpdate.excerpt || "");
      setTags(existingUpdate.tags?.join(", ") || "");
      setPublished(existingUpdate.published || false);
    }
  }, [existingUpdate]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generatedSlug);
    }
  }, [title, isEditing]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updateData = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        tags: tags ? tags.split(",").map((t) => t.trim()) : null,
        published,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("updates")
          .update(updateData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("updates").insert(updateData);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updates"] });
      toast({
        title: isEditing ? "Update saved" : "Update created",
        description: published
          ? "Your update is now live."
          : "Your update has been saved as a draft.",
      });
      navigate("/admin/updates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const { error } = await supabase.from("updates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["updates"] });
      toast({
        title: "Update deleted",
        description: "The update has been removed.",
      });
      navigate("/admin/updates");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this update?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoadingUpdate) {
    return (
      <AdminLayout>
        <div className="max-w-3xl">
          <div className="h-12 bg-muted animate-pulse mb-4" />
          <div className="h-64 bg-muted animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/updates")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-display">
            {isEditing ? "Edit Update" : "New Update"}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label htmlFor="published" className="font-bold">
              {published ? "Published" : "Draft"}
            </Label>
          </div>
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="update"
          onImport={(data) => {
            if (data.title) setTitle(String(data.title));
            if (data.content) setContent(String(data.content));
            if (data.excerpt) setExcerpt(String(data.excerpt));
            if (data.tags) setTags(Array.isArray(data.tags) ? data.tags.join(", ") : String(data.tags));
          }}
        />

        {/* Form */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Update Details</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Update title..."
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
              />
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="philosophy, art, thoughts"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Content */}
        <ComicPanel className="p-6">
          <Label className="text-lg font-bold mb-2 block">Content</Label>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Start writing your update..."
          />
        </ComicPanel>

        {/* Actions */}
        <div className="flex justify-between items-center">
          {isEditing && (
            <PopButton
              type="button"
              variant="secondary"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </PopButton>
          )}
          <div className="flex gap-4 ml-auto">
            <PopButton
              type="button"
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !title || !slug}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saveMutation.isPending ? "Saving..." : "Save"}
            </PopButton>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default UpdateEditor;
