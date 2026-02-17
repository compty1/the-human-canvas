import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PopButton } from "@/components/pop-art";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  url: string;
  filename: string;
}

interface AddToContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMedia: MediaItem[];
  onSuccess: () => void;
}

// Content type definitions with their image fields
const CONTENT_TYPE_CONFIG: Record<string, {
  label: string;
  table: string;
  titleField: string;
  fields: { name: string; label: string; type: "single" | "array" }[];
}> = {
  articles: {
    label: "Articles",
    table: "articles",
    titleField: "title",
    fields: [{ name: "featured_image", label: "Featured Image", type: "single" }],
  },
  projects: {
    label: "Projects",
    table: "projects",
    titleField: "title",
    fields: [
      { name: "image_url", label: "Main Image", type: "single" },
      { name: "screenshots", label: "Screenshots", type: "array" },
    ],
  },
  life_periods: {
    label: "Life Periods",
    table: "life_periods",
    titleField: "title",
    fields: [
      { name: "image_url", label: "Main Image", type: "single" },
      { name: "images", label: "Gallery Images", type: "array" },
    ],
  },
  experiences: {
    label: "Experiences",
    table: "experiences",
    titleField: "title",
    fields: [
      { name: "image_url", label: "Main Image", type: "single" },
      { name: "screenshots", label: "Screenshots", type: "array" },
    ],
  },
  experiments: {
    label: "Experiments",
    table: "experiments",
    titleField: "name",
    fields: [
      { name: "image_url", label: "Main Image", type: "single" },
      { name: "screenshots", label: "Screenshots", type: "array" },
    ],
  },
  favorites: {
    label: "Favorites",
    table: "favorites",
    titleField: "title",
    fields: [{ name: "image_url", label: "Image", type: "single" }],
  },
  client_projects: {
    label: "Client Projects",
    table: "client_projects",
    titleField: "project_name",
    fields: [
      { name: "image_url", label: "Main Image", type: "single" },
      { name: "screenshots", label: "Screenshots", type: "array" },
    ],
  },
  products: {
    label: "Products",
    table: "products",
    titleField: "name",
    fields: [{ name: "images", label: "Product Images", type: "array" }],
  },
  certifications: {
    label: "Certifications",
    table: "certifications",
    titleField: "name",
    fields: [{ name: "image_url", label: "Image", type: "single" }],
  },
  inspirations: {
    label: "Inspirations",
    table: "inspirations",
    titleField: "title",
    fields: [
      { name: "image_url", label: "Main Image", type: "single" },
      { name: "images", label: "Gallery Images", type: "array" },
    ],
  },
  product_reviews: {
    label: "Product Reviews",
    table: "product_reviews",
    titleField: "product_name",
    fields: [
      { name: "featured_image", label: "Featured Image", type: "single" },
      { name: "screenshots", label: "Screenshots", type: "array" },
    ],
  },
  artwork: {
    label: "Artwork (new entry)",
    table: "artwork",
    titleField: "title",
    fields: [{ name: "image_url", label: "Image", type: "single" }],
  },
};

