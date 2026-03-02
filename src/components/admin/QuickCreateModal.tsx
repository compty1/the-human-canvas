import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PopButton } from "@/components/pop-art";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { ADMIN_ROUTES } from "@/lib/adminRoutes";

interface ContentTypeConfig {
  label: string;
  table: string;
  titleField: string;
  slugField?: boolean;
  defaults: Record<string, any>;
}

const CONTENT_TYPES: ContentTypeConfig[] = [
  { label: "Article", table: "articles", titleField: "title", slugField: true, defaults: { category: "narrative", published: false } },
  { label: "Update", table: "updates", titleField: "title", slugField: true, defaults: { published: false } },
  { label: "Project", table: "projects", titleField: "title", slugField: true, defaults: { published: false, status: "planned" } },
  { label: "Experiment", table: "experiments", titleField: "name", slugField: true, defaults: { status: "active", platform: "other" } },
  { label: "Product Review", table: "product_reviews", titleField: "product_name", slugField: true, defaults: { published: false, company: "TBD" } },
  { label: "Artwork", table: "artwork", titleField: "title", defaults: { image_url: "/placeholder.svg" } },
  { label: "Favorite", table: "favorites", titleField: "title", defaults: { type: "other" } },
  { label: "Inspiration", table: "inspirations", titleField: "title", defaults: { category: "general" } },
  { label: "Experience", table: "experiences", titleField: "title", slugField: true, defaults: { category: "other" } },
  { label: "Certification", table: "certifications", titleField: "name", defaults: { issuer: "TBD" } },
  { label: "Client Project", table: "client_projects", titleField: "project_name", slugField: true, defaults: { client_name: "TBD", status: "in_progress" } },
  { label: "Life Period", table: "life_periods", titleField: "title", defaults: { start_date: new Date().toISOString().split("T")[0] } },
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface QuickCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuickCreateModal = ({ open, onOpenChange }: QuickCreateModalProps) => {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string>("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (open) {
      setSelectedType("");
      setTitle("");
    }
  }, [open]);

  const config = CONTENT_TYPES.find((t) => t.table === selectedType);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!config) throw new Error("No type selected");
      const record: Record<string, any> = {
        [config.titleField]: title,
        ...config.defaults,
      };
      if (config.slugField) {
        record.slug = slugify(title) + "-" + Date.now().toString(36);
      }
      const { data, error } = await supabase
        .from(config.table as any)
        .insert(record)
        .select("id")
        .single() as { data: { id: string } | null; error: any };
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`${config?.label} created!`);
      onOpenChange(false);
      // Navigate to editor if available
      const route = ADMIN_ROUTES[config!.table];
      if (route && data?.id) {
        navigate(route.editor(data.id));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quick Create</DialogTitle>
          <DialogDescription>Create a new draft record and jump to the editor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label>Content Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map((t) => (
                  <SelectItem key={t.table} value={t.table}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedType && (
            <div className="space-y-1.5">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Enter ${config?.label.toLowerCase()} title...`}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && title.trim()) {
                    e.preventDefault();
                    createMutation.mutate();
                  }
                }}
              />
            </div>
          )}

          <PopButton
            onClick={() => createMutation.mutate()}
            disabled={!selectedType || !title.trim() || createMutation.isPending}
            className="w-full"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create & Edit
          </PopButton>
        </div>
      </DialogContent>
    </Dialog>
  );
};
