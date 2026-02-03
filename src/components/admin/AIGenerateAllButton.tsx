import { useState } from "react";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { PopButton } from "@/components/pop-art";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "array";
  contextFields?: string[];
}

interface AIGenerateAllButtonProps {
  form: Record<string, unknown>;
  fields: FieldConfig[];
  contentType: string;
  onUpdate: (updates: Record<string, unknown>) => void;
}

export const AIGenerateAllButton = ({
  form,
  fields,
  contentType,
  onUpdate,
}: AIGenerateAllButtonProps) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [generatedFields, setGeneratedFields] = useState<Record<string, unknown>>({});
  const [currentField, setCurrentField] = useState<string | null>(null);

  // Find empty fields that can be generated
  const emptyFields = fields.filter((field) => {
    const value = form[field.key];
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === "string") return !value.trim();
    return !value;
  });

  const handleGenerate = async () => {
    if (emptyFields.length === 0) {
      toast.info("All fields are already filled!");
      return;
    }

    setGenerating(true);
    setProgress({ current: 0, total: emptyFields.length });
    const generated: Record<string, unknown> = {};

    // Build context from filled fields
    const context = Object.entries(form)
      .filter(([_, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === "string") return value.trim().length > 0;
        return !!value;
      })
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join("\n");

    for (let i = 0; i < emptyFields.length; i++) {
      const field = emptyFields[i];
      setCurrentField(field.label);
      setProgress({ current: i + 1, total: emptyFields.length });

      try {
        const prompt = buildPrompt(field, contentType, context);
        
        const { data, error } = await supabase.functions.invoke("generate-copy", {
          body: {
            prompt,
            field: field.key,
            type: field.type === "array" ? "array" : "text",
          },
        });

        if (error) throw error;

        if (data?.content) {
          generated[field.key] = field.type === "array" 
            ? parseArrayContent(data.content) 
            : data.content;
        }
      } catch (error) {
        console.error(`Failed to generate ${field.key}:`, error);
      }
    }

    setGeneratedFields(generated);
    setCurrentField(null);
    setGenerating(false);
  };

  const buildPrompt = (field: FieldConfig, contentType: string, context: string): string => {
    const basePrompt = `Generate content for the "${field.label}" field of a ${contentType}.`;
    const contextPrompt = context ? `\n\nExisting content for context:\n${context}` : "";
    
    const typeInstructions = field.type === "array" 
      ? "\n\nProvide a comma-separated list of items." 
      : "\n\nProvide a concise, engaging response.";

    return basePrompt + contextPrompt + typeInstructions;
  };

  const parseArrayContent = (content: string): string[] => {
    return content
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const handleApply = () => {
    onUpdate(generatedFields);
    toast.success(`Applied ${Object.keys(generatedFields).length} generated fields`);
    setOpen(false);
    setGeneratedFields({});
  };

  const handleCancel = () => {
    setOpen(false);
    setGeneratedFields({});
  };

  if (emptyFields.length === 0) {
    return null;
  }

  return (
    <>
      <PopButton
        variant="secondary"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        Generate All ({emptyFields.length})
      </PopButton>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Generate All Empty Fields</DialogTitle>
            <DialogDescription>
              AI will generate content for the following fields based on existing data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {emptyFields.map((field) => {
              const isGenerated = field.key in generatedFields;
              const isCurrent = currentField === field.label;

              return (
                <div
                  key={field.key}
                  className="flex items-center gap-3 p-2 border border-border rounded"
                >
                  {generating && isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : isGenerated ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span className={isCurrent ? "font-bold" : ""}>{field.label}</span>
                </div>
              );
            })}
          </div>

          {generating && (
            <div className="text-sm text-center text-muted-foreground">
              Generating {progress.current} of {progress.total}...
            </div>
          )}

          <DialogFooter>
            {Object.keys(generatedFields).length > 0 ? (
              <>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border-2 border-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <PopButton onClick={handleApply}>
                  <Check className="w-4 h-4 mr-2" />
                  Apply All
                </PopButton>
              </>
            ) : (
              <>
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border-2 border-foreground hover:bg-muted"
                  disabled={generating}
                >
                  Cancel
                </button>
                <PopButton onClick={handleGenerate} disabled={generating}>
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </>
                  )}
                </PopButton>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
