import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Plus, Trash2, BookOpen, Loader2, Edit, ChevronDown, ChevronUp, SortAsc } from "lucide-react";
import { toast } from "sonner";

const ENTITY_TYPES = [
  "experiment", "project", "experience", "article", "client_project",
  "product_review", "product", "certification", "favorite", "inspiration",
  "life_period", "update", "artwork", "general",
];

const CATEGORIES = [
  "general", "brand-info", "progress-note", "research", "lesson", "process", "reference", "ai_generated",
];

type SortOption = "newest" | "oldest" | "title_asc" | "title_desc";

const KnowledgeBase = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [form, setForm] = useState({
    title: "", content: "", entity_type: "general", category: "general", tags: "",
  });

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["knowledge-base-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_entries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: form.title,
        content: form.content || null,
        entity_type: form.entity_type,
        category: form.category,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editingId) {
        const { error } = await supabase.from("knowledge_entries").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("knowledge_entries").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base-all"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      toast.success(editingId ? "Entry updated" : "Entry created");
      resetForm();
    },
    onError: () => toast.error("Failed to save entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("knowledge_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["knowledge-base-all"] });
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
      toast.success("Entry deleted");
      setDeleteId(null);
    },
  });

  const resetForm = () => {
    setForm({ title: "", content: "", entity_type: "general", category: "general", tags: "" });
    setEditingId(null);
    setShowAdd(false);
  };

  const startEdit = (entry: any) => {
    setForm({
      title: entry.title,
      content: entry.content || "",
      entity_type: entry.entity_type,
      category: entry.category || "general",
      tags: entry.tags?.join(", ") || "",
    });
    setEditingId(entry.id);
    setShowAdd(true);
  };

  const handleTagClick = (tag: string) => {
    setSearch(tag);
  };

  const filtered = entries
    .filter((e) => {
      const matchesSearch = !search || 
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        e.content?.toLowerCase().includes(search.toLowerCase()) ||
        e.tags?.some((t: string) => t.toLowerCase().includes(search.toLowerCase()));
      const matchesType = typeFilter === "all" || e.entity_type === typeFilter;
      const matchesCategory = categoryFilter === "all" || e.category === categoryFilter;
      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "title_asc": return a.title.localeCompare(b.title);
        case "title_desc": return b.title.localeCompare(a.title);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const typeCounts = entries.reduce((acc, e) => {
    acc[e.entity_type] = (acc[e.entity_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const categoryCounts = entries.reduce((acc, e) => {
    const cat = e.category || "general";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display flex items-center gap-2">
              <BookOpen className="w-8 h-8" /> Knowledge Base
            </h1>
            <p className="text-muted-foreground">
              {entries.length} entries across your work, brands, and progress
            </p>
          </div>
          <PopButton onClick={() => { resetForm(); setShowAdd(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Add Entry
          </PopButton>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-grow max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {ENTITY_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ")} {typeCounts[t] ? `(${typeCounts[t]})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c} {categoryCounts[c] ? `(${categoryCounts[c]})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-36">
              <SortAsc className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title_asc">Title A-Z</SelectItem>
              <SelectItem value="title_desc">Title Z-A</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Entries Found</h3>
            <p className="text-muted-foreground">Start building your knowledge base</p>
          </ComicPanel>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => {
              const isExpanded = expandedId === entry.id;
              return (
                <ComicPanel key={entry.id} className="p-4 group">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary font-bold uppercase">
                        {entry.entity_type.replace(/_/g, " ")}
                      </span>
                      {entry.category && entry.category !== "general" && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted font-bold">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(entry)} className="p-1 hover:text-primary">
                        <Edit className="w-3 h-3" />
                      </button>
                      <button onClick={() => setDeleteId(entry.id)} className="p-1 hover:text-destructive">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm mb-1">{entry.title}</h3>
                  {entry.content && (
                    <div>
                      <p className={`text-sm text-muted-foreground ${isExpanded ? "" : "line-clamp-3"}`}>
                        {entry.content}
                      </p>
                      {entry.content.length > 150 && (
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                          className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                        >
                          {isExpanded ? <><ChevronUp className="w-3 h-3" /> Less</> : <><ChevronDown className="w-3 h-3" /> More</>}
                        </button>
                      )}
                    </div>
                  )}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => handleTagClick(tag)}
                          className="text-[10px] px-1.5 py-0.5 bg-muted hover:bg-primary/20 transition-colors cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {new Date(entry.created_at).toLocaleDateString()}
                    {entry.updated_at && entry.updated_at !== entry.created_at && (
                      <span className="ml-1">(edited {new Date(entry.updated_at).toLocaleDateString()})</span>
                    )}
                  </p>
                </ComicPanel>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Knowledge Entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The entry will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add/Edit Dialog */}
        <Dialog open={showAdd} onOpenChange={(o) => !o && resetForm()}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit" : "Add"} Knowledge Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Entry title..."
                />
              </div>
              <div>
                <Label>Content</Label>
                <Textarea
                  value={form.content}
                  onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
                  rows={5}
                  placeholder="Details, notes, information..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Entity Type</Label>
                  <Select value={form.entity_type} onValueChange={(v) => setForm((p) => ({ ...p, entity_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ENTITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              <div className="flex justify-end gap-2">
                <PopButton variant="outline" onClick={resetForm}>Cancel</PopButton>
                <PopButton onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {editingId ? "Update" : "Create"}
                </PopButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default KnowledgeBase;
