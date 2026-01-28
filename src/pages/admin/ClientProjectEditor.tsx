import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader, MultiImageUploader } from "@/components/admin/ImageUploader";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
        .single();
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

            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Featured Image"
              folder="client-projects"
            />

            <MultiImageUploader
              value={form.screenshots}
              onChange={(urls) => setForm(prev => ({ ...prev, screenshots: urls }))}
              label="Screenshots"
              folder="client-projects/screenshots"
              maxImages={8}
            />
          </div>
        </ComicPanel>

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
