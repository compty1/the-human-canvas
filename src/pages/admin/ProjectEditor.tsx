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
import { 
  Save, 
  ArrowLeft, 
  Sparkles, 
  Plus,
  X,
  Loader2,
  Github,
  Camera
} from "lucide-react";
import { toast } from "sonner";

const ProjectEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    title: "",
    slug: "",
    description: "",
    long_description: "",
    status: "planned" as "live" | "in_progress" | "planned",
    external_url: "",
    github_url: "",
    image_url: "",
    tech_stack: [] as string[],
    features: [] as string[],
    screenshots: [] as string[],
    problem_statement: "",
    solution_summary: "",
    case_study: "",
    funding_goal: "",
    admin_notes: "",
    architecture_notes: "",
    accessibility_notes: "",
  });

  const [newTech, setNewTech] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [analyzing, setAnalyzing] = useState<string>("");
  const [capturingScreenshots, setCapturingScreenshots] = useState(false);

  // Load existing project
  const { data: project, isLoading } = useQuery({
    queryKey: ["project-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("projects")
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
        title: project.title || "",
        slug: project.slug || "",
        description: project.description || "",
        long_description: project.long_description || "",
        status: project.status || "planned",
        external_url: project.external_url || "",
        github_url: (project as Record<string, unknown>).github_url as string || "",
        image_url: project.image_url || "",
        tech_stack: project.tech_stack || [],
        features: project.features || [],
        screenshots: project.screenshots || [],
        problem_statement: project.problem_statement || "",
        solution_summary: project.solution_summary || "",
        case_study: project.case_study || "",
        funding_goal: project.funding_goal?.toString() || "",
        admin_notes: project.admin_notes || "",
        architecture_notes: (project as Record<string, unknown>).architecture_notes as string || "",
        accessibility_notes: (project as Record<string, unknown>).accessibility_notes as string || "",
      });
    }
  }, [project]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        funding_goal: form.funding_goal ? parseFloat(form.funding_goal) : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("projects")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      toast.success(isEditing ? "Project updated" : "Project created");
      navigate("/admin/projects");
    },
    onError: (error) => {
      toast.error("Failed to save project");
      console.error(error);
    },
  });

  const analyzeUrl = async () => {
    if (!form.external_url) {
      toast.error("Please enter a URL first");
      return;
    }

    setAnalyzing("site");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-site", {
        body: { url: form.external_url },
      });

      if (error) throw error;

      if (data) {
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          long_description: data.long_description || prev.long_description,
          tech_stack: data.tech_stack || prev.tech_stack,
          features: data.features || prev.features,
          problem_statement: data.problem_statement || prev.problem_statement,
          solution_summary: data.solution_summary || prev.solution_summary,
        }));
        toast.success("Site analyzed! Fields updated.");
      }
    } catch (error) {
      toast.error("Failed to analyze site");
      console.error(error);
    } finally {
      setAnalyzing("");
    }
  };

  const analyzeGitHub = async () => {
    if (!form.github_url) {
      toast.error("Please enter a GitHub URL first");
      return;
    }

    setAnalyzing("github");
    try {
      const { data, error } = await supabase.functions.invoke("analyze-github", {
        body: { url: form.github_url },
      });

      if (error) throw error;

      if (data) {
        setForm(prev => ({
          ...prev,
          title: data.title || prev.title,
          description: data.description || prev.description,
          long_description: data.long_description || prev.long_description,
          tech_stack: [...new Set([...prev.tech_stack, ...(data.tech_stack || [])])],
          features: [...new Set([...prev.features, ...(data.features || [])])],
          problem_statement: data.problem_statement || prev.problem_statement,
          solution_summary: data.solution_summary || prev.solution_summary,
          external_url: data.external_url || prev.external_url,
        }));
        toast.success("GitHub repository analyzed!");
      }
    } catch (error) {
      toast.error("Failed to analyze GitHub repository");
      console.error(error);
    } finally {
      setAnalyzing("");
    }
  };

  const captureScreenshots = async () => {
    const url = form.external_url || form.github_url;
    if (!url) {
      toast.error("Please enter a URL first");
      return;
    }

    setCapturingScreenshots(true);
    try {
      const { data, error } = await supabase.functions.invoke("capture-screenshots", {
        body: { url },
      });

      if (error) throw error;

      if (data?.screenshots && data.screenshots.length > 0) {
        setForm(prev => ({
          ...prev,
          screenshots: [...new Set([...prev.screenshots, ...data.screenshots])],
        }));
        toast.success(`Captured ${data.screenshots.length} screenshots!`);
      } else {
        toast.info("No screenshots could be captured from this URL");
      }
    } catch (error) {
      toast.error("Failed to capture screenshots");
      console.error(error);
    } finally {
      setCapturingScreenshots(false);
    }
  };

  const addTech = () => {
    if (newTech && !form.tech_stack.includes(newTech)) {
      setForm(prev => ({ ...prev, tech_stack: [...prev.tech_stack, newTech] }));
      setNewTech("");
    }
  };

  const removeTech = (tech: string) => {
    setForm(prev => ({ ...prev, tech_stack: prev.tech_stack.filter(t => t !== tech) }));
  };

  const addFeature = () => {
    if (newFeature && !form.features.includes(newFeature)) {
      setForm(prev => ({ ...prev, features: [...prev.features, newFeature] }));
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    setForm(prev => ({ ...prev, features: prev.features.filter(f => f !== feature) }));
  };

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setForm(prev => ({ ...prev, slug }));
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
          <button onClick={() => navigate("/admin/projects")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display">{isEditing ? "Edit Project" : "New Project"}</h1>
          </div>
        </div>

        {/* URL Analyzer */}
        <ComicPanel className="p-6 bg-pop-cyan/10">
          <h2 className="text-xl font-display mb-4">Import & Analyze</h2>
          <div className="grid gap-4">
            <div className="flex items-end gap-4">
              <div className="flex-grow">
                <Label htmlFor="url">Project URL</Label>
                <Input
                  id="url"
                  value={form.external_url}
                  onChange={(e) => setForm(prev => ({ ...prev, external_url: e.target.value }))}
                  placeholder="https://yourproject.com"
                />
              </div>
              <PopButton onClick={analyzeUrl} disabled={!!analyzing}>
                {analyzing === "site" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Analyze Site
              </PopButton>
            </div>
            
            <div className="flex items-end gap-4">
              <div className="flex-grow">
                <Label htmlFor="github_url">GitHub Repository URL</Label>
                <Input
                  id="github_url"
                  value={form.github_url}
                  onChange={(e) => setForm(prev => ({ ...prev, github_url: e.target.value }))}
                  placeholder="https://github.com/user/repo"
                />
              </div>
              <PopButton onClick={analyzeGitHub} disabled={!!analyzing}>
                {analyzing === "github" ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Github className="w-4 h-4 mr-2" />
                )}
                Import from GitHub
              </PopButton>
            </div>

            <div>
              <PopButton 
                variant="secondary" 
                size="sm" 
                onClick={captureScreenshots} 
                disabled={capturingScreenshots || (!form.external_url && !form.github_url)}
              >
                {capturingScreenshots ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 mr-2" />
                )}
                Auto-Capture Screenshots
              </PopButton>
              <p className="text-xs text-muted-foreground mt-1">
                Extract images from the project URL
              </p>
            </div>
          </div>
        </ComicPanel>

        {/* Bulk Text Import */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Bulk Text Import</h2>
          <BulkTextImporter
            contentType="project"
            onImport={(data) => {
              setForm(prev => ({
                ...prev,
                title: (data.title as string) || prev.title,
                description: (data.description as string) || prev.description,
                long_description: (data.long_description as string) || prev.long_description,
                tech_stack: (data.tech_stack as string[]) || prev.tech_stack,
                features: (data.features as string[]) || prev.features,
                problem_statement: (data.problem_statement as string) || prev.problem_statement,
                solution_summary: (data.solution_summary as string) || prev.solution_summary,
              }));
            }}
          />
        </ComicPanel>

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

            <div>
              <Label htmlFor="description">Short Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="long_description">Long Description</Label>
              <Textarea
                id="long_description"
                value={form.long_description}
                onChange={(e) => setForm(prev => ({ ...prev, long_description: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value as typeof form.status }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div>
                <Label htmlFor="funding_goal">Funding Goal ($)</Label>
                <Input
                  id="funding_goal"
                  type="number"
                  value={form.funding_goal}
                  onChange={(e) => setForm(prev => ({ ...prev, funding_goal: e.target.value }))}
                />
              </div>
            </div>

            {/* Featured Image Upload */}
            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Featured Image"
              folder="projects"
            />

            {/* Screenshots Gallery */}
            <MultiImageUploader
              value={form.screenshots}
              onChange={(urls) => setForm(prev => ({ ...prev, screenshots: urls }))}
              label="Screenshots"
              folder="projects/screenshots"
              maxImages={8}
            />
          </div>
        </ComicPanel>

        {/* Problem & Solution */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Problem & Solution</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="problem_statement">Problem Statement</Label>
              <Textarea
                id="problem_statement"
                value={form.problem_statement}
                onChange={(e) => setForm(prev => ({ ...prev, problem_statement: e.target.value }))}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="solution_summary">Solution Summary</Label>
              <Textarea
                id="solution_summary"
                value={form.solution_summary}
                onChange={(e) => setForm(prev => ({ ...prev, solution_summary: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Tech Stack */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Tech Stack</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.tech_stack.map((tech) => (
              <span key={tech} className="inline-flex items-center gap-1 px-3 py-1 bg-muted border-2 border-foreground font-bold text-sm">
                {tech}
                <button onClick={() => removeTech(tech)} className="hover:text-destructive">
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
                <span className="flex-grow font-sans text-sm">{feature}</span>
                <button onClick={() => removeFeature(feature)} className="hover:text-destructive">
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

        {/* Admin Notes */}
        <ComicPanel className="p-6 bg-pop-yellow/10">
          <h2 className="text-xl font-display mb-4">Admin Notes (Private)</h2>
          <Textarea
            value={form.admin_notes}
            onChange={(e) => setForm(prev => ({ ...prev, admin_notes: e.target.value }))}
            rows={4}
            placeholder="Internal notes, next steps, ideas..."
          />
        </ComicPanel>

        {/* Actions */}
        <div className="flex gap-4">
          <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Saving..." : "Save Project"}
          </PopButton>
          <button 
            onClick={() => navigate("/admin/projects")} 
            className="px-4 py-2 border-2 border-foreground hover:bg-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ProjectEditor;
