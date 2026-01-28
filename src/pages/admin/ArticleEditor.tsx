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

type WritingCategory = "philosophy" | "narrative" | "cultural" | "ux_review" | "research";

const categoryOptions: { value: WritingCategory; label: string }[] = [
  { value: "philosophy", label: "Philosophy" },
  { value: "narrative", label: "Narrative" },
  { value: "cultural", label: "Cultural" },
  { value: "ux_review", label: "UX Review" },
  { value: "research", label: "Research" },
];

const ArticleEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [category, setCategory] = useState<WritingCategory>("philosophy");
  const [tags, setTags] = useState("");
  const [readingTime, setReadingTime] = useState("5");
  const [featuredImage, setFeaturedImage] = useState("");
  const [published, setPublished] = useState(false);

  // Fetch existing article if editing
  const { data: existingArticle, isLoading: isLoadingArticle } = useQuery({
    queryKey: ["article-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("articles")
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
    if (existingArticle) {
      setTitle(existingArticle.title);
      setSlug(existingArticle.slug);
      setContent(existingArticle.content || "");
      setExcerpt(existingArticle.excerpt || "");
      setCategory(existingArticle.category as WritingCategory);
      setTags(existingArticle.tags?.join(", ") || "");
      setReadingTime(String(existingArticle.reading_time_minutes || 5));
      setFeaturedImage(existingArticle.featured_image || "");
      setPublished(existingArticle.published || false);
    }
  }, [existingArticle]);

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

    setFeaturedImage(urlData.publicUrl);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const articleData = {
        title,
        slug,
        content,
        excerpt: excerpt || null,
        category,
        tags: tags ? tags.split(",").map((t) => t.trim()) : null,
        reading_time_minutes: parseInt(readingTime) || 5,
        featured_image: featuredImage || null,
        published,
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      toast({
        title: isEditing ? "Article saved" : "Article created",
        description: published
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
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/articles")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-display">
            {isEditing ? "Edit Article" : "New Article"}
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
          contentType="article"
          onImport={(data) => {
            if (data.title) setTitle(String(data.title));
            if (data.content) setContent(String(data.content));
            if (data.excerpt) setExcerpt(String(data.excerpt));
            if (data.category) setCategory(data.category as WritingCategory);
            if (data.tags) setTags(Array.isArray(data.tags) ? data.tags.join(", ") : String(data.tags));
          }}
        />

        {/* Featured Image */}
        <ComicPanel className="p-6">
          <Label className="text-lg font-bold mb-2 block">Featured Image</Label>
          <div className="border-2 border-foreground p-4">
            {featuredImage ? (
              <div className="relative">
                <img
                  src={featuredImage}
                  alt="Featured"
                  className="w-full h-48 object-cover border-2 border-foreground"
                />
                <button
                  type="button"
                  onClick={() => setFeaturedImage("")}
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
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Article title..."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as WritingCategory)}>
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
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="url-friendly-slug"
                />
              </div>
              <div>
                <Label htmlFor="readingTime">Reading Time (minutes)</Label>
                <Input
                  id="readingTime"
                  type="number"
                  min="1"
                  value={readingTime}
                  onChange={(e) => setReadingTime(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="excerpt">Excerpt</Label>
              <Input
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Brief summary for article cards..."
              />
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="philosophy, existentialism, life"
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

export default ArticleEditor;
