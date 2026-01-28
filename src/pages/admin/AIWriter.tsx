import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Copy, Check, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

const AIWriter = () => {
  const [contentType, setContentType] = useState("project_description");
  const [context, setContext] = useState("");
  const [tone, setTone] = useState("professional");
  const [length, setLength] = useState("standard");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const contentTypes = [
    { id: "project_description", label: "Project Description" },
    { id: "article_excerpt", label: "Article Excerpt" },
    { id: "artwork_description", label: "Artwork Description" },
    { id: "about_section", label: "About Section" },
    { id: "update_post", label: "Update Post" },
    { id: "product_review", label: "Product Review" },
    { id: "custom", label: "Custom Content" },
  ];

  const tones = [
    { id: "professional", label: "Professional" },
    { id: "creative", label: "Creative" },
    { id: "casual", label: "Casual" },
    { id: "technical", label: "Technical" },
  ];

  const lengths = [
    { id: "brief", label: "Brief (1-2 sentences)" },
    { id: "standard", label: "Standard (paragraph)" },
    { id: "detailed", label: "Detailed (multiple paragraphs)" },
  ];

  const generateCopy = async () => {
    if (!context.trim()) {
      toast.error("Please provide some context");
      return;
    }

    setGenerating(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("generate-copy", {
        body: {
          type: contentType,
          context,
          tone,
          length,
          variations: 3,
        },
      });

      if (error) throw error;

      if (data?.variations && Array.isArray(data.variations)) {
        setResults(data.variations);
      } else if (data?.content) {
        setResults([data.content]);
      }

      toast.success("Copy generated!");
    } catch (error) {
      toast.error("Failed to generate copy");
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display">AI Writer</h1>
          <p className="text-muted-foreground">Generate copy for your portfolio using AI</p>
        </div>

        {/* Configuration */}
        <ComicPanel className="p-6">
          <div className="grid gap-6">
            {/* Content Type */}
            <div>
              <Label className="mb-2 block">Content Type</Label>
              <div className="flex flex-wrap gap-2">
                {contentTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setContentType(type.id)}
                    className={`px-3 py-2 text-sm font-bold border-2 border-foreground transition-colors ${
                      contentType === type.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tone */}
            <div>
              <Label className="mb-2 block">Tone</Label>
              <div className="flex flex-wrap gap-2">
                {tones.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-2 text-sm font-bold border-2 border-foreground transition-colors ${
                      tone === t.id
                        ? "bg-pop-cyan"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Length */}
            <div>
              <Label className="mb-2 block">Length</Label>
              <div className="flex flex-wrap gap-2">
                {lengths.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setLength(l.id)}
                    className={`px-3 py-2 text-sm font-bold border-2 border-foreground transition-colors ${
                      length === l.id
                        ? "bg-pop-yellow"
                        : "bg-background hover:bg-muted"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Context */}
            <div>
              <Label className="mb-2 block">Context / What to Write About</Label>
              <Textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Describe what you want to generate. Include relevant details like project name, features, target audience, key points to highlight..."
                rows={5}
              />
            </div>

            {/* Generate Button */}
            <div>
              <PopButton onClick={generateCopy} disabled={generating}>
                {generating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Copy
              </PopButton>
            </div>
          </div>
        </ComicPanel>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display">Generated Variations</h2>
              <button 
                onClick={generateCopy} 
                disabled={generating}
                className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
              >
                <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                Regenerate
              </button>
            </div>

            {results.map((result, index) => (
              <ComicPanel key={index} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-grow">
                    <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
                      Variation {index + 1}
                    </div>
                    <p className="font-sans whitespace-pre-wrap">{result}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(result, index)}
                    className="p-2 hover:bg-muted rounded flex-shrink-0"
                  >
                    {copiedIndex === index ? (
                      <Check className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </ComicPanel>
            ))}
          </div>
        )}

        {/* Tips */}
        <ComicPanel className="p-6 bg-muted/50">
          <h3 className="font-display text-lg mb-3">Tips for Better Results</h3>
          <ul className="text-sm font-sans space-y-2 text-muted-foreground">
            <li>• Be specific about your target audience and goals</li>
            <li>• Include key features or points you want highlighted</li>
            <li>• Mention any specific keywords or phrases to include</li>
            <li>• For project descriptions, include the problem it solves</li>
            <li>• Try different tones to see what fits best</li>
          </ul>
        </ComicPanel>
      </div>
    </AdminLayout>
  );
};

export default AIWriter;
