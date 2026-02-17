import { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { DraftRecoveryBanner } from "@/components/admin/DraftRecoveryBanner";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { TemplateSelector, SaveAsTemplateButton } from "@/components/admin/TemplateSelector";
import { VersionHistory, saveContentVersion } from "@/components/admin/VersionHistory";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Trash2, Image as ImageIcon, Loader2 } from "lucide-react";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";

type WritingCategory = "philosophy" | "narrative" | "cultural" | "ux_review" | "research" | "metaphysics";

interface FormState {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: WritingCategory;
  tags: string;
  readingTime: string;
  featuredImage: string;
  published: boolean;
}

const categoryOptions: { value: WritingCategory; label: string }[] = [
  { value: "philosophy", label: "Philosophy" },
  { value: "narrative", label: "Narrative" },
  { value: "cultural", label: "Cultural" },
  { value: "ux_review", label: "UX Review" },
  { value: "research", label: "Research" },
  { value: "metaphysics", label: "Metaphysics" },
];

const ArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const cloneId = searchParams.get("clone");

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category: "philosophy",
    tags: "",
    readingTime: "5",
    featuredImage: "",
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

  // Autosave hook
  const autosaveKey = `article_${id || "new"}`;
  const {
    hasDraft,
    draftData,
    draftTimestamp,
    restoreDraft,
    discardDraft,
    clearDraft,
  } = useAutosave({
    key: autosaveKey,
    data: form,
    enabled: true,
  });

  // Keyboard shortcuts
  useEditorShortcuts({
    onSave: () => {
      saveMutation.mutate();
      clearDraft();
    },
    onSaveAndExit: () => {
      saveMutation.mutate();
      clearDraft();
    },
    onExit: () => navigate("/admin/articles"),
    isDirty: historyIndex > 0,
    enabled: true,
  });

  // Handle draft restoration
  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      setForm(restoredData);
      setHistory([restoredData]);
      setHistoryIndex(0);
      toast({ title: "Draft restored" });
    }
  };

  // Handle template selection
  const handleTemplateSelect = (templateData: Record<string, unknown>) => {
    const updates: Partial<FormState> = {};
    if (templateData.title) updates.title = String(templateData.title);
    if (templateData.content) updates.content = String(templateData.content);
    if (templateData.excerpt) updates.excerpt = String(templateData.excerpt);
    if (templateData.category) updates.category = templateData.category as WritingCategory;
    if (templateData.tags) updates.tags = Array.isArray(templateData.tags) ? templateData.tags.join(", ") : String(templateData.tags);
    updateForm(updates);
  };

  // Handle version restore
  const handleVersionRestore = (versionData: Record<string, unknown>) => {
    const restoredForm: FormState = {
      title: String(versionData.title || ""),
      slug: String(versionData.slug || ""),
      content: String(versionData.content || ""),
      excerpt: String(versionData.excerpt || ""),
      category: (versionData.category as WritingCategory) || "philosophy",
      tags: Array.isArray(versionData.tags) ? versionData.tags.join(", ") : String(versionData.tags || ""),
      readingTime: String(versionData.readingTime || 5),
      featuredImage: String(versionData.featuredImage || ""),
      published: Boolean(versionData.published),
    };
    setForm(restoredForm);
    pushHistory(restoredForm);
  };

  // Fetch existing article if editing or cloning
  const { data: existingArticle, isLoading: isLoadingArticle } = useQuery({
    queryKey: ["article-edit", id || cloneId],
    queryFn: async () => {
      const targetId = id || cloneId;
      if (!targetId) return null;
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!(id || cloneId),
  });

  // Populate form when editing
  useEffect(() => {
    if (existingArticle) {
      const initialForm: FormState = {
        title: existingArticle.title,
        slug: existingArticle.slug,
        content: existingArticle.content || "",
        excerpt: existingArticle.excerpt || "",
        category: existingArticle.category as WritingCategory,
        tags: existingArticle.tags?.join(", ") || "",
        readingTime: String(existingArticle.reading_time_minutes || 5),
        featuredImage: existingArticle.featured_image || "",
        published: existingArticle.published || false,
      };
      setForm(initialForm);
      setHistory([initialForm]);
      setHistoryIndex(0);
    } else if (!isEditing) {
      setHistory([form]);
      setHistoryIndex(0);
    }
  }, [existingArticle, isEditing]);

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

  // Featured image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("content-images")
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    const { data: urlData } = supabase.storage
      .from("content-images")
      .getPublicUrl(data.path);

    updateForm({ featuredImage: urlData.publicUrl });
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const articleData = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        excerpt: form.excerpt || null,
        category: form.category,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : null,
        reading_time_minutes: parseInt(form.readingTime) || 5,
        featured_image: form.featuredImage || null,
        published: form.published,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("articles")
          .update(articleData)
          .eq("id", id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("articles").insert(articleData);

        if (error) throw error;
      }
    },
    onSuccess: async () => {
      // Save version for history
      if (isEditing && id) {
        await saveContentVersion("article", id, form as unknown as Record<string, unknown>);
      }
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: isEditing ? "Article saved" : "Article created",
        description: form.published
          ? "Your article is now live."
          : "Your article has been saved as a draft.",
      });
      navigate("/admin/articles");
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
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: "Article deleted",
        description: "The article has been removed.",
      });
      navigate("/admin/articles");
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
    if (window.confirm("Are you sure you want to delete this article?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoadingArticle) {
    return (
      <AdminLayout>
        <div className="max-w-4xl">
          <div className="h-12 bg-muted animate-pulse mb-4" />
          <div className="h-64 bg-muted animate-pulse" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl space-y-6">
        {/* Draft Recovery Banner */}
        {hasDraft && draftTimestamp && (
          <DraftRecoveryBanner
            timestamp={draftTimestamp}
            onRestore={handleRestoreDraft}
            onDiscard={discardDraft}
          />
        )}

        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <button onClick={() => navigate("/admin/articles")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-display flex-grow">
            {isEditing ? "Edit Article" : "New Article"}
          </h1>
          
          {/* Tools */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isEditing && (
              <TemplateSelector
                contentType="article"
                onSelect={handleTemplateSelect}
              />
            )}
            {isEditing && id && (
              <VersionHistory
                contentType="article"
                contentId={id}
                onRestore={handleVersionRestore}
              />
            )}
            <SaveAsTemplateButton
              contentType="article"
              formData={form as unknown as Record<string, unknown>}
              onSaved={() => toast({ title: "Template saved" })}
            />
            <KeyboardShortcutsHelp />
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
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="article"
          onImport={(data) => {
            const updates: Partial<FormState> = {};
            if (data.title) updates.title = String(data.title);
            if (data.content) updates.content = String(data.content);
            if (data.excerpt) updates.excerpt = String(data.excerpt);
            if (data.category) updates.category = data.category as WritingCategory;
            if (data.tags) updates.tags = Array.isArray(data.tags) ? data.tags.join(", ") : String(data.tags);
            updateForm(updates);
          }}
        />

        {/* Featured Image */}
        <ComicPanel className="p-6">
          <Label className="text-lg font-bold mb-2 block">Featured Image</Label>
          <div className="border-2 border-foreground p-4">
            {form.featuredImage ? (
              <div className="relative">
                <img
                  src={form.featuredImage}
                  alt="Featured"
                  className="w-full h-48 object-cover border-2 border-foreground"
                />
                <button
                  type="button"
                  onClick={() => updateForm({ featuredImage: "" })}
                  className="absolute top-2 right-2 p-2 bg-background border-2 border-foreground hover:bg-muted"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center h-32 cursor-pointer hover:bg-muted transition-colors">
                <ImageIcon className="w-8 h-8 mb-2 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Click to upload featured image
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </ComicPanel>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Article Details</h2>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => updateForm({ title: e.target.value })}
                  placeholder="Article title..."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={form.category} onValueChange={(v) => updateForm({ category: v as WritingCategory })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
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
                <Label htmlFor="readingTime">Reading Time (minutes)</Label>
                <Input
                  id="readingTime"
                  type="number"
                  min="1"
                  value={form.readingTime}
                  onChange={(e) => updateForm({ readingTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="excerpt">Excerpt</Label>
                <AIGenerateButton
                  fieldName="excerpt"
                  fieldLabel="Excerpt"
                  contentType="article"
                  context={{ title: form.title, category: form.category }}
                  currentValue={form.excerpt}
                  onGenerated={(value) => updateForm({ excerpt: value })}
                  variant="small"
                />
              </div>
              <Input
                id="excerpt"
                value={form.excerpt}
                onChange={(e) => updateForm({ excerpt: e.target.value })}
                placeholder="Brief summary for article cards..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={form.tags}
                onChange={(e) => updateForm({ tags: e.target.value })}
                placeholder="philosophy, existentialism, life"
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
              contentType="article"
              context={{ title: form.title, category: form.category, excerpt: form.excerpt }}
              currentValue={form.content}
              onGenerated={(value) => updateForm({ content: value })}
              variant="small"
            />
          </div>
          <RichTextEditor
            content={form.content}
            onChange={(content) => updateForm({ content })}
            placeholder="Start writing your article..."
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

        {/* Knowledge Base */}
        <KnowledgeEntryWidget
          entityType="article"
          entityId={isEditing ? id : undefined}
        />

        {/* AI Chat */}
        <ItemAIChatPanel
          entityType="article"
          entityId={isEditing ? id : undefined}
          entityTitle={form.title || "New Article"}
          context={`Category: ${form.category}\nExcerpt: ${form.excerpt}`}
        />
      </div>
    </AdminLayout>
  );
};

export default ArticleEditor;
