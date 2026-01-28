import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Check, AlertCircle, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImportRow {
  [key: string]: string;
}

const BulkImport = () => {
  const [contentType, setContentType] = useState<"artwork" | "articles" | "projects" | "updates">("artwork");
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const templates = {
    artwork: {
      columns: ["title", "image_url", "category", "description"],
      sample: `title,image_url,category,description
"My Artwork","https://example.com/image.jpg","portrait","A beautiful portrait"`,
    },
    articles: {
      columns: ["title", "slug", "category", "excerpt", "content", "tags"],
      sample: `title,slug,category,excerpt,content,tags
"My Article","my-article","philosophy","An excerpt","Full content here","tag1,tag2"`,
    },
    projects: {
      columns: ["title", "slug", "status", "description", "external_url", "tech_stack"],
      sample: `title,slug,status,description,external_url,tech_stack
"My Project","my-project","live","Description here","https://myproject.com","React,TypeScript"`,
    },
    updates: {
      columns: ["title", "slug", "excerpt", "content", "tags"],
      sample: `title,slug,excerpt,content,tags
"My Update","my-update","Quick update","Full content","update,news"`,
    },
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        
        if (selectedFile.name.endsWith(".json")) {
          const json = JSON.parse(text);
          setParsedData(Array.isArray(json) ? json : [json]);
        } else {
          // Parse CSV
          const lines = text.split("\n").filter(line => line.trim());
          if (lines.length < 2) {
            setErrors(["File must have header row and at least one data row"]);
            return;
          }

          const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ""));
          const data = lines.slice(1).map(line => {
            const values = line.match(/("([^"]*)"|[^,]+)/g) || [];
            const row: ImportRow = {};
            headers.forEach((header, i) => {
              row[header] = values[i]?.replace(/^"|"$/g, "").trim() || "";
            });
            return row;
          });

          setParsedData(data);
        }
      } catch (error) {
        setErrors(["Failed to parse file. Please check the format."]);
      }
    };

    reader.readAsText(selectedFile);
  };

  const downloadTemplate = () => {
    const template = templates[contentType];
    const blob = new Blob([template.sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${contentType}_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error("No data to import");
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setErrors([]);

    const newErrors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];
      
      try {
        let insertData: Record<string, unknown> = {};

        if (contentType === "artwork") {
          insertData = {
            title: row.title,
            image_url: row.image_url,
            category: row.category || "mixed",
            description: row.description || null,
          };
        } else if (contentType === "articles") {
          insertData = {
            title: row.title,
            slug: row.slug,
            category: row.category || "philosophy",
            excerpt: row.excerpt || null,
            content: row.content || null,
            tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : null,
          };
        } else if (contentType === "projects") {
          insertData = {
            title: row.title,
            slug: row.slug,
            status: row.status || "planned",
            description: row.description || null,
            external_url: row.external_url || null,
            tech_stack: row.tech_stack ? row.tech_stack.split(",").map((t: string) => t.trim()) : null,
          };
        } else if (contentType === "updates") {
          insertData = {
            title: row.title,
            slug: row.slug,
            excerpt: row.excerpt || null,
            content: row.content || null,
            tags: row.tags ? row.tags.split(",").map((t: string) => t.trim()) : null,
          };
        }

        const { error } = await supabase.from(contentType).insert(insertData as never);
        
        if (error) throw error;
        successCount++;
      } catch (error) {
        newErrors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      setImportProgress(Math.round(((i + 1) / parsedData.length) * 100));
    }

    setImporting(false);
    setErrors(newErrors);

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} items`);
      queryClient.invalidateQueries({ queryKey: [`admin-${contentType}`] });
    }

    if (newErrors.length > 0) {
      toast.error(`${newErrors.length} items failed to import`);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display">Bulk Import</h1>
          <p className="text-muted-foreground">Import multiple items at once from CSV or JSON files</p>
        </div>

        {/* Content Type Selection */}
        <ComicPanel className="p-6">
          <Label className="mb-4 block text-lg font-display">1. Select Content Type</Label>
          <div className="flex flex-wrap gap-3">
            {(["artwork", "articles", "projects", "updates"] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setContentType(type);
                  setParsedData([]);
                  setFile(null);
                  setErrors([]);
                }}
                className={`px-4 py-2 font-bold uppercase border-2 border-foreground transition-colors ${
                  contentType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="mt-4">
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 text-sm font-bold text-primary hover:underline"
            >
              <Download className="w-4 h-4" /> Download Template CSV
            </button>
            <p className="text-xs text-muted-foreground mt-1">
              Required columns: {templates[contentType].columns.join(", ")}
            </p>
          </div>
        </ComicPanel>

        {/* File Upload */}
        <ComicPanel className="p-6">
          <Label className="mb-4 block text-lg font-display">2. Upload File</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-foreground p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {file ? (
              <div>
                <p className="font-bold">{file.name}</p>
                <p className="text-sm text-muted-foreground">{parsedData.length} rows detected</p>
              </div>
            ) : (
              <div>
                <p className="font-bold">Click to upload CSV or JSON</p>
                <p className="text-sm text-muted-foreground">or drag and drop</p>
              </div>
            )}
          </div>
        </ComicPanel>

        {/* Preview */}
        {parsedData.length > 0 && (
          <ComicPanel className="p-6">
            <Label className="mb-4 block text-lg font-display">3. Preview Data</Label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-foreground">
                    {Object.keys(parsedData[0]).map((key) => (
                      <th key={key} className="text-left p-2 font-bold uppercase">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsedData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-muted">
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="p-2 max-w-xs truncate">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {parsedData.length > 5 && (
                <p className="text-sm text-muted-foreground mt-2">
                  ...and {parsedData.length - 5} more rows
                </p>
              )}
            </div>
          </ComicPanel>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <ComicPanel className="p-6 bg-destructive/10">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <Label className="text-lg font-display text-destructive">Errors</Label>
            </div>
            <ul className="space-y-1 text-sm">
              {errors.map((error, i) => (
                <li key={i} className="text-destructive">{error}</li>
              ))}
            </ul>
          </ComicPanel>
        )}

        {/* Import Button */}
        {parsedData.length > 0 && (
          <div className="space-y-4">
            {importing && (
              <div className="h-2 bg-muted border-2 border-foreground overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${importProgress}%` }}
                />
              </div>
            )}
            <PopButton onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing... {importProgress}%
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Import {parsedData.length} Items
                </>
              )}
            </PopButton>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default BulkImport;