export const AddToContentModal = ({
  open, onOpenChange, selectedMedia, onSuccess,
}: AddToContentModalProps) => {
  const [contentType, setContentType] = useState("");
  const [targetField, setTargetField] = useState("");
  const [targetRecordId, setTargetRecordId] = useState("");
  const [recordSearch, setRecordSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const config = contentType ? CONTENT_TYPE_CONFIG[contentType] : null;

  // Fetch records for selected content type
  const { data: records = [], isLoading: recordsLoading } = useQuery({
    queryKey: ["add-to-content-records", contentType],
    queryFn: async () => {
      if (!config || contentType === "artwork") return [];
      const titleField = config.titleField;
      const { data } = await (supabase.from(config.table as any) as any)
        .select(`id, ${titleField}`)
        .order("created_at", { ascending: false })
        .limit(200);
      return (data || []).map((r: any) => ({ id: r.id, title: r[titleField] || r.id }));
    },
    enabled: !!config && contentType !== "artwork",
  });

  const filteredRecords = records.filter((r: any) =>
    r.title?.toLowerCase().includes(recordSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);

    try {
      const urls = selectedMedia.map((m) => m.url);

      // Special case: artwork creates new entries
      if (contentType === "artwork") {
        for (const media of selectedMedia) {
          await supabase.from("artwork").insert({
            title: media.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            image_url: media.url,
            category: "mixed",
          });
        }
        toast.success(`Added ${selectedMedia.length} item(s) to artwork`);
        onSuccess();
        resetAndClose();
        return;
      }

      if (!targetRecordId || !targetField) {
        toast.error("Please select a record and field");
        setSaving(false);
        return;
      }

      const fieldConfig = config.fields.find((f) => f.name === targetField);
      if (!fieldConfig) return;

      if (fieldConfig.type === "single") {
        // Replace single image field
        await (supabase.from(config.table as any) as any)
          .update({ [targetField]: urls[0] })
          .eq("id", targetRecordId);
        toast.success(`Updated ${fieldConfig.label}`);
      } else {
        // Append to array field
        const { data: existing } = await (supabase.from(config.table as any) as any)
          .select(targetField)
          .eq("id", targetRecordId)
          .single();
        const currentArray = (existing?.[targetField] as string[]) || [];
        const newArray = [...currentArray, ...urls];
        await (supabase.from(config.table as any) as any)
          .update({ [targetField]: newArray })
          .eq("id", targetRecordId);
        toast.success(`Added ${urls.length} image(s) to ${fieldConfig.label}`);
      }

      onSuccess();
      resetAndClose();
    } catch (error) {
      console.error("Failed to add to content:", error);
      toast.error("Failed to add to content");
    } finally {
      setSaving(false);
    }
  };

  const resetAndClose = () => {
    setContentType("");
    setTargetField("");
    setTargetRecordId("");
    setRecordSearch("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Adding {selectedMedia.length} image(s) to content
          </p>

          {/* Step 1: Content Type */}
          <div>
            <Label>Content Type</Label>
            <Select
              value={contentType}
              onValueChange={(v) => {
                setContentType(v);
                setTargetField("");
                setTargetRecordId("");
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select content type..." /></SelectTrigger>
              <SelectContent>
                {Object.entries(CONTENT_TYPE_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Step 2: Target Field */}
          {config && config.fields.length > 1 && contentType !== "artwork" && (
            <div>
              <Label>Target Field</Label>
              <Select value={targetField} onValueChange={setTargetField}>
                <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                <SelectContent>
                  {config.fields.map((f) => (
                    <SelectItem key={f.name} value={f.name}>
                      {f.label} ({f.type === "single" ? "replace" : "append"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Auto-select if single field */}
          {config && config.fields.length === 1 && contentType !== "artwork" && !targetField && (
            <>{(() => { if (!targetField) setTimeout(() => setTargetField(config.fields[0].name), 0); return null; })()}</>
          )}

          {/* Step 3: Target Record */}
          {config && contentType !== "artwork" && targetField && (
            <div>
              <Label>Select Record</Label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search records..."
                  value={recordSearch}
                  onChange={(e) => setRecordSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {recordsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded space-y-0">
                  {filteredRecords.map((r: any) => (
                    <button
                      key={r.id}
                      onClick={() => setTargetRecordId(r.id)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors ${
                        targetRecordId === r.id ? "bg-primary/10 font-medium" : ""
                      }`}
                    >
                      {r.title}
                    </button>
                  ))}
                  {filteredRecords.length === 0 && (
                    <p className="text-sm text-muted-foreground p-3">No records found</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <PopButton variant="outline" onClick={resetAndClose}>Cancel</PopButton>
            <PopButton
              onClick={handleSave}
              disabled={saving || !contentType || (contentType !== "artwork" && (!targetRecordId || !targetField))}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              {contentType === "artwork" ? "Add to Artwork" : "Add to Content"}
            </PopButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
