import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { PopButton } from "@/components/pop-art";
import { FileText, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface BulkTextImporterProps {
  contentType: "project" | "product_review" | "experiment" | "article" | "client_project" | "favorite" | "inspiration";
  onImport: (data: Record<string, unknown>) => void;
  maxLength?: number;
}

const fieldMappings: Record<string, string[]> = {
  project: ["title", "description", "long_description", "tech_stack", "features", "problem_statement", "solution_summary"],
  product_review: ["product_name", "company", "summary", "content", "strengths", "pain_points", "improvement_suggestions"],
  experiment: ["name", "description", "long_description", "platform", "management_info", "operation_details", "skills_demonstrated", "lessons_learned", "products_offered", "sample_reviews", "revenue", "costs"],
  article: ["title", "excerpt", "content", "tags"],
  client_project: ["project_name", "client_name", "description", "long_description", "tech_stack", "features"],
  favorite: ["title", "description", "type", "creator_name", "impact_statement", "tags"],
  inspiration: ["title", "description", "detailed_content", "category", "influence_areas"],
};

export const BulkTextImporter = ({
  contentType,
  onImport,
  maxLength = 30000,
}: BulkTextImporterProps) => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Please paste some text to analyze");
      return;
    }

    setIsAnalyzing(true);
    try {
      const fields = fieldMappings[contentType] || [];
      
      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          type: "bulk_import",
          context: text,
          contentType,
          fields,
        },
      });

      if (error) throw error;

      if (data?.extracted) {
        onImport(data.extracted);
        toast.success("Content analyzed and fields populated!");
        setText("");
        setIsOpen(false);
      } else if (data?.content) {
        // Fallback - try to parse JSON from content
        try {
          const parsed = JSON.parse(data.content);
          onImport(parsed);
          toast.success("Content analyzed and fields populated!");
          setText("");
          setIsOpen(false);
        } catch {
          toast.error("Could not parse AI response. Please try again.");
        }
      } else {
        toast.error("No data extracted. Please try with more detailed text.");
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      toast.error("Failed to analyze text. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 text-sm text-primary hover:underline"
      >
        <FileText className="w-4 h-4" />
        Import from text (up to {(maxLength / 1000).toFixed(0)}k characters)
      </button>
    );
  }

  return (
    <div className="border-2 border-dashed border-primary/50 p-4 bg-primary/5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          Bulk Text Import
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      
      <p className="text-sm text-muted-foreground mb-3">
        Paste information about this {contentType.replace("_", " ")} and AI will analyze it to auto-fill the form fields.
      </p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, maxLength))}
        placeholder={`Paste all available information about this ${contentType.replace("_", " ")} here...
        
Include details like:
${fieldMappings[contentType]?.slice(0, 5).join(", ")}...

The AI will extract and organize the information into the appropriate fields.`}
        rows={10}
        className="mb-3"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {text.length.toLocaleString()} / {maxLength.toLocaleString()} characters
        </span>
        <PopButton
          onClick={handleAnalyze}
          disabled={isAnalyzing || !text.trim()}
          size="sm"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Analyze & Auto-Fill
            </>
          )}
        </PopButton>
      </div>
    </div>
  );
};
