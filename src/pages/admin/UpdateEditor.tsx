import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Loader2 } from "lucide-react";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";

interface FormState {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  tags: string;
  published: boolean;
}

const UpdateEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: "",
    published: false,
  });

  // Undo/Redo history
  const [history, setHistory] = useState<FormState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = (newForm: FormState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newForm);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      setForm(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      setForm(history[historyIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey && canRedo) redo();
        else if (!e.shiftKey && canUndo) undo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, historyIndex, history]);

  const updateForm = (updates: Partial<FormState>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    pushHistory(newForm);
  };

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
      const initialForm: FormState = {
        title: existingUpdate.title,
        slug: existingUpdate.slug,
        content: existingUpdate.content || "",
        excerpt: existingUpdate.excerpt || "",
        tags: existingUpdate.tags?.join(", ") || "",
        published: existingUpdate.published || false,
      };
      setForm(initialForm);
      setHistory([initialForm]);
      setHistoryIndex(0);
    } else if (!isEditing) {
      setHistory([form]);
      setHistoryIndex(0);
    }
  }, [existingUpdate, isEditing]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!isEditing && form.title && historyIndex <= 0) {
      const generatedSlug = form.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setForm(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [form.title, isEditing, historyIndex]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updateData = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        excerpt: form.excerpt || null,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : null,
        published: form.published,
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
        description: form.published
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
          <h1 className="text-3xl font-display flex-grow">
            {isEditing ? "Edit Update" : "New Update"}
          </h1>
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
          <div className="flex items-center gap-2">
            <Switch
              id="published"
              checked={form.published}
              onCheckedChange={(checked) => updateForm({ published: checked })}
            />
            <Label htmlFor="published" className="font-bold">
              {form.published ? "Published" : "Draft"}
            </Label>
          </div>
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="update"
          onImport={(data) => {
            const updates: Partial<FormState> = {};
            if (data.title) updates.title = String(data.title);
            if (data.content) updates.content = String(data.content);
            if (data.excerpt) updates.excerpt = String(data.excerpt);
            if (data.tags) updates.tags = Array.isArray(data.tags) ? data.tags.join(", ") : String(data.tags);
            updateForm(updates);
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
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
                placeholder="Update title..."
              />
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => updateForm({ slug: e.target.value })}
                placeholder="url-friendly-slug"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="excerpt">Excerpt</Label>
                <AIGenerateButton
                  fieldName="excerpt"
                  fieldLabel="Excerpt"
                  contentType="update"
                  context={{ title: form.title }}
                  currentValue={form.excerpt}
                  onGenerated={(value) => updateForm({ excerpt: value })}
                  variant="small"
                />
              </div>
              <Input
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => updateForm({ excerpt: e.target.value })}
                placeholder="Brief summary..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => updateForm({ tags: e.target.value })}
                placeholder="philosophy, art, thoughts"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Content */}
        <ComicPanel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-lg font-bold">Content</Label>
            <AIGenerateButton
              fieldName="content"
              fieldLabel="Content"
              contentType="update"
              context={{ title: form.title, excerpt: form.excerpt }}
              currentValue={form.content}
              onGenerated={(value) => updateForm({ content: value })}
              variant="small"
            />
          </div>
          <RichTextEditor
            content={form.content}
            onChange={(content) => updateForm({ content })}
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
              disabled={saveMutation.isPending || !form.title || !form.slug}
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

        {/* AI Chat */}
        <ItemAIChatPanel
          entityType="update"
          entityId={isEditing ? id : undefined}
          entityTitle={form.title || "New Update"}
          context={`Excerpt: ${form.excerpt}\nTags: ${form.tags}`}
        />
      </div>
    </AdminLayout>
  );
};

export default UpdateEditor;
