import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

const UpdateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(false);

  // Check admin access
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

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
      navigate("/updates");
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
      navigate("/updates");
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

  if (isCheckingAdmin || isLoadingUpdate) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="h-12 bg-muted animate-pulse mb-4" />
            <div className="h-64 bg-muted animate-pulse" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-8">
            You don't have permission to access this page.
          </p>
          <Link to="/">
            <PopButton>Go Home</PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          {/* Back Link */}
          <Link
            to="/updates"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Updates
          </Link>

          {/* Header */}
          <ComicPanel className="p-6 mb-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-display">
                {isEditing ? "Edit Update" : "New Update"}
              </h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
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
            </div>
          </ComicPanel>

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
          <div className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-lg font-bold mb-2 block">
                Title
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Update title..."
                className="border-2 border-foreground text-lg"
              />
            </div>

            <div>
              <Label htmlFor="slug" className="text-lg font-bold mb-2 block">
                Slug
              </Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="url-friendly-slug"
                className="border-2 border-foreground"
              />
            </div>

            <div>
              <Label htmlFor="excerpt" className="text-lg font-bold mb-2 block">
                Excerpt
              </Label>
              <Input
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary..."
                className="border-2 border-foreground"
              />
            </div>

            <div>
              <Label htmlFor="tags" className="text-lg font-bold mb-2 block">
                Tags (comma-separated)
              </Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="philosophy, art, thoughts"
                className="border-2 border-foreground"
              />
            </div>

            <div>
              <Label className="text-lg font-bold mb-2 block">Content</Label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your update..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center pt-6 border-t-2 border-foreground">
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
                <Link to="/updates">
                  <PopButton type="button" variant="secondary">
                    Cancel
                  </PopButton>
                </Link>
                <PopButton
                  type="button"
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending || !title || !slug}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveMutation.isPending ? "Saving..." : "Save"}
                </PopButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default UpdateEditor;
