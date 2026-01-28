import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/editor";
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

  const [form, setForm] = useState({
    title: "",
    category: "person",
    description: "",
    detailed_content: "",
    image_url: "",
    related_links: [] as RelatedLink[],
    influence_areas: [] as string[],
    order_index: 0,
  });

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
      setForm({
        title: inspiration.title || "",
        category: inspiration.category || "person",
        description: inspiration.description || "",
        detailed_content: inspiration.detailed_content || "",
        image_url: inspiration.image_url || "",
        related_links: Array.isArray(inspiration.related_links) 
          ? (inspiration.related_links as unknown as RelatedLink[]) 
          : [],
        influence_areas: inspiration.influence_areas || [],
        order_index: inspiration.order_index || 0,
      });
    }
  }, [inspiration]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        title: form.title,
        category: form.category,
        description: form.description || null,
        detailed_content: form.detailed_content || null,
        image_url: form.image_url || null,
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
      setForm(prev => ({ ...prev, influence_areas: [...prev.influence_areas, newArea] }));
      setNewArea("");
    }
  };

  const addRelatedLink = () => {
    if (newLink.title && newLink.url) {
      setForm(prev => ({ ...prev, related_links: [...prev.related_links, { ...newLink }] }));
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
          <div>
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Inspiration" : "Add Inspiration"}
            </h1>
          </div>
        </div>

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
                  placeholder="e.g., Bret Helquist, Society & Struggle"
                />
              </div>
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
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
                onChange={(e) => setForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Image"
              folder="inspirations"
            />
          </div>
        </ComicPanel>

        {/* Detailed Content */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Detailed Content</h2>
          <RichTextEditor
            content={form.detailed_content}
            onChange={(content) => setForm(prev => ({ ...prev, detailed_content: content }))}
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
                <button onClick={() => setForm(prev => ({ ...prev, influence_areas: prev.influence_areas.filter(a => a !== area) }))}>
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
                <button onClick={() => setForm(prev => ({ ...prev, related_links: prev.related_links.filter((_, idx) => idx !== i) }))}>
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
