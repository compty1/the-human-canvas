import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader, MultiImageUploader } from "@/components/admin/ImageUploader";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "creative", label: "Creative" },
  { value: "business", label: "Business" },
  { value: "technical", label: "Technical" },
  { value: "service", label: "Service" },
  { value: "other", label: "Other" },
];

const subcategories: Record<string, string[]> = {
  creative: ["Visual Art", "Design", "Writing", "Music", "Photography", "Crafts"],
  business: ["E-commerce", "Operations", "Marketing", "Sales", "Finance", "Strategy"],
  technical: ["Web Dev", "Analysis", "Data", "Systems", "Automation"],
  service: ["Tutoring", "Consulting", "Support", "Healthcare", "Notary"],
  other: ["Horticulture", "Restoration", "Research", "Advocacy"],
};

const ExperienceEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    category: "creative",
    subcategory: "",
    description: "",
    long_description: "",
    image_url: "",
    screenshots: [] as string[],
    start_date: "",
    end_date: "",
    is_ongoing: false,
    skills_used: [] as string[],
    tools_used: [] as string[],
    key_achievements: [] as string[],
    lessons_learned: [] as string[],
    challenges_overcome: [] as string[],
    clients_served: "",
    revenue_generated: "",
    projects_completed: "",
    admin_notes: "",
    order_index: 0,
    published: true,
  });

  const [newItem, setNewItem] = useState<Record<string, string>>({
    skills_used: "",
    tools_used: "",
    key_achievements: "",
    lessons_learned: "",
    challenges_overcome: "",
  });

  // Undo/Redo - simple implementation
  const [historyStack, setHistoryStack] = useState<typeof form[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < historyStack.length - 1;

  const pushToHistory = (newForm: typeof form) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newForm);
    if (newStack.length > 50) newStack.shift();
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
  };

  const undo = () => {
    if (canUndo) {
      setHistoryIndex(prev => prev - 1);
      setForm(historyStack[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (canRedo) {
      setHistoryIndex(prev => prev + 1);
      setForm(historyStack[historyIndex + 1]);
    }
  };

  const updateForm = (updates: Partial<typeof form>) => {
    const newForm = { ...form, ...updates };
    setForm(newForm);
    pushToHistory(newForm);
  };

  const { data: experience, isLoading } = useQuery({
    queryKey: ["experience-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (experience) {
      setForm({
        title: experience.title || "",
        slug: experience.slug || "",
        category: experience.category || "creative",
        subcategory: experience.subcategory || "",
        description: experience.description || "",
        long_description: experience.long_description || "",
        image_url: experience.image_url || "",
        screenshots: experience.screenshots || [],
        start_date: experience.start_date || "",
        end_date: experience.end_date || "",
        is_ongoing: experience.is_ongoing || false,
        skills_used: experience.skills_used || [],
        tools_used: experience.tools_used || [],
        key_achievements: experience.key_achievements || [],
        lessons_learned: experience.lessons_learned || [],
        challenges_overcome: experience.challenges_overcome || [],
        clients_served: experience.clients_served?.toString() || "",
        revenue_generated: experience.revenue_generated?.toString() || "",
        projects_completed: experience.projects_completed?.toString() || "",
        admin_notes: experience.admin_notes || "",
        order_index: experience.order_index || 0,
        published: experience.published ?? true,
      });
    }
  }, [experience]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        clients_served: form.clients_served ? parseInt(form.clients_served) : null,
        revenue_generated: form.revenue_generated ? parseFloat(form.revenue_generated) : null,
        projects_completed: form.projects_completed ? parseInt(form.projects_completed) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        image_url: form.image_url || null,
        subcategory: form.subcategory || null,
        description: form.description || null,
        long_description: form.long_description || null,
        admin_notes: form.admin_notes || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("experiences")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("experiences").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success(isEditing ? "Experience updated" : "Experience created");
      navigate("/admin/experiences");
    },
    onError: (error) => {
      toast.error("Failed to save");
      console.error(error);
    },
  });

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setForm(prev => ({ ...prev, slug }));
  };

  const addItem = (field: keyof typeof newItem) => {
    const value = newItem[field];
    const currentArray = form[field as keyof typeof form] as string[];
    if (value && Array.isArray(currentArray) && !currentArray.includes(value)) {
      setForm(prev => ({
        ...prev,
        [field]: [...currentArray, value],
      }));
      setNewItem(prev => ({ ...prev, [field]: "" }));
    }
  };

  const removeItem = (field: keyof typeof form, value: string) => {
    setForm(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(v => v !== value),
    }));
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
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/experiences")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-grow">
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Experience" : "Add Experience"}
            </h1>
          </div>
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        </div>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Basic Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  onBlur={() => !form.slug && generateSlug()}
                  placeholder="e.g., E-commerce on Etsy"
                />
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
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    subcategory: "" 
                  }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <select
                  id="subcategory"
                  value={form.subcategory}
                  onChange={(e) => setForm(prev => ({ ...prev, subcategory: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  <option value="">Select...</option>
                  {(subcategories[form.category] || []).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description">Short Description</Label>
                <AIGenerateButton
                  fieldName="description"
                  fieldLabel="Description"
                  contentType="experience"
                  context={{ title: form.title, category: form.category }}
                  currentValue={form.description}
                  onGenerated={(value) => updateForm({ description: value })}
                  variant="small"
                />
              </div>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => updateForm({ description: e.target.value })}
                rows={2}
                placeholder="Brief overview of this experience"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="long_description">Full Description</Label>
                <AIGenerateButton
                  fieldName="long_description"
                  fieldLabel="Full Description"
                  contentType="experience"
                  context={{ title: form.title, category: form.category, description: form.description }}
                  currentValue={form.long_description}
                  onGenerated={(value) => updateForm({ long_description: value })}
                  variant="small"
                />
              </div>
              <Textarea
                id="long_description"
                value={form.long_description}
                onChange={(e) => updateForm({ long_description: e.target.value })}
                rows={5}
                placeholder="Detailed description of your experience, what you learned, and accomplishments"
              />
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Featured Image"
              folder="experiences"
            />

            <MultiImageUploader
              value={form.screenshots}
              onChange={(urls) => setForm(prev => ({ ...prev, screenshots: urls }))}
              label="Additional Images"
              folder="experiences/gallery"
              maxImages={6}
            />
          </div>
        </ComicPanel>

        {/* Time Period */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Time Period</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
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
                  disabled={form.is_ongoing}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_ongoing"
                checked={form.is_ongoing}
                onChange={(e) => setForm(prev => ({ 
                  ...prev, 
                  is_ongoing: e.target.checked,
                  end_date: e.target.checked ? "" : prev.end_date
                }))}
                className="w-4 h-4"
              />
              <Label htmlFor="is_ongoing">This is an ongoing experience</Label>
            </div>
          </div>
        </ComicPanel>

        {/* Skills & Tools */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Skills & Tools</h2>
          <div className="grid gap-6">
            {/* Skills Used */}
            <div>
              <Label>Skills Used</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem.skills_used}
                  onChange={(e) => setNewItem(prev => ({ ...prev, skills_used: e.target.value }))}
                  placeholder="Add a skill"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("skills_used"))}
                />
                <PopButton size="sm" onClick={() => addItem("skills_used")}>
                  <Plus className="w-4 h-4" />
                </PopButton>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.skills_used.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-muted border-2 border-foreground flex items-center gap-2">
                    {skill}
                    <button onClick={() => removeItem("skills_used", skill)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Tools Used */}
            <div>
              <Label>Tools Used</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem.tools_used}
                  onChange={(e) => setNewItem(prev => ({ ...prev, tools_used: e.target.value }))}
                  placeholder="Add a tool"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("tools_used"))}
                />
                <PopButton size="sm" onClick={() => addItem("tools_used")}>
                  <Plus className="w-4 h-4" />
                </PopButton>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.tools_used.map((tool) => (
                  <span key={tool} className="px-3 py-1 bg-muted border-2 border-foreground flex items-center gap-2">
                    {tool}
                    <button onClick={() => removeItem("tools_used", tool)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ComicPanel>

        {/* Outcomes */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Outcomes & Achievements</h2>
          <div className="grid gap-6">
            {/* Key Achievements */}
            <div>
              <Label>Key Achievements</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem.key_achievements}
                  onChange={(e) => setNewItem(prev => ({ ...prev, key_achievements: e.target.value }))}
                  placeholder="Add an achievement"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("key_achievements"))}
                />
                <PopButton size="sm" onClick={() => addItem("key_achievements")}>
                  <Plus className="w-4 h-4" />
                </PopButton>
              </div>
              <div className="space-y-2 mt-2">
                {form.key_achievements.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted border-2 border-foreground">
                    <span className="flex-1">{item}</span>
                    <button onClick={() => removeItem("key_achievements", item)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Lessons Learned */}
            <div>
              <Label>Lessons Learned</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem.lessons_learned}
                  onChange={(e) => setNewItem(prev => ({ ...prev, lessons_learned: e.target.value }))}
                  placeholder="Add a lesson"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addItem("lessons_learned"))}
                />
                <PopButton size="sm" onClick={() => addItem("lessons_learned")}>
                  <Plus className="w-4 h-4" />
                </PopButton>
              </div>
              <div className="space-y-2 mt-2">
                {form.lessons_learned.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-muted border-2 border-foreground">
                    <span className="flex-1">{item}</span>
                    <button onClick={() => removeItem("lessons_learned", item)}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ComicPanel>

        {/* Metrics */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Metrics (Optional)</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="clients_served">Clients Served</Label>
              <Input
                id="clients_served"
                type="number"
                value={form.clients_served}
                onChange={(e) => setForm(prev => ({ ...prev, clients_served: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="revenue_generated">Revenue Generated ($)</Label>
              <Input
                id="revenue_generated"
                type="number"
                step="0.01"
                value={form.revenue_generated}
                onChange={(e) => setForm(prev => ({ ...prev, revenue_generated: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="projects_completed">Projects Completed</Label>
              <Input
                id="projects_completed"
                type="number"
                value={form.projects_completed}
                onChange={(e) => setForm(prev => ({ ...prev, projects_completed: e.target.value }))}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Publishing */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Publishing</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="published"
                checked={form.published}
                onChange={(e) => setForm(prev => ({ ...prev, published: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="published">Published (visible on public site)</Label>
            </div>

            <div>
              <Label htmlFor="admin_notes">Admin Notes (private)</Label>
              <Textarea
                id="admin_notes"
                value={form.admin_notes}
                onChange={(e) => setForm(prev => ({ ...prev, admin_notes: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <PopButton variant="secondary" onClick={() => navigate("/admin/experiences")}>
            Cancel
          </PopButton>
          <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Create"} Experience
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExperienceEditor;
