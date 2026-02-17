import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIGenerateButtonProps {
  fieldName: string;
  fieldLabel: string;
  contentType: string;
  context: Record<string, unknown>;
  currentValue?: string;
  onGenerated: (value: string) => void;
  className?: string;
  variant?: "default" | "small";
}

const fieldPrompts: Record<string, string> = {
  description: "Write a compelling 1-2 sentence description",
  long_description: "Write a detailed 2-3 paragraph description",
  detailed_content: "Write comprehensive, engaging long-form content (3-5 paragraphs)",
  excerpt: "Write a brief teaser excerpt (under 160 characters)",
  impact_statement: "Write a personal impact statement explaining how this influenced you",
  problem_statement: "Describe the problem this project solves",
  solution_summary: "Summarize how this project solves the problem",
  content: "Write engaging content",
  childhood_impact: "Describe what this instilled or taught during childhood",
};

// Map contentType to DB table name for fetching siblings
const contentTypeToTable: Record<string, string> = {
  article: "articles", articles: "articles",
  project: "projects", projects: "projects",
  experiment: "experiments", experiments: "experiments",
  experience: "experiences", experiences: "experiences",
  favorite: "favorites", favorites: "favorites",
  inspiration: "inspirations", inspirations: "inspirations",
  life_period: "life_periods", life_periods: "life_periods",
  certification: "certifications", certifications: "certifications",
  product_review: "product_reviews", product_reviews: "product_reviews",
  client_project: "client_projects", client_projects: "client_projects",
  artwork: "artwork",
  product: "products", products: "products",
  update: "updates", updates: "updates",
};

export const AIGenerateButton = ({
  fieldName,
  fieldLabel,
  contentType,
  context,
  currentValue,
  onGenerated,
  className,
  variant = "default",
}: AIGenerateButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const prompt = fieldPrompts[fieldName] || `Generate content for ${fieldLabel}`;
      const contextStr = Object.entries(context)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${typeof v === "string" ? v : JSON.stringify(v)}`)
        .join("\n");

      // Fetch sibling content for style/tone reference
      let siblingContext = "";
      const tableName = contentTypeToTable[contentType];
      if (tableName) {
        try {
          const titleField = ["experiments", "products", "artwork"].includes(tableName) ? "name" : "title";
          const selectFields = `id, ${titleField}, description`;
          const { data: siblings } = await (supabase.from(tableName as any) as any)
            .select(selectFields)
            .order("created_at", { ascending: false })
            .limit(5);
          if (siblings && siblings.length > 0) {
            siblingContext = "\n\nExisting content in this section (for tone/style reference):\n" +
              siblings.map((s: any) => `- "${s[titleField] || s.name || s.title}": ${s.description || "(no description)"}`).join("\n");
          }
        } catch { /* ignore */ }
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [
            {
              role: "user",
              content: `${prompt} for this ${contentType}.\n\nContext:\n${contextStr}${siblingContext}\n\nGenerate only the ${fieldLabel} content, nothing else. Be concise and impactful. Match the tone of existing content.`,
            },
          ],
          context: contextStr + siblingContext,
          contentType,
        },
      });

      if (error) throw error;

      const generatedContent = data?.content || data?.message;
      if (generatedContent) {
        onGenerated(generatedContent.trim());
        toast.success(`${fieldLabel} generated!`);
      } else {
        toast.error("No content generated");
      }
    } catch (error) {
      console.error("AI generation error:", error);
      toast.error("Failed to generate content");
    } finally {
      setIsGenerating(false);
    }
  };

  const hasContent = currentValue && currentValue.trim().length > 0;
  const Icon = hasContent ? RefreshCw : Sparkles;
  const label = hasContent ? "Regenerate" : "Generate";

  if (variant === "small") {
    return (
      <button
        type="button"
        onClick={handleGenerate}
        disabled={isGenerating}
        className={cn(
          "inline-flex items-center gap-1 text-xs text-primary hover:underline disabled:opacity-50",
          className
        )}
        title={`${label} ${fieldLabel}`}
      >
        {isGenerating ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Icon className="w-3 h-3" />
        )}
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isGenerating}
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      {label} {fieldLabel}
    </button>
  );
};
