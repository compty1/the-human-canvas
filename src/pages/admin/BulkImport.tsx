import { useState, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Upload, Check, AlertCircle, Download, Loader2, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface ImportRow {
  [key: string]: string;
}

interface ParsedFile {
  name: string;
  data: ImportRow[];
  error?: string;
}

const BulkImport = () => {
  const [contentType, setContentType] = useState<"artwork" | "articles" | "projects" | "updates">("artwork");
  const [files, setFiles] = useState<File[]>([]);
  const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
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

  const parseCSV = (text: string, fileName: string): ParsedFile => {
    try {
      // Handle all line endings: Windows (\r\n), old Mac (\r), Unix (\n)
      const lines = text.split(/\r?\n|\r/).filter(line => line.trim());
      
      if (lines.length < 2) {
        return { name: fileName, data: [], error: "File must have header row and at least one data row" };
      }

      // Parse header row - handle quoted values
      const headers = parseCSVLine(lines[0]);
      
      if (headers.length === 0) {
        return { name: fileName, data: [], error: "Could not parse header row" };
      }

      // Parse data rows
      const data: ImportRow[] = [];
      const parseErrors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        
        // Skip empty rows
        if (values.length === 0 || (values.length === 1 && !values[0])) {
          continue;
        }

        // Validate field count
        if (values.length !== headers.length) {
          parseErrors.push(`Row ${i + 1}: Expected ${headers.length} fields, got ${values.length}`);
          continue;
        }

        const row: ImportRow = {};
        headers.forEach((header, j) => {
          row[header] = values[j] || "";
        });
        data.push(row);
      }

      // Validate reasonable data count
      if (data.length > 1000) {
        return { name: fileName, data: [], error: "Too many rows (max 1000). Please split into multiple files." };
      }

      if (parseErrors.length > 0 && data.length === 0) {
        return { name: fileName, data: [], error: parseErrors.join("; ") };
      }

      return { name: fileName, data };
    } catch (error) {
      return { name: fileName, data: [], error: "Failed to parse CSV file" };
    }
  };

  // Proper CSV line parser that handles quoted fields with commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const fileArray = Array.from(selectedFiles);
    setFiles(fileArray);
    setErrors([]);
    setParsedFiles([]);

    const newParsedFiles: ParsedFile[] = [];
    const newErrors: string[] = [];

    for (const file of fileArray) {
      // Check for Excel files
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        newErrors.push(`${file.name}: Excel files (.xlsx/.xls) are not supported. Please export as CSV first.`);
        continue;
      }

      try {
        const text = await file.text();

        if (file.name.endsWith(".json")) {
          try {
            const json = JSON.parse(text);
            const data = Array.isArray(json) ? json : [json];
            
            if (data.length > 1000) {
              newErrors.push(`${file.name}: Too many items (max 1000)`);
              continue;
            }
            
            newParsedFiles.push({ name: file.name, data });
          } catch {
            newErrors.push(`${file.name}: Invalid JSON format`);
          }
        } else {
          // Parse as CSV
          const parsed = parseCSV(text, file.name);
          if (parsed.error) {
            newErrors.push(`${file.name}: ${parsed.error}`);
          } else if (parsed.data.length > 0) {
            newParsedFiles.push(parsed);
          }
        }
      } catch (error) {
        newErrors.push(`${file.name}: Failed to read file`);
      }
    }

    setParsedFiles(newParsedFiles);
    setErrors(newErrors);

    // Reset file input to allow re-selecting same files
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

  const getTotalRows = () => {
    return parsedFiles.reduce((sum, file) => sum + file.data.length, 0);
  };

  const handleImport = async () => {
    const totalRows = getTotalRows();
    if (totalRows === 0) {
      toast.error("No data to import");
      return;
    }

    setImporting(true);
    setImportProgress(0);
    setErrors([]);

    const newErrors: string[] = [];
    let successCount = 0;
    let processedCount = 0;

    // Flatten all data from all files
    const allData: ImportRow[] = parsedFiles.flatMap(f => f.data);

    for (let i = 0; i < allData.length; i++) {
      const row = allData[i];
      
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

      processedCount++;
      setImportProgress(Math.round((processedCount / allData.length) * 100));
    }

    setImporting(false);
    setErrors(newErrors);

    if (successCount > 0) {
      toast.success(`Successfully imported ${successCount} items`);
      queryClient.invalidateQueries({ queryKey: [`admin-${contentType}`] });
      setParsedFiles([]);
      setFiles([]);
    }

    if (newErrors.length > 0) {
      toast.error(`${newErrors.length} items failed to import`);
    }
  };

  const clearFiles = () => {
    setFiles([]);
    setParsedFiles([]);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
                  clearFiles();
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
          <Label className="mb-4 block text-lg font-display">2. Upload Files</Label>
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-foreground p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              multiple
              onChange={handleFilesChange}
              className="hidden"
            />
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            {files.length > 0 ? (
              <div>
                <p className="font-bold">{files.length} file{files.length > 1 ? "s" : ""} selected</p>
                <p className="text-sm text-muted-foreground">{getTotalRows()} total rows detected</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); clearFiles(); }}
                  className="mt-2 text-sm text-destructive hover:underline"
                >
                  Clear selection
                </button>
              </div>
            ) : (
              <div>
                <p className="font-bold">Click to upload CSV or JSON files</p>
                <p className="text-sm text-muted-foreground">Select multiple files at once</p>
              </div>
            )}
          </div>
        </ComicPanel>

        {/* Parsed Files Summary */}
        {parsedFiles.length > 0 && (
          <ComicPanel className="p-6">
            <Label className="mb-4 block text-lg font-display">3. Files Ready to Import</Label>
            <div className="space-y-2 mb-4">
              {parsedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="font-bold">{file.name}</span>
                  <span className="text-muted-foreground">({file.data.length} rows)</span>
                </div>
              ))}
            </div>

            {/* Preview first file's data */}
            {parsedFiles[0]?.data.length > 0 && (
              <div className="overflow-x-auto">
                <p className="text-sm text-muted-foreground mb-2">Preview ({parsedFiles[0].name}):</p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-foreground">
                      {Object.keys(parsedFiles[0].data[0]).map((key) => (
                        <th key={key} className="text-left p-2 font-bold uppercase">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedFiles[0].data.slice(0, 3).map((row, i) => (
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
                {parsedFiles[0].data.length > 3 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    ...and {parsedFiles[0].data.length - 3} more rows in this file
                  </p>
                )}
              </div>
            )}
          </ComicPanel>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <ComicPanel className="p-6 bg-destructive/10">
            <div className="flex items-center gap-2 mb-4">
              <FileWarning className="w-5 h-5 text-destructive" />
              <Label className="text-lg font-display text-destructive">Issues Found</Label>
            </div>
            <ul className="space-y-1 text-sm">
              {errors.slice(0, 10).map((error, i) => (
                <li key={i} className="text-destructive">{error}</li>
              ))}
              {errors.length > 10 && (
                <li className="text-destructive font-bold">...and {errors.length - 10} more errors</li>
              )}
            </ul>
          </ComicPanel>
        )}

        {/* Import Button */}
        {getTotalRows() > 0 && (
          <div className="space-y-4">
            {importing && (
              <div className="space-y-2">
                <Progress value={importProgress} className="h-3" />
                <p className="text-sm text-muted-foreground text-center">
                  Importing... {importProgress}%
                </p>
              </div>
            )}
            <PopButton onClick={handleImport} disabled={importing} className="w-full">
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing... {importProgress}%
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Import {getTotalRows()} Items
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
