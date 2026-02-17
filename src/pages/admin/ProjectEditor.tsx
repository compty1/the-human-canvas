import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader, MultiImageUploader } from "@/components/admin/ImageUploader";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { DraftRecoveryBanner } from "@/components/admin/DraftRecoveryBanner";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { useEditorShortcuts } from "@/hooks/useEditorShortcuts";
import { useAutosave } from "@/hooks/useAutosave";
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
  Camera,
  DollarSign
} from "lucide-react";
import { toast } from "sonner";

interface ExpenseItem {
  category: string;
  description: string;
  amount: number;
  date?: string;
}

interface IncomeData {
  revenue?: number;
  user_count?: number;
  sources?: string[];
}

interface FormState {
  title: string;
  slug: string;
  description: string;
  long_description: string;
  status: "live" | "in_progress" | "planned" | "final_review";
  external_url: string;
  logo_url: string;
  github_url: string;
  image_url: string;
  tech_stack: string[];
  features: string[];
  screenshots: string[];
  problem_statement: string;
  solution_summary: string;
  case_study: string;
  funding_goal: string;
  admin_notes: string;
  architecture_notes: string;
  accessibility_notes: string;
  start_date: string;
  end_date: string;
  expenses: ExpenseItem[];
  income_data: IncomeData;
}

const ProjectEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;
  const cloneId = searchParams.get("clone");

  const [form, setForm] = useState<FormState>({
    title: "",
    slug: "",
    description: "",
    long_description: "",
    status: "planned",
    external_url: "",
    logo_url: "",
    github_url: "",
    image_url: "",
    tech_stack: [],
    features: [],
    screenshots: [],
    problem_statement: "",
    solution_summary: "",
    case_study: "",
    funding_goal: "",
    admin_notes: "",
    architecture_notes: "",
    accessibility_notes: "",
    start_date: "",
    end_date: "",
    expenses: [],
    income_data: {},
  });

  const [newTech, setNewTech] = useState("");
  const [newFeature, setNewFeature] = useState("");
  const [analyzing, setAnalyzing] = useState<string>("");
  const [capturingScreenshots, setCapturingScreenshots] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "", description: "", amount: "" });
  const [newIncomeSource, setNewIncomeSource] = useState("");

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

  // Load existing project or clone source
  const { data: project, isLoading } = useQuery({
    queryKey: ["project-edit", id || cloneId],
    queryFn: async () => {
      const targetId = id || cloneId;
      if (!targetId) return null;
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", targetId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!(id || cloneId),
  });

  // Autosave hook
  const autosaveKey = `project_${id || "new"}`;
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
    onExit: () => navigate("/admin/projects"),
    isDirty: historyIndex > 0,
    enabled: true,
  });

  useEffect(() => {
    if (project) {
      // Handle legacy finishing_stages status by mapping to in_progress
      const projectStatus = project.status === 'finishing_stages' ? 'in_progress' : project.status;
      const initialForm: FormState = {
        title: cloneId ? `${project.title} (Copy)` : project.title || "",
        slug: cloneId ? "" : project.slug || "",
        description: project.description || "",
        long_description: project.long_description || "",
        status: (projectStatus as FormState['status']) || "planned",
        external_url: project.external_url || "",
        logo_url: project.logo_url || "",
        github_url: (project as Record<string, unknown>).github_url as string || "",
        image_url: project.image_url || "",
        tech_stack: project.tech_stack || [],
        features: project.features || [],
        screenshots: project.screenshots || [],
        problem_statement: project.problem_statement || "",
        solution_summary: project.solution_summary || "",
        case_study: project.case_study || "",
        funding_goal: cloneId ? "" : project.funding_goal?.toString() || "",
        admin_notes: project.admin_notes || "",
        architecture_notes: (project as Record<string, unknown>).architecture_notes as string || "",
        accessibility_notes: (project as Record<string, unknown>).accessibility_notes as string || "",
        start_date: cloneId ? "" : (project as Record<string, unknown>).start_date as string || "",
        end_date: cloneId ? "" : (project as Record<string, unknown>).end_date as string || "",
        expenses: cloneId ? [] : (project.expenses as unknown as ExpenseItem[]) || [],
        income_data: cloneId ? {} : (project.income_data as unknown as IncomeData) || {},
      };
      setForm(initialForm);
      setHistory([initialForm]);
      setHistoryIndex(0);
    } else if (!isEditing && !cloneId) {
      setHistory([form]);
      setHistoryIndex(0);
    }
  }, [project, isEditing, cloneId]);

  // Handle draft restoration
  const handleRestoreDraft = () => {
    const restoredData = restoreDraft();
    if (restoredData) {
      setForm(restoredData);
      setHistory([restoredData]);
      setHistoryIndex(0);
      toast.success("Draft restored");
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const saveData = {
        title: form.title,
        slug: form.slug,
        description: form.description,
        long_description: form.long_description,
        status: form.status,
        external_url: form.external_url,
        logo_url: form.logo_url,
        github_url: form.github_url,
        image_url: form.image_url,
        tech_stack: form.tech_stack,
        features: form.features,
        screenshots: form.screenshots,
        problem_statement: form.problem_statement,
        solution_summary: form.solution_summary,
        case_study: form.case_study,
        funding_goal: form.funding_goal ? parseFloat(form.funding_goal) : null,
        admin_notes: form.admin_notes,
        architecture_notes: form.architecture_notes,
        accessibility_notes: form.accessibility_notes,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        expenses: form.expenses.length > 0 ? JSON.parse(JSON.stringify(form.expenses)) : null,
        income_data: Object.keys(form.income_data).length > 0 ? JSON.parse(JSON.stringify(form.income_data)) : null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("projects")
          .update(saveData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("projects").insert(saveData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-projects"] });
      clearDraft();
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
        updateForm({
          title: data.title || form.title,
          description: data.description || form.description,
          long_description: data.long_description || form.long_description,
          tech_stack: data.tech_stack || form.tech_stack,
          features: data.features || form.features,
          problem_statement: data.problem_statement || form.problem_statement,
          solution_summary: data.solution_summary || form.solution_summary,
          logo_url: data.logo_url || form.logo_url, // Auto-fetch logo
        });
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
        updateForm({
          title: data.title || form.title,
          description: data.description || form.description,
          long_description: data.long_description || form.long_description,
          tech_stack: [...new Set([...form.tech_stack, ...(data.tech_stack || [])])],
          features: [...new Set([...form.features, ...(data.features || [])])],
          problem_statement: data.problem_statement || form.problem_statement,
          solution_summary: data.solution_summary || form.solution_summary,
          external_url: data.external_url || form.external_url,
        });
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
        updateForm({
          screenshots: [...new Set([...form.screenshots, ...data.screenshots])],
        });
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
      updateForm({ tech_stack: [...form.tech_stack, newTech] });
      setNewTech("");
    }
  };

  const removeTech = (tech: string) => {
    updateForm({ tech_stack: form.tech_stack.filter(t => t !== tech) });
  };

  const addFeature = () => {
    if (newFeature && !form.features.includes(newFeature)) {
      updateForm({ features: [...form.features, newFeature] });
      setNewFeature("");
    }
  };

  const removeFeature = (feature: string) => {
    updateForm({ features: form.features.filter(f => f !== feature) });
  };

  const generateSlug = () => {
    const slug = form.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    updateForm({ slug });
  };

  // Expense management
  const addExpense = () => {
    if (newExpense.category && newExpense.amount) {
      updateForm({
        expenses: [...form.expenses, {
          category: newExpense.category,
          description: newExpense.description,
          amount: parseFloat(newExpense.amount),
          date: new Date().toISOString().split('T')[0],
        }]
      });
      setNewExpense({ category: "", description: "", amount: "" });
    }
  };

  const removeExpense = (index: number) => {
    updateForm({ expenses: form.expenses.filter((_, i) => i !== index) });
  };

  const totalExpenses = form.expenses.reduce((sum, e) => sum + e.amount, 0);

  // Income source management
  const addIncomeSource = () => {
    if (newIncomeSource) {
      updateForm({
        income_data: {
          ...form.income_data,
          sources: [...(form.income_data.sources || []), newIncomeSource],
        }
      });
      setNewIncomeSource("");
    }
  };

  const removeIncomeSource = (source: string) => {
    updateForm({
      income_data: {
        ...form.income_data,
        sources: (form.income_data.sources || []).filter(s => s !== source),
      }
    });
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
        {/* Draft Recovery Banner */}
        {hasDraft && draftTimestamp && (
          <DraftRecoveryBanner
            timestamp={draftTimestamp}
            onRestore={handleRestoreDraft}
            onDiscard={discardDraft}
          />
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/projects")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-grow">
            <h1 className="text-3xl font-display">
              {cloneId ? "Clone Project" : isEditing ? "Edit Project" : "New Project"}
            </h1>
          </div>
          <KeyboardShortcutsHelp />
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
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
                  onChange={(e) => updateForm({ external_url: e.target.value })}
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
                  onChange={(e) => updateForm({ github_url: e.target.value })}
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
              updateForm({
                title: (data.title as string) || form.title,
                description: (data.description as string) || form.description,
                long_description: (data.long_description as string) || form.long_description,
                tech_stack: (data.tech_stack as string[]) || form.tech_stack,
                features: (data.features as string[]) || form.features,
                problem_statement: (data.problem_statement as string) || form.problem_statement,
                solution_summary: (data.solution_summary as string) || form.solution_summary,
              });
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
                  onChange={(e) => updateForm({ title: e.target.value })}
                  onBlur={() => !form.slug && generateSlug()}
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug *</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => updateForm({ slug: e.target.value })}
                  />
                  <button onClick={generateSlug} className="px-3 py-2 bg-muted hover:bg-accent border-2 border-foreground text-sm">
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="description">Short Description *</Label>
                <AIGenerateButton
                  fieldName="description"
                  fieldLabel="Description"
                  contentType="project"
                  context={{ title: form.title }}
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
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="long_description">Long Description</Label>
                <AIGenerateButton
                  fieldName="long_description"
                  fieldLabel="Long Description"
                  contentType="project"
                  context={{ title: form.title, description: form.description }}
                  currentValue={form.long_description}
                  onGenerated={(value) => updateForm({ long_description: value })}
                  variant="small"
                />
              </div>
              <Textarea
                id="long_description"
                value={form.long_description}
                onChange={(e) => updateForm({ long_description: e.target.value })}
                rows={4}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => updateForm({ status: e.target.value as FormState["status"] })}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="final_review">Final Review</option>
                  <option value="live">Live</option>
                </select>
              </div>
              <div>
                <Label htmlFor="funding_goal">Funding Goal ($)</Label>
                <Input
                  id="funding_goal"
                  type="number"
                  value={form.funding_goal}
                  onChange={(e) => updateForm({ funding_goal: e.target.value })}
                />
              </div>
            </div>

            {/* Project Dates */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => updateForm({ start_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">When did this project begin?</p>
              </div>
              <div>
                <Label htmlFor="end_date">End/Launch Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => updateForm({ end_date: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">When was it completed or launched?</p>
              </div>
            </div>

            {/* Project Logo */}
            <div>
              <Label>Project Logo</Label>
              <p className="text-xs text-muted-foreground mb-2">Auto-fetched from URL or upload manually</p>
              <div className="flex gap-4 items-start">
                {form.logo_url && (
                  <div className="w-16 h-16 border-2 border-foreground p-1 flex-shrink-0">
                    <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <ImageUploader
                    value={form.logo_url}
                    onChange={(url) => updateForm({ logo_url: url })}
                    label=""
                    folder="projects/logos"
                  />
                </div>
              </div>
            </div>

            {/* Featured Image Upload */}
            <ImageUploader
              value={form.image_url}
              onChange={(url) => updateForm({ image_url: url })}
              label="Featured Image"
              folder="projects"
            />

            {/* Screenshots Gallery */}
            <MultiImageUploader
              value={form.screenshots}
              onChange={(urls) => updateForm({ screenshots: urls })}
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
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="problem_statement">Problem Statement</Label>
                <AIGenerateButton
                  fieldName="problem_statement"
                  fieldLabel="Problem Statement"
                  contentType="project"
                  context={{ title: form.title, description: form.description }}
                  currentValue={form.problem_statement}
                  onGenerated={(value) => updateForm({ problem_statement: value })}
                  variant="small"
                />
              </div>
              <Textarea
                id="problem_statement"
                value={form.problem_statement}
                onChange={(e) => updateForm({ problem_statement: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="solution_summary">Solution Summary</Label>
                <AIGenerateButton
                  fieldName="solution_summary"
                  fieldLabel="Solution Summary"
                  contentType="project"
                  context={{ title: form.title, description: form.description, problem: form.problem_statement }}
                  currentValue={form.solution_summary}
                  onGenerated={(value) => updateForm({ solution_summary: value })}
                  variant="small"
                />
              </div>
              <Textarea
                id="solution_summary"
                value={form.solution_summary}
                onChange={(e) => updateForm({ solution_summary: e.target.value })}
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

        {/* Financial Tracking */}
        <ComicPanel className="p-6 bg-pop-gold/10">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-6 h-6" />
            <h2 className="text-xl font-display">Financial Tracking</h2>
          </div>
          
          {/* Expenses */}
          <div className="mb-6">
            <Label className="text-lg font-bold mb-3 block">Expenses</Label>
            {form.expenses.length > 0 && (
              <div className="space-y-2 mb-4">
                {form.expenses.map((expense, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-background border-2 border-foreground">
                    <span className="font-bold text-sm">{expense.category}</span>
                    <span className="flex-grow text-sm text-muted-foreground">{expense.description}</span>
                    <span className="font-bold">${expense.amount.toLocaleString()}</span>
                    <button onClick={() => removeExpense(i)} className="p-1 hover:text-destructive">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <div className="text-right font-bold text-lg border-t-2 border-foreground pt-2">
                  Total: ${totalExpenses.toLocaleString()}
                </div>
              </div>
            )}
            <div className="grid md:grid-cols-4 gap-2">
              <Input
                value={newExpense.category}
                onChange={(e) => setNewExpense(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
              />
              <Input
                value={newExpense.description}
                onChange={(e) => setNewExpense(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Description"
                className="md:col-span-2"
              />
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Amount"
                />
                <button onClick={addExpense} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Income Data */}
          <div>
            <Label className="text-lg font-bold mb-3 block">Income & Metrics</Label>
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="revenue">Revenue ($)</Label>
                <Input
                  id="revenue"
                  type="number"
                  value={form.income_data.revenue || ""}
                  onChange={(e) => updateForm({
                    income_data: { ...form.income_data, revenue: e.target.value ? parseFloat(e.target.value) : undefined }
                  })}
                  placeholder="Total revenue generated"
                />
              </div>
              <div>
                <Label htmlFor="user_count">User Count</Label>
                <Input
                  id="user_count"
                  type="number"
                  value={form.income_data.user_count || ""}
                  onChange={(e) => updateForm({
                    income_data: { ...form.income_data, user_count: e.target.value ? parseInt(e.target.value) : undefined }
                  })}
                  placeholder="Number of users"
                />
              </div>
            </div>
            <div>
              <Label>Revenue Sources</Label>
              <div className="flex flex-wrap gap-2 mb-2 mt-1">
                {(form.income_data.sources || []).map((source) => (
                  <span key={source} className="inline-flex items-center gap-1 px-3 py-1 bg-muted border-2 border-foreground text-sm">
                    {source}
                    <button onClick={() => removeIncomeSource(source)} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newIncomeSource}
                  onChange={(e) => setNewIncomeSource(e.target.value)}
                  placeholder="e.g., Subscriptions, Ads, Sales"
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addIncomeSource())}
                />
                <button onClick={addIncomeSource} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </ComicPanel>

        {/* Technical Notes */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Technical Notes</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="architecture_notes">Architecture Notes</Label>
              <Textarea
                id="architecture_notes"
                value={form.architecture_notes}
                onChange={(e) => updateForm({ architecture_notes: e.target.value })}
                rows={3}
                placeholder="System architecture, design decisions, patterns used..."
              />
            </div>
            <div>
              <Label htmlFor="accessibility_notes">Accessibility Notes</Label>
              <Textarea
                id="accessibility_notes"
                value={form.accessibility_notes}
                onChange={(e) => updateForm({ accessibility_notes: e.target.value })}
                rows={3}
                placeholder="Accessibility features, WCAG compliance, screen reader support..."
              />
            </div>
          </div>
        </ComicPanel>

        {/* Admin Notes */}
        <ComicPanel className="p-6 bg-pop-yellow/10">
          <h2 className="text-xl font-display mb-4">Admin Notes (Private)</h2>
          <Textarea
            value={form.admin_notes}
            onChange={(e) => updateForm({ admin_notes: e.target.value })}
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
