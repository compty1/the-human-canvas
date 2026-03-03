import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { QuickEditDrawer, QuickEditField } from "@/components/admin/QuickEditDrawer";
import { DuplicateButton } from "@/components/admin/DuplicateButton";
import { BulkActionsBar, SelectableCheckbox, useSelection } from "@/components/admin/BulkActionsBar";
import { useAdminListControls, SortPaginationBar, SortOption } from "@/components/admin/AdminListControls";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Briefcase,
  Palette,
  Code,
  Users,
  MoreVertical,
  Eye,
  EyeOff,
  GripVertical,
  Copy,
  Search,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const categoryIcons: Record<string, React.ElementType> = {
  creative: Palette,
  business: Briefcase,
  technical: Code,
  service: Users,
  other: MoreVertical,
};

const categoryColors: Record<string, string> = {
  creative: "bg-purple-500",
  business: "bg-blue-500",
  technical: "bg-green-500",
  service: "bg-orange-500",
  other: "bg-gray-500",
};
const EXP_SORT: SortOption[] = [
  { label: "Order Index", key: "order_index", direction: "asc" },
  { label: "Title A-Z", key: "title", direction: "asc" },
  { label: "Newest First", key: "created_at", direction: "desc" },
];

const ExperiencesManager = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const { selectedIds, toggleSelection, clearSelection } = useSelection();

  const QUICK_EDIT_FIELDS: QuickEditField[] = [
    { key: "title", label: "Title", type: "text" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "skills_used", label: "Skills Used", type: "tags" },
    { key: "published", label: "Published", type: "boolean" },
  ];

  const { data: experiences = [], isLoading } = useQuery({
    queryKey: ["admin-experiences"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("experiences")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("experiences").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success("Experience deleted");
    },
    onError: () => {
      toast.error("Failed to delete experience");
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) => {
      const { error } = await supabase
        .from("experiences")
        .update({ published })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-experiences"] });
      toast.success("Experience updated");
    },
  });

  const filteredExperiences = experiences.filter(e => {
    const matchesCategory = filter === "all" || e.category === filter;
    const matchesSearch = !search || e.title.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const { sortIndex, setSortIndex, page, setPage, totalPages, paginated, sortOptions } = useAdminListControls(filteredExperiences, EXP_SORT);

  const categories = ["all", ...new Set(experiences.map(e => e.category).filter(Boolean))].sort((a, b) => a === "all" ? -1 : b === "all" ? 1 : a.localeCompare(b));

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display">Experiences</h1>
            <p className="text-muted-foreground">Manage your past experiences and expertise</p>
          </div>
          <Link to="/admin/experiences/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> Add Experience
            </PopButton>
          </Link>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => {
            const Icon = cat === "all" ? Briefcase : categoryIcons[cat];
            const count = cat === "all" 
              ? experiences.length 
              : experiences.filter(e => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 font-bold text-sm capitalize flex items-center gap-2 border-2 transition-colors ${
                  filter === cat
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground hover:bg-muted"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search experiences..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <SortPaginationBar sortOptions={sortOptions} sortIndex={sortIndex} onSortChange={setSortIndex} page={page} totalPages={totalPages} onPageChange={setPage} totalItems={filteredExperiences.length} />
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredExperiences.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No experiences yet</h2>
            <p className="text-muted-foreground mb-4">Add your first experience to get started</p>
            <Link to="/admin/experiences/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add Experience
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="space-y-4">
            {paginated.map((exp) => {
              const Icon = categoryIcons[exp.category] || Briefcase;
              return (
                <ComicPanel key={exp.id} className="p-4">
                  <div className="flex items-center gap-4">
                    <SelectableCheckbox id={exp.id} selectedIds={selectedIds} onToggle={toggleSelection} />
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    
                    <div className={`w-10 h-10 flex items-center justify-center text-white ${categoryColors[exp.category] || "bg-gray-500"}`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display text-lg truncate">{exp.title}</h3>
                        {!exp.published && (
                          <span className="px-2 py-0.5 text-xs bg-muted font-bold">Draft</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="capitalize">{exp.category}</span>
                        {exp.subcategory && (
                          <>
                            <span>•</span>
                            <span className="capitalize">{exp.subcategory}</span>
                          </>
                        )}
                        {exp.is_ongoing && (
                          <>
                            <span>•</span>
                            <span className="text-green-600 font-bold">Ongoing</span>
                          </>
                        )}
                      </div>
                    </div>

                    <button onClick={() => setQuickEditId(exp.id)} className="p-2 hover:bg-muted rounded" title="Quick Edit">
                      <SlidersHorizontal className="w-4 h-4" />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-2 hover:bg-muted rounded">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/experiences/${exp.id}/edit`} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/experiences/new?clone=${exp.id}`} className="flex items-center gap-2">
                            <Copy className="w-4 h-4" /> Duplicate
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => togglePublishMutation.mutate({ 
                            id: exp.id, 
                            published: !exp.published 
                          })}
                          className="flex items-center gap-2"
                        >
                          {exp.published ? (
                            <>
                              <EyeOff className="w-4 h-4" /> Unpublish
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4" /> Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeleteId(exp.id)}
                          className="flex items-center gap-2 text-destructive"
                        >
                          <Trash2 className="w-4 h-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </ComicPanel>
              );
            })}
          </div>
        )}
      </div>

      <BulkActionsBar
        selectedIds={selectedIds}
        onClearSelection={clearSelection}
        tableName="experiences"
        queryKey={["admin-experiences"]}
        actions={["publish", "unpublish", "set-tags", "delete"]}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}
        title="Delete this experience?"
        description="This action cannot be undone."
      />

      <QuickEditDrawer
        open={!!quickEditId}
        onOpenChange={(open) => !open && setQuickEditId(null)}
        tableName="experiences"
        recordId={quickEditId}
        fields={QUICK_EDIT_FIELDS}
        queryKey={["admin-experiences"]}
      />
    </AdminLayout>
  );
};

export default ExperiencesManager;
