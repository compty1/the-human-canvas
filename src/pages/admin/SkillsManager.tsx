import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  icon_name: string | null;
}

const SkillsManager = () => {
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [newSkill, setNewSkill] = useState({ name: "", category: "", proficiency: 80, icon_name: "" });
  const [showNewForm, setShowNewForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: skills, isLoading } = useQuery({
    queryKey: ["admin-skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("*")
        .order("category", { ascending: true })
        .order("proficiency", { ascending: false });
      
      if (error) throw error;
      return data as Skill[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("skills").insert(newSkill);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success("Skill added");
      setNewSkill({ name: "", category: "", proficiency: 80, icon_name: "" });
      setShowNewForm(false);
    },
    onError: () => toast.error("Failed to add skill"),
  });

  const updateMutation = useMutation({
    mutationFn: async (skill: Skill) => {
      const { error } = await supabase
        .from("skills")
        .update({ name: skill.name, category: skill.category, proficiency: skill.proficiency, icon_name: skill.icon_name })
        .eq("id", skill.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success("Skill updated");
      setEditingSkill(null);
    },
    onError: () => toast.error("Failed to update skill"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-skills"] });
      toast.success("Skill deleted");
    },
    onError: () => toast.error("Failed to delete skill"),
  });

  // Group skills by category
  const groupedSkills = skills?.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>) || {};

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display">Skills</h1>
            <p className="text-muted-foreground">Manage your skill categories and proficiency levels</p>
          </div>
          <PopButton onClick={() => setShowNewForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Skill
          </PopButton>
        </div>

        {/* New Skill Form */}
        {showNewForm && (
          <ComicPanel className="p-6 bg-pop-cyan/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display">New Skill</h2>
              <button onClick={() => setShowNewForm(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={newSkill.name}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="React"
                />
              </div>
              <div>
                <Label>Category *</Label>
                <Input
                  value={newSkill.category}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Web Development"
                />
              </div>
              <div>
                <Label>Proficiency (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={newSkill.proficiency}
                  onChange={(e) => setNewSkill(prev => ({ ...prev, proficiency: parseInt(e.target.value) || 0 }))}
                />
              </div>
              <div className="flex items-end">
                <PopButton 
                  onClick={() => createMutation.mutate()} 
                  disabled={!newSkill.name || !newSkill.category}
                >
                  <Save className="w-4 h-4 mr-2" /> Save
                </PopButton>
              </div>
            </div>
          </ComicPanel>
        )}

        {/* Skills by Category */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : Object.keys(groupedSkills).length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <ComicPanel key={category} className="p-6">
                <h2 className="text-2xl font-display mb-4">{category}</h2>
                <div className="space-y-3">
                  {categorySkills.map((skill) => (
                    <div key={skill.id} className="flex items-center gap-4 p-3 bg-muted/50">
                      {editingSkill?.id === skill.id ? (
                        <>
                          <Input
                            value={editingSkill.name}
                            onChange={(e) => setEditingSkill(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="flex-grow"
                          />
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={editingSkill.proficiency}
                            onChange={(e) => setEditingSkill(prev => prev ? { ...prev, proficiency: parseInt(e.target.value) || 0 } : null)}
                            className="w-20"
                          />
                          <button 
                            onClick={() => editingSkill && updateMutation.mutate(editingSkill)}
                            className="p-2 bg-primary text-primary-foreground"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setEditingSkill(null)}
                            className="p-2 hover:bg-muted"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="font-bold flex-grow">{skill.name}</span>
                          <div className="w-32 h-2 bg-muted border border-foreground overflow-hidden">
                            <div 
                              className="h-full bg-primary"
                              style={{ width: `${skill.proficiency}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold w-12 text-right">{skill.proficiency}%</span>
                          <button 
                            onClick={() => setEditingSkill(skill)}
                            className="p-2 hover:bg-muted rounded"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm("Delete this skill?")) {
                                deleteMutation.mutate(skill.id);
                              }
                            }}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No skills found</p>
            <PopButton onClick={() => setShowNewForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Skill
            </PopButton>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default SkillsManager;
