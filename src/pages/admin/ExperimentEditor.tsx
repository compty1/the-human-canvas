import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { EnhancedImageManager } from "@/components/admin/EnhancedImageManager";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { ExperimentProductEditor } from "@/components/admin/ExperimentProductEditor";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

const ExperimentEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: "",
    slug: "",
    platform: "",
    description: "",
    long_description: "",
    image_url: "",
    screenshots: [] as string[],
    start_date: "",
    end_date: "",
    status: "active",
    revenue: 0,
    costs: 0,
    profit: 0,
    cost_breakdown: {} as Record<string, number>,
    products_sold: 0,
    total_orders: 0,
    average_rating: null as number | null,
    review_count: 0,
    sample_reviews: [] as string[],
    products_offered: [] as string[],
    skills_demonstrated: [] as string[],
    lessons_learned: [] as string[],
    management_info: "",
    operation_details: "",
    admin_notes: "",
    case_study: "",
  });

  const [newReview, setNewReview] = useState("");
  const [newProduct, setNewProduct] = useState("");
  const [newSkill, setNewSkill] = useState("");
  const [newLesson, setNewLesson] = useState("");

  const { data: experiment, isLoading } = useQuery({
    queryKey: ["experiment-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("experiments")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (experiment) {
      setForm({
        name: experiment.name || "",
        slug: experiment.slug || "",
        platform: experiment.platform || "",
        description: experiment.description || "",
        long_description: experiment.long_description || "",
        image_url: experiment.image_url || "",
        screenshots: experiment.screenshots || [],
        start_date: experiment.start_date || "",
        end_date: experiment.end_date || "",
        status: experiment.status || "active",
        revenue: experiment.revenue || 0,
        costs: experiment.costs || 0,
        profit: experiment.profit || 0,
        cost_breakdown: (experiment.cost_breakdown as Record<string, number>) || {},
        products_sold: experiment.products_sold || 0,
        total_orders: experiment.total_orders || 0,
        average_rating: experiment.average_rating,
        review_count: experiment.review_count || 0,
        sample_reviews: experiment.sample_reviews || [],
        products_offered: experiment.products_offered || [],
        skills_demonstrated: experiment.skills_demonstrated || [],
        lessons_learned: experiment.lessons_learned || [],
        management_info: experiment.management_info || "",
        operation_details: experiment.operation_details || "",
        admin_notes: experiment.admin_notes || "",
        case_study: experiment.case_study || "",
      });
    }
  }, [experiment]);

  // Auto-generate slug
  useEffect(() => {
    if (!isEditing && form.name) {
      const slug = form.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setForm((prev) => ({ ...prev, slug }));
    }
  }, [form.name, isEditing]);

  // Calculate profit
  useEffect(() => {
    const profit = form.revenue - form.costs;
    setForm((prev) => ({ ...prev, profit }));
  }, [form.revenue, form.costs]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        name: form.name,
        slug: form.slug,
        platform: form.platform,
        description: form.description || null,
        long_description: form.long_description || null,
        image_url: form.image_url || null,
        screenshots: form.screenshots,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        status: form.status,
        revenue: form.revenue,
        costs: form.costs,
        profit: form.profit,
        cost_breakdown: form.cost_breakdown,
        products_sold: form.products_sold,
        total_orders: form.total_orders,
        average_rating: form.average_rating,
        review_count: form.review_count,
        sample_reviews: form.sample_reviews,
        products_offered: form.products_offered,
        skills_demonstrated: form.skills_demonstrated,
        lessons_learned: form.lessons_learned,
        management_info: form.management_info || null,
        operation_details: form.operation_details || null,
        admin_notes: form.admin_notes || null,
        case_study: form.case_study || null,
      };

      if (isEditing) {
        const { error } = await supabase.from("experiments").update(data).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("experiments").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiments"] });
      toast.success(isEditing ? "Experiment updated" : "Experiment created");
      navigate("/admin/experiments");
    },
    onError: (error) => {
      toast.error("Failed to save experiment");
      console.error(error);
    },
  });

  const handleBulkImport = (data: Record<string, unknown>) => {
    setForm((prev) => ({
      ...prev,
      name: (data.name as string) || prev.name,
      description: (data.description as string) || prev.description,
      long_description: (data.long_description as string) || prev.long_description,
      platform: (data.platform as string) || prev.platform,
      management_info: (data.management_info as string) || prev.management_info,
      operation_details: (data.operation_details as string) || prev.operation_details,
      skills_demonstrated: (data.skills_demonstrated as string[]) || prev.skills_demonstrated,
      lessons_learned: (data.lessons_learned as string[]) || prev.lessons_learned,
      products_offered: (data.products_offered as string[]) || prev.products_offered,
      sample_reviews: (data.sample_reviews as string[]) || prev.sample_reviews,
      revenue: (data.revenue as number) || prev.revenue,
      costs: (data.costs as number) || prev.costs,
    }));
  };

  const addToArray = (
    field: "sample_reviews" | "products_offered" | "skills_demonstrated" | "lessons_learned",
    value: string,
    setter: (v: string) => void
  ) => {
    if (!value.trim()) return;
    setForm((prev) => ({
      ...prev,
      [field]: [...prev[field], value.trim()],
    }));
    setter("");
  };

  const removeFromArray = (
    field: "sample_reviews" | "products_offered" | "skills_demonstrated" | "lessons_learned",
    index: number
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted w-48" />
          <div className="h-64 bg-muted" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/experiments")} className="p-2 hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-display">
            {isEditing ? "Edit Experiment" : "Add Experiment"}
          </h1>
        </div>

        {/* Bulk Import */}
        <BulkTextImporter contentType="experiment" onImport={handleBulkImport} />

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Basic Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Business name"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="url-slug"
              />
            </div>
            <div>
              <Label htmlFor="platform">Platform *</Label>
              <Input
                id="platform"
                value={form.platform}
                onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value }))}
                placeholder="Etsy, Shopify, Independent..."
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full h-10 px-3 border-2 border-input bg-background"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
                <option value="sold">Sold</option>
              </select>
            </div>
            <div>
              <Label htmlFor="start_date">Start Date (Month)</Label>
              <Input
                id="start_date"
                type="month"
                value={form.start_date ? form.start_date.substring(0, 7) : ""}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value ? `${e.target.value}-01` : "" }))}
              />
            </div>
            <div>
              <Label htmlFor="end_date">End Date (Month)</Label>
              <Input
                id="end_date"
                type="month"
                value={form.end_date ? form.end_date.substring(0, 7) : ""}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value ? `${e.target.value}-01` : "" }))}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label htmlFor="description">Short Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="mt-4">
            <Label htmlFor="long_description">Full Description</Label>
            <Textarea
              id="long_description"
              value={form.long_description}
              onChange={(e) => setForm((prev) => ({ ...prev, long_description: e.target.value }))}
              rows={6}
            />
          </div>
        </ComicPanel>

        {/* Images */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Images</h2>
          <EnhancedImageManager
            mainImage={form.image_url}
            screenshots={form.screenshots}
            onMainImageChange={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
            onScreenshotsChange={(urls) => setForm((prev) => ({ ...prev, screenshots: urls }))}
            folder="experiments"
          />
        </ComicPanel>

        {/* Financials */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Financials</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="revenue">Revenue ($)</Label>
              <Input
                id="revenue"
                type="number"
                value={form.revenue}
                onChange={(e) => setForm((prev) => ({ ...prev, revenue: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="costs">Costs ($)</Label>
              <Input
                id="costs"
                type="number"
                value={form.costs}
                onChange={(e) => setForm((prev) => ({ ...prev, costs: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="profit">Profit ($)</Label>
              <Input
                id="profit"
                type="number"
                value={form.profit}
                disabled
                className="bg-muted"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Metrics */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Metrics</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="products_sold">Products Sold</Label>
              <Input
                id="products_sold"
                type="number"
                value={form.products_sold}
                onChange={(e) => setForm((prev) => ({ ...prev, products_sold: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="total_orders">Total Orders</Label>
              <Input
                id="total_orders"
                type="number"
                value={form.total_orders}
                onChange={(e) => setForm((prev) => ({ ...prev, total_orders: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div>
              <Label htmlFor="average_rating">Avg Rating (1-5)</Label>
              <Input
                id="average_rating"
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={form.average_rating || ""}
                onChange={(e) => setForm((prev) => ({ ...prev, average_rating: parseFloat(e.target.value) || null }))}
              />
            </div>
            <div>
              <Label htmlFor="review_count">Review Count</Label>
              <Input
                id="review_count"
                type="number"
                value={form.review_count}
                onChange={(e) => setForm((prev) => ({ ...prev, review_count: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Sample Reviews */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Sample Reviews</h2>
          <div className="flex gap-2 mb-4">
            <Textarea
              value={newReview}
              onChange={(e) => setNewReview(e.target.value)}
              placeholder="Add a customer review..."
              rows={2}
              className="flex-1"
            />
            <button
              onClick={() => addToArray("sample_reviews", newReview, setNewReview)}
              className="p-2 border-2 border-foreground hover:bg-muted"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {form.sample_reviews.map((review, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-muted">
                <p className="flex-1 italic">"{review}"</p>
                <button onClick={() => removeFromArray("sample_reviews", i)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </ComicPanel>

        {/* Products Offered */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Products Offered</h2>
          <div className="flex gap-2 mb-4">
            <Input
              value={newProduct}
              onChange={(e) => setNewProduct(e.target.value)}
              placeholder="Product name..."
              onKeyDown={(e) => e.key === "Enter" && addToArray("products_offered", newProduct, setNewProduct)}
            />
            <button
              onClick={() => addToArray("products_offered", newProduct, setNewProduct)}
              className="p-2 border-2 border-foreground hover:bg-muted"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.products_offered.map((product, i) => (
              <span key={i} className="px-3 py-1 bg-muted flex items-center gap-2">
                {product}
                <button onClick={() => removeFromArray("products_offered", i)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </ComicPanel>

        {/* Product Catalog - Only show when editing existing experiment */}
        {isEditing && id && (
          <ExperimentProductEditor experimentId={id} />
        )}

        {/* Skills Demonstrated */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Skills Demonstrated</h2>
          <div className="flex gap-2 mb-4">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Skill..."
              onKeyDown={(e) => e.key === "Enter" && addToArray("skills_demonstrated", newSkill, setNewSkill)}
            />
            <button
              onClick={() => addToArray("skills_demonstrated", newSkill, setNewSkill)}
              className="p-2 border-2 border-foreground hover:bg-muted"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills_demonstrated.map((skill, i) => (
              <span key={i} className="px-3 py-1 bg-primary text-primary-foreground flex items-center gap-2">
                {skill}
                <button onClick={() => removeFromArray("skills_demonstrated", i)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </ComicPanel>

        {/* Lessons Learned */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Lessons Learned</h2>
          <div className="flex gap-2 mb-4">
            <Textarea
              value={newLesson}
              onChange={(e) => setNewLesson(e.target.value)}
              placeholder="Key lesson..."
              rows={2}
              className="flex-1"
            />
            <button
              onClick={() => addToArray("lessons_learned", newLesson, setNewLesson)}
              className="p-2 border-2 border-foreground hover:bg-muted"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          <div className="space-y-2">
            {form.lessons_learned.map((lesson, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-pop-yellow/20">
                <span className="font-bold">{i + 1}.</span>
                <p className="flex-1">{lesson}</p>
                <button onClick={() => removeFromArray("lessons_learned", i)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </ComicPanel>

        {/* Operations */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Operations & Management</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="operation_details">Operation Details</Label>
              <Textarea
                id="operation_details"
                value={form.operation_details}
                onChange={(e) => setForm((prev) => ({ ...prev, operation_details: e.target.value }))}
                rows={4}
                placeholder="How the business was run day-to-day..."
              />
            </div>
            <div>
              <Label htmlFor="management_info">Management Info</Label>
              <Textarea
                id="management_info"
                value={form.management_info}
                onChange={(e) => setForm((prev) => ({ ...prev, management_info: e.target.value }))}
                rows={4}
                placeholder="Management approach and responsibilities..."
              />
            </div>
          </div>
        </ComicPanel>

        {/* Case Study */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Case Study</h2>
          <Textarea
            value={form.case_study}
            onChange={(e) => setForm((prev) => ({ ...prev, case_study: e.target.value }))}
            rows={8}
            placeholder="Write a detailed case study about this experiment..."
          />
          <p className="text-xs text-muted-foreground mt-1">
            Include background, challenges, solutions, and outcomes
          </p>
        </ComicPanel>

        {/* Admin Notes */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Admin Notes (Private)</h2>
          <Textarea
            value={form.admin_notes}
            onChange={(e) => setForm((prev) => ({ ...prev, admin_notes: e.target.value }))}
            rows={3}
            placeholder="Internal notes..."
          />
        </ComicPanel>

        {/* Knowledge Base */}
        <KnowledgeEntryWidget
          entityType="experiment"
          entityId={isEditing ? id : undefined}
        />

        {/* Actions */}
        <div className="flex gap-4">
          <PopButton
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !form.name || !form.slug || !form.platform}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Experiment"}
          </PopButton>
          <button
            onClick={() => navigate("/admin/experiments")}
            className="px-4 py-2 border-2 border-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExperimentEditor;
