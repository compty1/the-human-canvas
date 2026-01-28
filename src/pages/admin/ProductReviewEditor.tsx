import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { RichTextEditor } from "@/components/editor";
import { ImageUploader, MultiImageUploader } from "@/components/admin/ImageUploader";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Save, 
  ArrowLeft, 
  Loader2, 
  Plus, 
  X,
  Star,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

const ProductReviewEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    product_name: "",
    company: "",
    slug: "",
    category: "Consumer Product",
    overall_rating: 5,
    summary: "",
    content: "",
    pain_points: [] as string[],
    strengths: [] as string[],
    technical_issues: [] as string[],
    improvement_suggestions: [] as string[],
    future_recommendations: [] as string[],
    featured_image: "",
    screenshots: [] as string[],
    published: false,
    admin_notes: "",
  });

  const [newPainPoint, setNewPainPoint] = useState("");
  const [newStrength, setNewStrength] = useState("");
  const [newTechnicalIssue, setNewTechnicalIssue] = useState("");
  const [newImprovement, setNewImprovement] = useState("");
  const [newFutureRec, setNewFutureRec] = useState("");
  const [saving, setSaving] = useState(false);
  const [analyzeUrl, setAnalyzeUrl] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // Fetch existing review if editing
  const { data: review, isLoading } = useQuery({
    queryKey: ["product-review", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (review) {
      setFormData({
        product_name: review.product_name || "",
        company: review.company || "",
        slug: review.slug || "",
        category: review.category || "Consumer Product",
        overall_rating: review.overall_rating || 5,
        summary: review.summary || "",
        content: review.content || "",
        pain_points: review.pain_points || [],
        strengths: review.strengths || [],
        technical_issues: review.technical_issues || [],
        improvement_suggestions: review.improvement_suggestions || [],
        future_recommendations: review.future_recommendations || [],
        featured_image: review.featured_image || "",
        screenshots: review.screenshots || [],
        published: review.published || false,
        admin_notes: review.admin_notes || "",
      });
    }
  }, [review]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const slug = formData.slug || formData.product_name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      
      const payload = {
        ...formData,
        slug,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("product_reviews")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("product_reviews")
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews"] });
      toast.success(isEditing ? "Review updated!" : "Review created!");
      navigate("/admin/product-reviews");
    },
    onError: (error) => {
      toast.error("Failed to save review");
      console.error(error);
    },
  });

  const handleSave = async () => {
    if (!formData.product_name || !formData.company) {
      toast.error("Product name and company are required");
      return;
    }
    setSaving(true);
    await saveMutation.mutateAsync();
    setSaving(false);
  };

  const addToList = (
    list: string[],
    setList: (items: string[]) => void,
    newItem: string,
    setNewItem: (val: string) => void
  ) => {
    if (newItem.trim()) {
      setList([...list, newItem.trim()]);
      setNewItem("");
    }
  };

  const removeFromList = (
    list: string[],
    setList: (items: string[]) => void,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const categories = [
    "Medical Device",
    "Consumer Product",
    "Software",
    "Mobile App",
    "Web Service",
    "Hardware",
    "IoT Device",
  ];

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/product-reviews")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-grow">
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Product Review" : "New Product Review"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="published">Published</Label>
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData({ ...formData, published: checked })}
            />
          </div>
          <PopButton onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </PopButton>
        </div>

        {/* Bulk Text Import */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Bulk Text Import</h2>
          <BulkTextImporter
            contentType="product_review"
            onImport={(data) => {
              setFormData(prev => ({
                ...prev,
                product_name: (data.product_name as string) || prev.product_name,
                company: (data.company as string) || prev.company,
                summary: (data.summary as string) || prev.summary,
                content: (data.content as string) || prev.content,
                strengths: (data.strengths as string[]) || prev.strengths,
                pain_points: (data.pain_points as string[]) || prev.pain_points,
                improvement_suggestions: (data.improvement_suggestions as string[]) || prev.improvement_suggestions,
              }));
            }}
          />
        </ComicPanel>

        {/* AI Auto-Analyze */}
        <ComicPanel className="p-6 bg-pop-cyan/10">
          <h2 className="text-xl font-display mb-4">AI Auto-Analyze Product</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Enter a product URL to automatically generate a UX review using AI analysis
          </p>
          <div className="flex gap-4">
            <Input
              value={analyzeUrl}
              onChange={(e) => setAnalyzeUrl(e.target.value)}
              placeholder="https://product-website.com"
              className="flex-grow"
            />
            <PopButton 
              onClick={async () => {
                if (!analyzeUrl) {
                  toast.error("Please enter a URL");
                  return;
                }
                setAnalyzing(true);
                try {
                  const { data, error } = await supabase.functions.invoke("analyze-product", {
                    body: { url: analyzeUrl },
                  });
                  if (error) throw error;
                  if (data) {
                    setFormData(prev => ({
                      ...prev,
                      product_name: data.product_name || prev.product_name,
                      company: data.company || prev.company,
                      category: data.category || prev.category,
                      overall_rating: data.overall_rating || prev.overall_rating,
                      summary: data.summary || prev.summary,
                      pain_points: data.pain_points || prev.pain_points,
                      strengths: data.strengths || prev.strengths,
                      technical_issues: data.technical_issues || prev.technical_issues,
                      improvement_suggestions: data.improvement_suggestions || prev.improvement_suggestions,
                      future_recommendations: data.future_recommendations || prev.future_recommendations,
                    }));
                    toast.success("Product analyzed! Review generated.");
                  }
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to analyze product");
                } finally {
                  setAnalyzing(false);
                }
              }}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Auto-Analyze
            </PopButton>
          </div>
        </ComicPanel>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Product Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product_name">Product Name *</Label>
              <Input
                id="product_name"
                value={formData.product_name}
                onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                placeholder="e.g., Dexcom G7"
              />
            </div>
            <div>
              <Label htmlFor="company">Company *</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g., Dexcom"
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border-2 border-foreground bg-background"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated-from-name"
              />
            </div>

            {/* Featured Image */}
            <ImageUploader
              value={formData.featured_image}
              onChange={(url) => setFormData({ ...formData, featured_image: url })}
              label="Featured Image"
              folder="product-reviews"
            />

            {/* Screenshots */}
            <MultiImageUploader
              value={formData.screenshots}
              onChange={(urls) => setFormData({ ...formData, screenshots: urls })}
              label="Screenshots"
              folder="product-reviews/screenshots"
              maxImages={10}
            />
          </div>
        </ComicPanel>

        {/* Rating */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4 flex items-center gap-2">
            <Star className="w-5 h-5" /> Overall Rating
          </h2>
          <div className="flex items-center gap-4">
            <Slider
              value={[formData.overall_rating]}
              onValueChange={([value]) => setFormData({ ...formData, overall_rating: value })}
              min={1}
              max={10}
              step={1}
              className="flex-grow"
            />
            <span className="text-3xl font-display w-16 text-center">{formData.overall_rating}/10</span>
          </div>
        </ComicPanel>

        {/* Summary */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Executive Summary</h2>
          <Textarea
            value={formData.summary}
            onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
            placeholder="Brief overview of the product and review findings..."
            rows={4}
          />
        </ComicPanel>

        {/* Strengths */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4 text-green-600">Strengths</h2>
          <div className="space-y-2 mb-4">
            {formData.strengths.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded">
                <span className="flex-grow">{item}</span>
                <button onClick={() => removeFromList(formData.strengths, (items) => setFormData({ ...formData, strengths: items }), i)}>
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
              placeholder="Add a strength..."
              onKeyDown={(e) => e.key === "Enter" && addToList(formData.strengths, (items) => setFormData({ ...formData, strengths: items }), newStrength, setNewStrength)}
            />
            <PopButton onClick={() => addToList(formData.strengths, (items) => setFormData({ ...formData, strengths: items }), newStrength, setNewStrength)}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>

        {/* Pain Points */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4 text-orange-600">Pain Points & Frustrations</h2>
          <div className="space-y-2 mb-4">
            {formData.pain_points.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded">
                <span className="flex-grow">{item}</span>
                <button onClick={() => removeFromList(formData.pain_points, (items) => setFormData({ ...formData, pain_points: items }), i)}>
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newPainPoint}
              onChange={(e) => setNewPainPoint(e.target.value)}
              placeholder="Add a pain point..."
              onKeyDown={(e) => e.key === "Enter" && addToList(formData.pain_points, (items) => setFormData({ ...formData, pain_points: items }), newPainPoint, setNewPainPoint)}
            />
            <PopButton onClick={() => addToList(formData.pain_points, (items) => setFormData({ ...formData, pain_points: items }), newPainPoint, setNewPainPoint)}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>

        {/* Technical Issues */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4 text-red-600">Technical Issues</h2>
          <div className="space-y-2 mb-4">
            {formData.technical_issues.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                <span className="flex-grow">{item}</span>
                <button onClick={() => removeFromList(formData.technical_issues, (items) => setFormData({ ...formData, technical_issues: items }), i)}>
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTechnicalIssue}
              onChange={(e) => setNewTechnicalIssue(e.target.value)}
              placeholder="Add a technical issue..."
              onKeyDown={(e) => e.key === "Enter" && addToList(formData.technical_issues, (items) => setFormData({ ...formData, technical_issues: items }), newTechnicalIssue, setNewTechnicalIssue)}
            />
            <PopButton onClick={() => addToList(formData.technical_issues, (items) => setFormData({ ...formData, technical_issues: items }), newTechnicalIssue, setNewTechnicalIssue)}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>

        {/* Improvement Suggestions */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4 text-blue-600">Improvement Suggestions</h2>
          <div className="space-y-2 mb-4">
            {formData.improvement_suggestions.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                <span className="flex-grow">{item}</span>
                <button onClick={() => removeFromList(formData.improvement_suggestions, (items) => setFormData({ ...formData, improvement_suggestions: items }), i)}>
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newImprovement}
              onChange={(e) => setNewImprovement(e.target.value)}
              placeholder="Add an improvement suggestion..."
              onKeyDown={(e) => e.key === "Enter" && addToList(formData.improvement_suggestions, (items) => setFormData({ ...formData, improvement_suggestions: items }), newImprovement, setNewImprovement)}
            />
            <PopButton onClick={() => addToList(formData.improvement_suggestions, (items) => setFormData({ ...formData, improvement_suggestions: items }), newImprovement, setNewImprovement)}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>

        {/* Future Recommendations */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4 text-purple-600">Future Recommendations</h2>
          <div className="space-y-2 mb-4">
            {formData.future_recommendations.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded">
                <span className="flex-grow">{item}</span>
                <button onClick={() => removeFromList(formData.future_recommendations, (items) => setFormData({ ...formData, future_recommendations: items }), i)}>
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newFutureRec}
              onChange={(e) => setNewFutureRec(e.target.value)}
              placeholder="Add a future recommendation..."
              onKeyDown={(e) => e.key === "Enter" && addToList(formData.future_recommendations, (items) => setFormData({ ...formData, future_recommendations: items }), newFutureRec, setNewFutureRec)}
            />
            <PopButton onClick={() => addToList(formData.future_recommendations, (items) => setFormData({ ...formData, future_recommendations: items }), newFutureRec, setNewFutureRec)}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>

        {/* Full Content */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Full Review Content</h2>
          <RichTextEditor
            content={formData.content}
            onChange={(content) => setFormData({ ...formData, content })}
            placeholder="Write your detailed product review here..."
          />
        </ComicPanel>

        {/* Admin Notes */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Admin Notes</h2>
          <Textarea
            value={formData.admin_notes}
            onChange={(e) => setFormData({ ...formData, admin_notes: e.target.value })}
            placeholder="Internal notes (not shown publicly)..."
            rows={3}
          />
        </ComicPanel>

        {/* Save Button */}
        <div className="flex justify-end">
          <PopButton onClick={handleSave} disabled={saving} size="lg">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isEditing ? "Update Review" : "Create Review"}
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProductReviewEditor;
