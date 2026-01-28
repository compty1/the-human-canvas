import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Save, X, Edit, StickyNote } from "lucide-react";
import { toast } from "sonner";

type NoteCategory = "brand" | "marketing" | "content" | "traffic" | "ideas";
type NoteStatus = "idea" | "planned" | "in_progress" | "done";

interface AdminNote {
  id: string;
  title: string;
  content: string | null;
  category: NoteCategory;
  status: NoteStatus | null;
  priority: number | null;
  related_project_id: string | null;
}

const NotesManager = () => {
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory | "all">("all");
  const [editingNote, setEditingNote] = useState<AdminNote | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newNote, setNewNote] = useState({
    title: "",
    content: "",
    category: "ideas" as NoteCategory,
    status: "idea" as NoteStatus,
    priority: 0,
  });
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["admin-notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_notes")
        .select("*")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as AdminNote[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("admin_notes").insert(newNote);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      toast.success("Note added");
      setNewNote({ title: "", content: "", category: "ideas", status: "idea", priority: 0 });
      setShowNewForm(false);
    },
    onError: () => toast.error("Failed to add note"),
  });

  const updateMutation = useMutation({
    mutationFn: async (note: AdminNote) => {
      const { error } = await supabase
        .from("admin_notes")
        .update({
          title: note.title,
          content: note.content,
          category: note.category,
          status: note.status,
          priority: note.priority,
        })
        .eq("id", note.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      toast.success("Note updated");
      setEditingNote(null);
    },
    onError: () => toast.error("Failed to update note"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("admin_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notes"] });
      toast.success("Note deleted");
    },
    onError: () => toast.error("Failed to delete note"),
  });

  const categories: { id: NoteCategory; label: string; color: string }[] = [
    { id: "brand", label: "Brand", color: "bg-pop-magenta" },
    { id: "marketing", label: "Marketing", color: "bg-pop-cyan" },
    { id: "content", label: "Content", color: "bg-pop-yellow" },
    { id: "traffic", label: "Traffic", color: "bg-pop-orange" },
    { id: "ideas", label: "Ideas", color: "bg-primary" },
  ];

  const statuses: NoteStatus[] = ["idea", "planned", "in_progress", "done"];

  const filteredNotes = selectedCategory === "all" 
    ? notes 
    : notes?.filter(n => n.category === selectedCategory);

  const getCategoryColor = (cat: NoteCategory) => 
    categories.find(c => c.id === cat)?.color || "bg-muted";

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display">Notes & Ideas</h1>
            <p className="text-muted-foreground">Capture thoughts, plans, and ideas for your brand</p>
          </div>
          <PopButton onClick={() => setShowNewForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Note
          </PopButton>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-2 text-sm font-bold uppercase border-2 border-foreground ${
              selectedCategory === "all" ? "bg-foreground text-background" : "bg-background hover:bg-muted"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-2 text-sm font-bold uppercase border-2 border-foreground ${
                selectedCategory === cat.id ? cat.color : "bg-background hover:bg-muted"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* New Note Form */}
        {showNewForm && (
          <ComicPanel className="p-6 bg-pop-cyan/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display">New Note</h2>
              <button onClick={() => setShowNewForm(false)} className="p-1 hover:bg-muted rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid gap-4">
              <Input
                value={newNote.title}
                onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Note title"
              />
              <Textarea
                value={newNote.content}
                onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Note content..."
                rows={4}
              />
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Category</Label>
                  <select
                    value={newNote.category}
                    onChange={(e) => setNewNote(prev => ({ ...prev, category: e.target.value as NoteCategory }))}
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={newNote.status}
                    onChange={(e) => setNewNote(prev => ({ ...prev, status: e.target.value as NoteStatus }))}
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Priority (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={newNote.priority}
                    onChange={(e) => setNewNote(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <PopButton onClick={() => createMutation.mutate()} disabled={!newNote.title}>
                <Save className="w-4 h-4 mr-2" /> Save Note
              </PopButton>
            </div>
          </ComicPanel>
        )}

        {/* Notes Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : filteredNotes && filteredNotes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <ComicPanel key={note.id} className="p-4">
                {editingNote?.id === note.id ? (
                  <div className="space-y-3">
                    <Input
                      value={editingNote.title}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                    />
                    <Textarea
                      value={editingNote.content || ""}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, content: e.target.value } : null)}
                      rows={3}
                    />
                    <select
                      value={editingNote.status || "idea"}
                      onChange={(e) => setEditingNote(prev => prev ? { ...prev, status: e.target.value as NoteStatus } : null)}
                      className="w-full h-8 px-2 text-sm border-2 border-input bg-background"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>{s.replace("_", " ")}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editingNote && updateMutation.mutate(editingNote)}
                        className="p-2 bg-primary text-primary-foreground"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingNote(null)} className="p-2 hover:bg-muted">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase ${getCategoryColor(note.category)}`}>
                        {note.category}
                      </span>
                      <div className="flex gap-1">
                        <button onClick={() => setEditingNote(note)} className="p-1 hover:bg-muted rounded">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm("Delete this note?")) {
                              deleteMutation.mutate(note.id);
                            }
                          }}
                          className="p-1 hover:bg-destructive/10 text-destructive rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-display text-lg mb-2">{note.title}</h3>
                    {note.content && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{note.content}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2 py-0.5 text-xs font-bold uppercase border ${
                        note.status === "done" ? "bg-green-500/20 border-green-500" :
                        note.status === "in_progress" ? "bg-pop-yellow/20 border-pop-yellow" :
                        "bg-muted border-muted-foreground"
                      }`}>
                        {note.status?.replace("_", " ") || "idea"}
                      </span>
                      {note.priority && note.priority > 0 && (
                        <span className="text-xs text-muted-foreground">
                          Priority: {note.priority}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <StickyNote className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">No notes found</p>
            <PopButton onClick={() => setShowNewForm(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Your First Note
            </PopButton>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default NotesManager;
