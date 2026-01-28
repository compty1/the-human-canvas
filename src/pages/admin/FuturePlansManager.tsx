import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Save, Trash2, Loader2, Target, Calendar } from "lucide-react";
import { toast } from "sonner";

interface FuturePlan {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  target_date: string | null;
  priority: number;
}

const FuturePlansManager = () => {
  const queryClient = useQueryClient();
  const [editingPlan, setEditingPlan] = useState<FuturePlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "project",
    status: "planned",
    target_date: "",
    priority: 1,
  });

  // Fetch plans from site_content as JSON
  const { data: plans, isLoading } = useQuery({
    queryKey: ["future-plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("section_key", "future_plans")
        .maybeSingle();
      
      if (error) throw error;
      return data?.content_value ? JSON.parse(data.content_value) as FuturePlan[] : [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (updatedPlans: FuturePlan[]) => {
      const { error } = await supabase
        .from("site_content")
        .upsert({
          section_key: "future_plans",
          content_value: JSON.stringify(updatedPlans),
          content_type: "json",
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "section_key",
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["future-plans"] });
      toast.success("Plans saved");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save plans");
      console.error(error);
    },
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      category: "project",
      status: "planned",
      target_date: "",
      priority: 1,
    });
    setEditingPlan(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }

    const newPlan: FuturePlan = {
      id: crypto.randomUUID(),
      title: form.title,
      description: form.description,
      category: form.category,
      status: form.status,
      target_date: form.target_date || null,
      priority: form.priority,
    };

    saveMutation.mutate([...(plans || []), newPlan]);
  };

  const handleUpdate = () => {
    if (!editingPlan || !form.title.trim()) return;

    const updatedPlans = (plans || []).map(plan => 
      plan.id === editingPlan.id
        ? { ...plan, ...form, target_date: form.target_date || null }
        : plan
    );

    saveMutation.mutate(updatedPlans);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this plan?")) return;
    const updatedPlans = (plans || []).filter(plan => plan.id !== id);
    saveMutation.mutate(updatedPlans);
  };

  const startEdit = (plan: FuturePlan) => {
    setEditingPlan(plan);
    setForm({
      title: plan.title,
      description: plan.description,
      category: plan.category,
      status: plan.status,
      target_date: plan.target_date || "",
      priority: plan.priority,
    });
    setIsCreating(false);
  };

  const categories = [
    { id: "project", label: "Project" },
    { id: "skill", label: "Skill/Learning" },
    { id: "business", label: "Business" },
    { id: "personal", label: "Personal" },
    { id: "creative", label: "Creative" },
  ];

  const statuses = [
    { id: "idea", label: "Idea", color: "bg-muted" },
    { id: "planned", label: "Planned", color: "bg-pop-yellow" },
    { id: "in_progress", label: "In Progress", color: "bg-pop-cyan" },
    { id: "completed", label: "Completed", color: "bg-green-500" },
    { id: "on_hold", label: "On Hold", color: "bg-pop-orange" },
  ];

  const getStatusColor = (status: string) => {
    return statuses.find(s => s.id === status)?.color || "bg-muted";
  };

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display">Future Plans</h1>
            <p className="text-muted-foreground">Track your goals, roadmap, and vision</p>
          </div>
          {!isCreating && !editingPlan && (
            <PopButton onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Plan
            </PopButton>
          )}
        </div>

        {/* Create/Edit Form */}
        {(isCreating || editingPlan) && (
          <ComicPanel className="p-6 bg-pop-cyan/10">
            <h2 className="text-xl font-display mb-4">
              {editingPlan ? "Edit Plan" : "New Plan"}
            </h2>
            <div className="grid gap-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Plan title..."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={form.category}
                    onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  placeholder="What do you want to achieve?"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={form.status}
                    onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="target_date">Target Date</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={form.target_date}
                    onChange={(e) => setForm(prev => ({ ...prev, target_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="priority">Priority (1-5)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min={1}
                    max={5}
                    value={form.priority}
                    onChange={(e) => setForm(prev => ({ ...prev, priority: parseInt(e.target.value) || 1 }))}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <PopButton 
                  onClick={editingPlan ? handleUpdate : handleCreate}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingPlan ? "Update" : "Create"}
                </PopButton>
                <button 
                  onClick={resetForm}
                  className="px-4 py-2 border-2 border-foreground hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          </ComicPanel>
        )}

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plans?.sort((a, b) => b.priority - a.priority).map((plan) => (
            <ComicPanel 
              key={plan.id} 
              className="p-4 cursor-pointer hover:translate-y-[-2px]"
              onClick={() => startEdit(plan)}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className={`px-2 py-1 text-xs font-bold uppercase ${getStatusColor(plan.status)}`}>
                  {plan.status.replace("_", " ")}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }}
                  className="p-1 hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              <h3 className="font-display text-lg mb-2">{plan.title}</h3>
              
              {plan.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {plan.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {plan.category}
                </span>
                {plan.target_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(plan.target_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            </ComicPanel>
          ))}
        </div>

        {(!plans || plans.length === 0) && !isCreating && (
          <ComicPanel className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No future plans yet. Start mapping your vision!</p>
            <PopButton onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Plan
            </PopButton>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default FuturePlansManager;
