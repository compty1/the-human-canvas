import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { MultiImageUploader } from "@/components/admin/MultiImageUploader";
import { BulkTextImporter } from "@/components/admin/BulkTextImporter";
import { RichTextEditor } from "@/components/editor";
import { UndoRedoControls } from "@/components/admin/UndoRedoControls";
import { AIGenerateButton } from "@/components/admin/AIGenerateButton";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Loader2, Plus, X, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface RelatedLink {
  title: string;
  url: string;
}

interface FormState {
  title: string;
  category: string;
  description: string;
  detailed_content: string;
  image_url: string;
  images: string[];
  related_links: RelatedLink[];
  influence_areas: string[];
  order_index: number;
}

const categories = [
  { value: "person", label: "Person" },
  { value: "concept", label: "Concept" },
  { value: "movement", label: "Movement" },
  { value: "experience", label: "Experience" },
];

const InspirationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState<FormState>({
    title: "",
    category: "person",
    description: "",
    detailed_content: "",
    image_url: "",
    images: [],
    related_links: [],
    influence_areas: [],
    order_index: 0,
  });

  // Undo/Redo history
  const [history, setHistory] = useState<FormState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushHistory = (newForm: FormState) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newForm);
    // Keep max 50 history states
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

  // Keyboard shortcuts
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

  const [newArea, setNewArea] = useState("");
  const [newLink, setNewLink] = useState({ title: "", url: "" });

  const { data: inspiration, isLoading } = useQuery({
    queryKey: ["inspiration-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("inspirations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (inspiration) {
      const initialForm: FormState = {
        title: inspiration.title || "",
        category: inspiration.category || "person",
        description: inspiration.description || "",
        detailed_content: inspiration.detailed_content || "",
        image_url: inspiration.image_url || "",
        images: (inspiration as Record<string, unknown>).images as string[] || [],
        related_links: Array.isArray(inspiration.related_links) 
          ? (inspiration.related_links as unknown as RelatedLink[]) 
          : [],
        influence_areas: inspiration.influence_areas || [],
        order_index: inspiration.order_index || 0,
      };
      setForm(initialForm);
      setHistory([initialForm]);
      setHistoryIndex(0);
    } else if (!isEditing) {
      // Initialize history for new items
      setHistory([form]);
      setHistoryIndex(0);
    }
  }, [inspiration, isEditing]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title: form.title,
        category: form.category,
        description: form.description || null,
        detailed_content: form.detailed_content || null,
        image_url: form.image_url || null,
        images: form.images,
        related_links: JSON.parse(JSON.stringify(form.related_links)),
        influence_areas: form.influence_areas,
        order_index: form.order_index,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("inspirations")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inspirations").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inspirations"] });
      toast.success(isEditing ? "Inspiration updated" : "Inspiration added");
      navigate("/admin/inspirations");
    },
    onError: (error) => {
      toast.error("Failed to save");
      console.error(error);
    },
  });

  const addInfluenceArea = () => {
    if (newArea && !form.influence_areas.includes(newArea)) {
      updateForm({ influence_areas: [...form.influence_areas, newArea] });
      setNewArea("");
    }
  };

  const addRelatedLink = () => {
    if (newLink.title && newLink.url) {
      updateForm({ related_links: [...form.related_links, { ...newLink }] });
      setNewLink({ title: "", url: "" });
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
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/inspirations")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-grow">
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Inspiration" : "Add Inspiration"}
            </h1>
          </div>
          <UndoRedoControls
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
          />
        </div>

        {/* Bulk Text Importer */}
        <BulkTextImporter
          contentType="inspiration"
          onImport={(data) => {
            const updates: Partial<FormState> = {};
            if (data.title) updates.title = String(data.title);
            if (data.category) updates.category = String(data.category);
            if (data.description) updates.description = String(data.description);
            if (data.detailed_content) updates.detailed_content = String(data.detailed_content);
            if (data.influence_areas) updates.influence_areas = Array.isArray(data.influence_areas) ? data.influence_areas : [];
            updateForm(updates);
          }}
        />

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
                  placeholder="e.g., Bret Helquist, Society & Struggle"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => updateForm({ category: e.target.value })}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
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
                  contentType="inspiration"
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
                rows={3}
                placeholder="Brief overview of this inspiration..."
              />
            </div>

            <div>
              <Label htmlFor="order">Display Order</Label>
              <Input
                id="order"
                type="number"
                value={form.order_index}
                onChange={(e) => updateForm({ order_index: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => updateForm({ image_url: url })}
              label="Cover Image"
              folder="inspirations"
            />

            <MultiImageUploader
              value={form.images}
              onChange={(urls) => updateForm({ images: urls })}
              label="Additional Images"
              folder="inspirations/gallery"
              maxImages={10}
            />
          </div>
        </ComicPanel>

        {/* Detailed Content */}
        <ComicPanel className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display">Detailed Content</h2>
            <AIGenerateButton
              fieldName="detailed_content"
              fieldLabel="Content"
              contentType="inspiration"
              context={{ 
                title: form.title, 
                category: form.category, 
                description: form.description,
                influence_areas: form.influence_areas 
              }}
              currentValue={form.detailed_content}
              onGenerated={(value) => updateForm({ detailed_content: value })}
              variant="small"
            />
          </div>
          <RichTextEditor
            content={form.detailed_content}
            onChange={(content) => updateForm({ detailed_content: content })}
            placeholder="Write in detail about this inspiration and how it influences your work..."
          />
        </ComicPanel>

        {/* Influence Areas */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Influence Areas</h2>
          <p className="text-sm text-muted-foreground mb-4">
            What aspects of your work does this influence? (e.g., art style, philosophy, storytelling)
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.influence_areas.map((area) => (
              <span key={area} className="inline-flex items-center gap-1 px-3 py-1 bg-muted border-2 border-foreground font-bold text-sm">
                {area}
                <button onClick={() => updateForm({ influence_areas: form.influence_areas.filter(a => a !== area) })}>
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newArea}
              onChange={(e) => setNewArea(e.target.value)}
              placeholder="Add influence area..."
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addInfluenceArea())}
            />
            <button onClick={addInfluenceArea} className="p-2 bg-muted hover:bg-accent border-2 border-foreground">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </ComicPanel>

        {/* Related Links */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Related Links</h2>
          <div className="space-y-2 mb-4">
            {form.related_links.map((link, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-muted">
                <LinkIcon className="w-4 h-4 flex-shrink-0" />
                <div className="flex-grow min-w-0">
                  <div className="font-bold truncate">{link.title}</div>
                  <div className="text-xs text-muted-foreground truncate">{link.url}</div>
                </div>
                <button onClick={() => updateForm({ related_links: form.related_links.filter((_, idx) => idx !== i) })}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="grid md:grid-cols-2 gap-2 mb-2">
            <Input
              value={newLink.title}
              onChange={(e) => setNewLink(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Link title"
            />
            <Input
              value={newLink.url}
              onChange={(e) => setNewLink(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://..."
            />
          </div>
          <PopButton variant="secondary" size="sm" onClick={addRelatedLink}>
            <Plus className="w-4 h-4 mr-2" /> Add Link
          </PopButton>
        </ComicPanel>

        {/* Save */}
        <div className="flex justify-end">
          <PopButton onClick={() => saveMutation.mutate()} disabled={!form.title || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Save"} Inspiration
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default InspirationEditor;
