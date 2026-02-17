import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { EnhancedImageManager } from "@/components/admin/EnhancedImageManager";
import { KnowledgeEntryWidget } from "@/components/admin/KnowledgeEntryWidget";
import { ItemAIChatPanel } from "@/components/admin/ItemAIChatPanel";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PROJECT_TYPES, getProjectTypeLabel } from "@/lib/clientProjectTypes";

const ClientProjectEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    client_name: "",
    project_name: "",
    slug: "",
    description: "",
    long_description: "",
    image_url: "",
    screenshots: [] as string[],
    tech_stack: [] as string[],
    features: [] as string[],
    status: "in_progress" as "completed" | "in_progress",
    start_date: "",
    end_date: "",
    testimonial: "",
    testimonial_author: "",
    is_public: true,
    project_type: "web_design",
    type_metadata: {} as Record<string, any>,
  });

  const [newTech, setNewTech] = useState("");
  const [newFeature, setNewFeature] = useState("");

  const { data: project, isLoading } = useQuery({
    queryKey: ["client-project-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("client_projects")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (project) {
      setForm({
        client_name: project.client_name || "",
        project_name: project.project_name || "",
        slug: project.slug || "",
        description: project.description || "",
        long_description: project.long_description || "",
        image_url: project.image_url || "",
        screenshots: project.screenshots || [],
        tech_stack: project.tech_stack || [],
        features: project.features || [],
        status: project.status as "completed" | "in_progress",
        start_date: project.start_date || "",
        end_date: project.end_date || "",
        testimonial: project.testimonial || "",
        testimonial_author: project.testimonial_author || "",
        is_public: project.is_public ?? true,
        project_type: (project as any).project_type || "web_design",
        type_metadata: (project as any).type_metadata || {},
      });
    }
  }, [project]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("client_projects")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("client_projects").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-client-projects"] });
      queryClient.invalidateQueries({ queryKey: ["client-projects"] });
      toast.success(isEditing ? "Project updated" : "Project created");
      navigate("/admin/client-work");
    },
    onError: (error) => {
      toast.error("Failed to save project");
      console.error(error);
    },
  });

  const generateSlug = () => {
    const slug = form.project_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setForm(prev => ({ ...prev, slug }));
  };

  const addTech = () => {
    if (newTech && !form.tech_stack.includes(newTech)) {
      setForm(prev => ({ ...prev, tech_stack: [...prev.tech_stack, newTech] }));
      setNewTech("");
    }
  };

  const addFeature = () => {
    if (newFeature && !form.features.includes(newFeature)) {
      setForm(prev => ({ ...prev, features: [...prev.features, newFeature] }));
      setNewFeature("");
    }
  };

  const updateMeta = (key: string, value: any) => {
    setForm(prev => ({ ...prev, type_metadata: { ...prev.type_metadata, [key]: value } }));
  };

  const meta = form.type_metadata;

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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/client-work")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Client Project" : "New Client Project"}
            </h1>
          </div>
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="client_project"
          onImport={(data) => {
            if (data.project_name) setForm(prev => ({ ...prev, project_name: String(data.project_name) }));
            if (data.client_name) setForm(prev => ({ ...prev, client_name: String(data.client_name) }));
            if (data.description) setForm(prev => ({ ...prev, description: String(data.description) }));
            if (data.long_description) setForm(prev => ({ ...prev, long_description: String(data.long_description) }));
            if (data.tech_stack) setForm(prev => ({ ...prev, tech_stack: Array.isArray(data.tech_stack) ? data.tech_stack : [] }));
            if (data.features) setForm(prev => ({ ...prev, features: Array.isArray(data.features) ? data.features : [] }));
          }}
        />

        {/* Project Type Selector */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Project Type</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {PROJECT_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => setForm(prev => ({ ...prev, project_type: type.value }))}
                className={`p-3 text-center border-2 transition-all text-sm ${
                  form.project_type === type.value
                    ? "border-primary bg-primary/10 font-bold"
                    : "border-foreground hover:bg-muted"
                }`}
              >
                <span className="text-xl block mb-1">{type.icon}</span>
                {type.label}
              </button>
            ))}
          </div>
        </ComicPanel>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Basic Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client_name">Client Name *</Label>
                <Input
                  id="client_name"
                  value={form.client_name}
                  onChange={(e) => setForm(prev => ({ ...prev, client_name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="project_name">Project Name *</Label>
                <Input
                  id="project_name"
                  value={form.project_name}
                  onChange={(e) => setForm(prev => ({ ...prev, project_name: e.target.value }))}
                  onBlur={() => !form.slug && generateSlug()}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="slug">Slug *</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                />
                <button onClick={generateSlug} className="px-3 py-2 bg-muted hover:bg-accent border-2 border-foreground text-sm">
                  Generate
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="long_description">Full Description</Label>
              <Textarea
                id="long_description"
                value={form.long_description}
                onChange={(e) => setForm(prev => ({ ...prev, long_description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as "completed" | "in_progress" }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm(prev => ({ ...prev, start_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm(prev => ({ ...prev, end_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_public"
                checked={form.is_public}
                onChange={(e) => setForm(prev => ({ ...prev, is_public: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_public">Show on public site (uncheck for NDA projects)</Label>
            </div>

            <EnhancedImageManager
              mainImage={form.image_url}
              screenshots={form.screenshots}
              onMainImageChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              onScreenshotsChange={(urls) => setForm(prev => ({ ...prev, screenshots: urls }))}
              folder="client-projects"
            />
          </div>
        </ComicPanel>

        {/* Type-Specific Fields */}
        {form.project_type === "logo_branding" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">🎨 Branding Details</h2>
            <div className="grid gap-4">
              <div>
                <Label>Brand Colors (comma-separated hex codes)</Label>
                <Input
                  value={(meta.brand_colors || []).join(", ")}
                  onChange={e => updateMeta("brand_colors", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="#FF0000, #00FF00, #0000FF"
                />
              </div>
              <div>
                <Label>Font Names (comma-separated)</Label>
                <Input
                  value={(meta.font_names || []).join(", ")}
                  onChange={e => updateMeta("font_names", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="Helvetica, Georgia"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Logo Variations</Label>
                  <Input
                    type="number"
                    value={meta.logo_variations || ""}
                    onChange={e => updateMeta("logo_variations", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Brand Guidelines URL</Label>
                  <Input
                    value={meta.guidelines_url || ""}
                    onChange={e => updateMeta("guidelines_url", e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "copywriting" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">✍️ Copywriting Details</h2>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Content Type</Label>
                  <select
                    value={meta.content_type || ""}
                    onChange={e => updateMeta("content_type", e.target.value)}
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    <option value="">Select...</option>
                    <option value="blog">Blog Posts</option>
                    <option value="web_copy">Web Copy</option>
                    <option value="ad_copy">Ad Copy</option>
                    <option value="email">Email Campaigns</option>
                    <option value="social">Social Media</option>
                    <option value="product">Product Descriptions</option>
                    <option value="script">Scripts</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <Label>Word Count</Label>
                  <Input
                    type="number"
                    value={meta.word_count || ""}
                    onChange={e => updateMeta("word_count", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Tone / Voice</Label>
                  <Input
                    value={meta.tone || ""}
                    onChange={e => updateMeta("tone", e.target.value)}
                    placeholder="Professional, casual, witty..."
                  />
                </div>
              </div>
              <div>
                <Label>Sample Excerpt</Label>
                <Textarea
                  value={meta.sample_excerpt || ""}
                  onChange={e => updateMeta("sample_excerpt", e.target.value)}
                  rows={3}
                  placeholder="A short sample of the copy written..."
                />
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "business_plan" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">📊 Business Plan Details</h2>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Industry</Label>
                  <Input
                    value={meta.industry || ""}
                    onChange={e => updateMeta("industry", e.target.value)}
                    placeholder="Technology, Healthcare..."
                  />
                </div>
                <div>
                  <Label>Deliverable Format</Label>
                  <Input
                    value={meta.format || ""}
                    onChange={e => updateMeta("format", e.target.value)}
                    placeholder="PDF, Presentation, Document..."
                  />
                </div>
              </div>
              <div>
                <Label>Executive Summary</Label>
                <Textarea
                  value={meta.executive_summary || ""}
                  onChange={e => updateMeta("executive_summary", e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Key Sections (comma-separated)</Label>
                <Input
                  value={(meta.sections || []).join(", ")}
                  onChange={e => updateMeta("sections", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="Executive Summary, Market Analysis, Financial Projections..."
                />
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "product_design" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">📐 Product Design Details</h2>
            <div className="grid gap-4">
              <div>
                <Label>Materials (comma-separated)</Label>
                <Input
                  value={(meta.materials || []).join(", ")}
                  onChange={e => updateMeta("materials", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="Wood, Metal, Plastic..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Dimensions</Label>
                  <Input
                    value={meta.dimensions || ""}
                    onChange={e => updateMeta("dimensions", e.target.value)}
                    placeholder="10x20x5 cm"
                  />
                </div>
                <div>
                  <Label>Design Tools (comma-separated)</Label>
                  <Input
                    value={(meta.design_tools || []).join(", ")}
                    onChange={e => updateMeta("design_tools", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                    placeholder="Figma, Blender, AutoCAD..."
                  />
                </div>
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "product_review" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">🔍 Review / Analysis Details</h2>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Reviewed</Label>
                  <Input
                    value={meta.product_reviewed || ""}
                    onChange={e => updateMeta("product_reviewed", e.target.value)}
                  />
                </div>
                <div>
                  <Label>Rating (1-10)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={10}
                    value={meta.rating || ""}
                    onChange={e => updateMeta("rating", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div>
                <Label>Key Findings (comma-separated)</Label>
                <Input
                  value={(meta.key_findings || []).join(", ")}
                  onChange={e => updateMeta("key_findings", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                />
              </div>
              <div>
                <Label>Methodology</Label>
                <Textarea
                  value={meta.methodology || ""}
                  onChange={e => updateMeta("methodology", e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "consulting" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">💡 Consulting Details</h2>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Focus Area</Label>
                  <Input
                    value={meta.focus_area || ""}
                    onChange={e => updateMeta("focus_area", e.target.value)}
                    placeholder="Growth strategy, operations..."
                  />
                </div>
                <div>
                  <Label>Duration</Label>
                  <Input
                    value={meta.duration || ""}
                    onChange={e => updateMeta("duration", e.target.value)}
                    placeholder="3 months, 6 weeks..."
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Recommendations Count</Label>
                  <Input
                    type="number"
                    value={meta.recommendations_count || ""}
                    onChange={e => updateMeta("recommendations_count", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Outcome Metrics</Label>
                  <Input
                    value={meta.outcome_metrics || ""}
                    onChange={e => updateMeta("outcome_metrics", e.target.value)}
                    placeholder="30% revenue increase..."
                  />
                </div>
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "social_media" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">📱 Social Media Details</h2>
            <div className="grid gap-4">
              <div>
                <Label>Platforms (comma-separated)</Label>
                <Input
                  value={(meta.platforms || []).join(", ")}
                  onChange={e => updateMeta("platforms", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="Instagram, TikTok, LinkedIn..."
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Campaign Type</Label>
                  <Input
                    value={meta.campaign_type || ""}
                    onChange={e => updateMeta("campaign_type", e.target.value)}
                    placeholder="Brand awareness, launch..."
                  />
                </div>
                <div>
                  <Label>Reach</Label>
                  <Input
                    value={meta.reach || ""}
                    onChange={e => updateMeta("reach", e.target.value)}
                    placeholder="50K impressions"
                  />
                </div>
                <div>
                  <Label>Engagement</Label>
                  <Input
                    value={meta.engagement || ""}
                    onChange={e => updateMeta("engagement", e.target.value)}
                    placeholder="5% engagement rate"
                  />
                </div>
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "photography_video" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">📷 Photography / Video Details</h2>
            <div className="grid gap-4">
              <div>
                <Label>Equipment (comma-separated)</Label>
                <Input
                  value={(meta.equipment || []).join(", ")}
                  onChange={e => updateMeta("equipment", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
                  placeholder="Canon R5, DJI Mavic..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Deliverables Count</Label>
                  <Input
                    type="number"
                    value={meta.deliverables_count || ""}
                    onChange={e => updateMeta("deliverables_count", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Style / Genre</Label>
                  <Input
                    value={meta.style || ""}
                    onChange={e => updateMeta("style", e.target.value)}
                    placeholder="Documentary, portrait, commercial..."
                  />
                </div>
              </div>
            </div>
          </ComicPanel>
        )}

        {form.project_type === "other" && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">📁 Additional Notes</h2>
            <Textarea
              value={meta.notes || ""}
              onChange={e => updateMeta("notes", e.target.value)}
              rows={4}
              placeholder="Describe the project type and any specific details..."
            />
          </ComicPanel>
        )}

        {/* Tech Stack */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.tech_stack.map((tech) => (
              <span key={tech} className="inline-flex items-center gap-1 px-3 py-1 bg-muted border-2 border-foreground font-bold text-sm">
                {tech}
                <button onClick={() => setForm(prev => ({ ...prev, tech_stack: prev.tech_stack.filter(t => t !== tech) }))}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newTech}
              onChange={(e) => setNewTech(e.target.value)}
              placeholder="Add technology..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTech())}
            />
            <button onClick={addTech} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </ComicPanel>

        {/* Features */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Key Features</h2>
          <div className="space-y-2 mb-4">
            {form.features.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-muted">
                <span className="flex-grow">{feature}</span>
                <button onClick={() => setForm(prev => ({ ...prev, features: prev.features.filter((_, idx) => idx !== i) }))}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              placeholder="Add feature..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addFeature())}
            />
            <button onClick={addFeature} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </ComicPanel>

        {/* Testimonial */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Client Testimonial</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="testimonial">Testimonial</Label>
              <Textarea
                id="testimonial"
                value={form.testimonial}
                onChange={(e) => setForm(prev => ({ ...prev, testimonial: e.target.value }))}
                rows={3}
                placeholder="What did the client say about the project?"
              />
            </div>
            <div>
              <Label htmlFor="testimonial_author">Author</Label>
              <Input
                id="testimonial_author"
                value={form.testimonial_author}
                onChange={(e) => setForm(prev => ({ ...prev, testimonial_author: e.target.value }))}
                placeholder="John Doe, CEO of Company"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Knowledge Base */}
        <KnowledgeEntryWidget entityType="client_project" entityId={isEditing ? id : undefined} />

        {/* AI Chat */}
        <ItemAIChatPanel
          entityType="client_project"
          entityId={isEditing ? id : undefined}
          entityTitle={form.project_name || "New Client Project"}
          context={`Client: ${form.client_name}\nType: ${form.project_type}\nDescription: ${form.description}`}
        />

        {/* Save Button */}
        <div className="flex justify-end">
          <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update Project" : "Create Project"}
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ClientProjectEditor;