import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileText, Plus, Loader2 } from "lucide-react";

interface TemplateSelectorProps {
  contentType: string;
  onSelect: (templateData: Record<string, unknown>) => void;
  trigger?: React.ReactNode;
}

export const TemplateSelector = ({
  contentType,
  onSelect,
  trigger,
}: TemplateSelectorProps) => {
  const [open, setOpen] = useState(false);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["content-templates", contentType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_templates")
        .select("*")
        .eq("content_type", contentType)
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleSelect = (template: { template_data: unknown }) => {
    onSelect(template.template_data as Record<string, unknown>);
    setOpen(false);
  };

  const handleStartBlank = () => {
    onSelect({});
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-foreground hover:bg-muted transition-colors">
            <FileText className="w-4 h-4" />
            Use Template
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {/* Blank option */}
          <button
            onClick={handleStartBlank}
            className="w-full p-4 border-2 border-foreground hover:bg-muted transition-colors text-left flex items-center gap-3"
          >
            <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold">Start Blank</p>
              <p className="text-sm text-muted-foreground">
                Begin with an empty form
              </p>
            </div>
          </button>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : templates && templates.length > 0 ? (
            templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`w-full p-4 border-2 border-foreground hover:bg-muted transition-colors text-left flex items-center gap-3 ${
                  template.is_default ? "bg-pop-yellow/10" : ""
                }`}
              >
                <div className="w-10 h-10 border-2 border-foreground flex items-center justify-center bg-background">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{template.name}</p>
                    {template.is_default && (
                      <span className="px-2 py-0.5 text-xs font-bold bg-pop-yellow">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pre-filled template for {contentType}
                  </p>
                </div>
              </button>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No templates available for this content type
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

interface SaveAsTemplateButtonProps {
  contentType: string;
  formData: Record<string, unknown>;
  onSaved?: () => void;
}

export const SaveAsTemplateButton = ({
  contentType,
  formData,
  onSaved,
}: SaveAsTemplateButtonProps) => {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase.from("content_templates").insert({
        name: name.trim(),
        content_type: contentType,
        template_data: formData as Json,
        is_default: false,
      });

      if (error) throw error;

      setOpen(false);
      setName("");
      onSaved?.();
    } catch (error) {
      console.error("Failed to save template:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm border-2 border-foreground hover:bg-muted transition-colors">
          <FileText className="w-4 h-4" />
          Save as Template
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Template</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-bold block mb-1">Template Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Custom Template"
              className="w-full px-3 py-2 border-2 border-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setOpen(false)}
              className="px-4 py-2 border-2 border-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-primary text-primary-foreground border-2 border-foreground font-bold disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save Template"
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
