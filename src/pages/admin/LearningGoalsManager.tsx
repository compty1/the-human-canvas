import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X, Edit } from "lucide-react";
import { toast } from "sonner";

interface LearningGoal {
  id: string;
  title: string;
  description: string | null;
  progress_percent: number | null;
  target_amount: number | null;
  raised_amount: number | null;
}

const LearningGoalsManager = () => {
  const [editingGoal, setEditingGoal] = useState<LearningGoal | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    progress_percent: 0,
    target_amount: "",
    raised_amount: "",
  });
  const queryClient = useQueryClient();

  const { data: goals, isLoading } = useQuery({
    queryKey: ["admin-learning-goals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_goals")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as LearningGoal[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("learning_goals").insert({
        title: newGoal.title,
        description: newGoal.description || null,
        progress_percent: newGoal.progress_percent,
        target_amount: newGoal.target_amount ? parseFloat(newGoal.target_amount) : null,
        raised_amount: newGoal.raised_amount ? parseFloat(newGoal.raised_amount) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learning-goals"] });
      toast.success("Learning goal added");
      setNewGoal({ title: "", description: "", progress_percent: 0, target_amount: "", raised_amount: "" });
      setShowNewForm(false);
    },
    onError: () => toast.error("Failed to add learning goal"),
  });

  const updateMutation = useMutation({
    mutationFn: async (goal: LearningGoal) => {
      const { error } = await supabase
        .from("learning_goals")
        .update({
          title: goal.title,
          description: goal.description,
          progress_percent: goal.progress_percent,
          target_amount: goal.target_amount,
          raised_amount: goal.raised_amount,
        })
        .eq("id", goal.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learning-goals"] });
      toast.success("Learning goal updated");
      setEditingGoal(null);
    },
    onError: () => toast.error("Failed to update learning goal"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("learning_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-learning-goals"] });
      toast.success("Learning goal deleted");
    },
    onError: () => toast.error("Failed to delete learning goal"),
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display">Learning Goals</h1>
            <p className="text-muted-foreground">Track your learning journey and education goals</p>
          </div>
          <PopButton onClick={() => setShowNewForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Goal
          </PopButton>
        </div>

        {/* New Goal Form */}
        {showNewForm && (
          <ComicPanel className="p-6 bg-pop-yellow/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display">New Learning Goal</h2>
              <button onClick={() => setShowNewForm(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={newGoal.title}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Learn advanced TypeScript"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="What does this goal involve?"
                  rows={2}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Progress (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={newGoal.progress_percent}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, progress_percent: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label>Target Amount ($)</Label>
                  <Input
                    type="number"
                    value={newGoal.target_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, target_amount: e.target.value }))}
                    placeholder="Optional funding goal"
                  />
                </div>
                <div>
                  <Label>Raised Amount ($)</Label>
                  <Input
                    type="number"
                    value={newGoal.raised_amount}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, raised_amount: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <PopButton onClick={() => createMutation.mutate()} disabled={!newGoal.title}>
                  <Save className="w-4 h-4 mr-2" /> Save Goal
                </PopButton>
              </div>
            </div>
          </ComicPanel>
        )}

        {/* Goals List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <ComicPanel key={goal.id} className="p-6">
                {editingGoal?.id === goal.id ? (
                  <div className="grid gap-4">
                    <Input
                      value={editingGoal.title}
                      onChange={(e) => setEditingGoal(prev => prev ? { ...prev, title: e.target.value } : null)}
                      placeholder="Title"
                    />
                    <Textarea
                      value={editingGoal.description || ""}
                      onChange={(e) => setEditingGoal(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Description"
                      rows={2}
                    />
                    <div className="grid md:grid-cols-3 gap-4">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={editingGoal.progress_percent || 0}
                        onChange={(e) => setEditingGoal(prev => prev ? { ...prev, progress_percent: parseInt(e.target.value) || 0 } : null)}
                      />
                      <Input
                        type="number"
                        value={editingGoal.target_amount || ""}
                        onChange={(e) => setEditingGoal(prev => prev ? { ...prev, target_amount: parseFloat(e.target.value) || null } : null)}
                        placeholder="Target"
                      />
                      <Input
                        type="number"
                        value={editingGoal.raised_amount || ""}
                        onChange={(e) => setEditingGoal(prev => prev ? { ...prev, raised_amount: parseFloat(e.target.value) || null } : null)}
                        placeholder="Raised"
                      />
                    </div>
                    <div className="flex gap-2">
                      <PopButton onClick={() => editingGoal && updateMutation.mutate(editingGoal)}>
                        <Save className="w-4 h-4 mr-2" /> Save
                      </PopButton>
                      <button onClick={() => setEditingGoal(null)} className="px-4 py-2 border-2 border-foreground hover:bg-muted">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-2xl font-display">{goal.title}</h3>
                        {goal.description && (
                          <p className="text-muted-foreground mt-1">{goal.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingGoal(goal)} className="p-2 hover:bg-muted rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("Delete this goal?")) {
                              deleteMutation.mutate(goal.id);
                            }
                          }}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-sm font-bold mb-1">
                        <span>Progress</span>
                        <span>{goal.progress_percent || 0}%</span>
                      </div>
                      <div className="h-3 bg-muted border-2 border-foreground overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${goal.progress_percent || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Funding */}
                    {goal.target_amount && (
                      <div className="text-sm text-muted-foreground">
                        Funding: ${goal.raised_amount || 0} / ${goal.target_amount}
                      </div>
                    )}
                  </>
                )}
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No learning goals yet</p>
            <PopButton onClick={() => setShowNewForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Goal
            </PopButton>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default LearningGoalsManager;
