import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { PopButton } from "@/components/pop-art";
import { FileText, Loader2, Sparkles, Upload, X, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface BulkTextImporterProps {
  contentType: "project" | "product_review" | "experiment" | "article" | "client_project" | "favorite" | "inspiration" | "update" | "life_period";
  onImport: (data: Record<string, unknown>) => void;
  maxLength?: number;
}

const fieldMappings: Record<string, string[]> = {
  project: ["title", "description", "long_description", "tech_stack", "features", "problem_statement", "solution_summary", "case_study"],
  product_review: ["product_name", "company", "summary", "content", "strengths", "pain_points", "improvement_suggestions"],
  experiment: ["name", "description", "long_description", "platform", "management_info", "operation_details", "skills_demonstrated", "lessons_learned", "products_offered", "sample_reviews", "revenue", "costs", "case_study"],
  article: ["title", "excerpt", "content", "tags"],
  update: ["title", "excerpt", "content", "tags"],
  client_project: ["project_name", "client_name", "description", "long_description", "tech_stack", "features"],
  favorite: ["title", "description", "type", "creator_name", "impact_statement", "tags"],
  inspiration: ["title", "description", "detailed_content", "category", "influence_areas"],
  life_period: ["title", "description", "detailed_content", "themes", "start_date", "end_date"],
};

// Chunk text for large inputs
const chunkText = (text: string, maxChunkSize: number = 25000): string[] => {
  if (text.length <= maxChunkSize) return [text];
  
  const chunks: string[] = [];
  let currentIndex = 0;
  
  while (currentIndex < text.length) {
    let endIndex = currentIndex + maxChunkSize;
    
    // Try to break at a paragraph or sentence
    if (endIndex < text.length) {
      const lastParagraph = text.lastIndexOf("\n\n", endIndex);
      const lastSentence = text.lastIndexOf(". ", endIndex);
      
      if (lastParagraph > currentIndex + maxChunkSize * 0.5) {
        endIndex = lastParagraph + 2;
      } else if (lastSentence > currentIndex + maxChunkSize * 0.5) {
        endIndex = lastSentence + 2;
      }
    }
    
    chunks.push(text.slice(currentIndex, endIndex));
    currentIndex = endIndex;
  }
  
  return chunks;
};

// Merge results from multiple chunks
const mergeExtractedData = (results: Record<string, unknown>[]): Record<string, unknown> => {
  const merged: Record<string, unknown> = {};
  
  for (const result of results) {
    for (const [key, value] of Object.entries(result)) {
      if (value === null || value === undefined) continue;
      
      if (Array.isArray(value)) {
        const existing = (merged[key] as unknown[]) || [];
        merged[key] = [...existing, ...value];
      } else if (typeof value === "string" && value.trim()) {
        const existing = merged[key] as string;
        if (!existing) {
          merged[key] = value;
        } else if (value.length > existing.length) {
          merged[key] = value; // Keep longer version
        }
      } else if (typeof value === "number") {
        merged[key] = value; // Keep latest number
      }
    }
  }
  
  return merged;
};

export const BulkTextImporter = ({
  contentType,
  onImport,
  maxLength = 150000, // ~30,000 words
}: BulkTextImporterProps) => {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const supportedExtensions = [".txt", ".md", ".pdf", ".docx"];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    if (!supportedExtensions.includes(ext)) {
      toast.error("Please upload a .txt, .md, .pdf, or .docx file");
      return;
    }

    setUploadedFile(file);

    try {
      // Handle PDF and DOCX with a note about limitations
      if (ext === ".pdf" || ext === ".docx") {
        toast.info(`For ${ext} files, please copy and paste the text content directly for best results. File uploaded as reference.`);
        setUploadedFile(null);
        return;
      }

      const content = await file.text();
      if (content.length > maxLength) {
        toast.warning(`File content truncated to ${(maxLength / 1000).toFixed(0)}k characters`);
        setText(content.slice(0, maxLength));
      } else {
        setText(content);
      }
      toast.success("File content loaded");
    } catch {
      toast.error("Failed to read file");
      setUploadedFile(null);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      toast.error("Please paste some text to analyze");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);

    try {
      const fields = fieldMappings[contentType] || [];
      const chunks = chunkText(text);
      const results: Record<string, unknown>[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setProgress(((i + 1) / chunks.length) * 100);

        console.log(`[BulkTextImporter] Processing chunk ${i + 1}/${chunks.length}`);
        
        const { data, error } = await supabase.functions.invoke("generate-copy", {
          body: {
            type: "bulk_import",
            context: chunks[i],
            contentType,
            fields,
          },
        });

        console.log("[BulkTextImporter] API Response:", { data, error });

        if (error) {
          console.error("Chunk analysis error:", error);
          // Check for rate limit or payment errors
          if (error.message?.includes("429") || error.message?.includes("rate limit")) {
            toast.error("Rate limit exceeded. Please wait a moment and try again.");
            return;
          }
          if (error.message?.includes("402") || error.message?.includes("payment")) {
            toast.error("API credits exhausted. Please add funds to continue.");
            return;
          }
          throw error;
        }

        // Handle different response formats from the edge function
        let extractedData: Record<string, unknown> | null = null;
        
        if (data?.extracted && typeof data.extracted === "object") {
          extractedData = data.extracted;
          console.log("[BulkTextImporter] Found data.extracted:", extractedData);
        } else if (data?.content) {
          try {
            const parsed = JSON.parse(data.content);
            extractedData = parsed;
            console.log("[BulkTextImporter] Parsed data.content:", extractedData);
          } catch (parseError) {
            console.warn("[BulkTextImporter] Failed to parse data.content:", parseError);
          }
        } else if (data && typeof data === "object" && !data.error) {
          // The response might be the extracted data directly
          const possibleData = { ...data };
          delete possibleData.success;
          if (Object.keys(possibleData).length > 0) {
            extractedData = possibleData;
            console.log("[BulkTextImporter] Using response as extracted data:", extractedData);
          }
        }

        if (extractedData && Object.keys(extractedData).length > 0) {
          results.push(extractedData);
        } else {
          console.warn(`[BulkTextImporter] Chunk ${i + 1} returned no extractable data`);
        }
      }

      console.log("[BulkTextImporter] Total results:", results.length, results);

      if (results.length > 0) {
        const merged = mergeExtractedData(results);
        console.log("[BulkTextImporter] Merged data:", merged);
        
        // Check if we actually extracted meaningful data
        const extractedFieldCount = Object.keys(merged).filter(
          key => merged[key] !== null && merged[key] !== undefined && merged[key] !== ""
        ).length;
        
        if (extractedFieldCount === 0) {
          toast.warning("AI couldn't extract specific fields. Try providing more structured content.");
          return;
        }
        
        onImport(merged);
        toast.success(`Extracted ${extractedFieldCount} field(s) from ${chunks.length} chunk(s)!`);
        setText("");
        setUploadedFile(null);
        setIsOpen(false);
      } else {
        toast.error("No data could be extracted. Please ensure your text contains relevant information for this content type.");
      }
    } catch (error) {
      console.error("Bulk import error:", error);
      toast.error("Failed to analyze text. Please try again.");
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
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
        Paste up to ~30,000 words or upload a text file and AI will analyze it to auto-fill the form fields.
      </p>

      {/* File Upload */}
      <div className="mb-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".txt,.md,.pdf,.docx"
          className="hidden"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 text-sm border-2 border-foreground hover:bg-muted"
          >
            <FileUp className="w-4 h-4" />
            Upload File
          </button>
          {uploadedFile && (
            <div className="flex items-center gap-2 text-sm bg-muted px-3 py-1">
              <FileText className="w-4 h-4" />
              {uploadedFile.name}
              <button onClick={() => { setUploadedFile(null); setText(""); }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Supports .txt and .md files. For PDFs and Word docs, copy and paste text directly.
        </p>
      </div>

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

      {isAnalyzing && (
        <div className="mb-3">
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            Analyzing... {Math.round(progress)}%
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {text.length.toLocaleString()} / {maxLength.toLocaleString()} characters
          {text.length > 25000 && (
            <span className="ml-2 text-primary">
              (Will be processed in {chunkText(text).length} chunks)
            </span>
          )}
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
