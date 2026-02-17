import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PopButton } from "@/components/pop-art";
import { Check, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface EditResult {
  originalUrl: string;
  editedBlob: Blob;
  filename: string;
}

interface ImageEditPreviewProps {
  open: boolean;
  onClose: () => void;
  results: EditResult[];
  onApprove: (approved: EditResult[]) => void;
  isProcessing?: boolean;
  title?: string;
}

export const ImageEditPreview = ({
  open,
  onClose,
  results,
  onApprove,
  isProcessing = false,
  title = "Review Edits",
}: ImageEditPreviewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [approved, setApproved] = useState<Set<number>>(new Set());
  const [previewUrls, setPreviewUrls] = useState<Map<number, string>>(new Map());

  // Generate preview URLs for blobs
  useState(() => {
    const urls = new Map<number, string>();
    results.forEach((r, i) => {
      urls.set(i, URL.createObjectURL(r.editedBlob));
    });
    setPreviewUrls(urls);
    // Default: all approved
    setApproved(new Set(results.map((_, i) => i)));
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  });

  const toggleApproval = (index: number) => {
    setApproved((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleApproveAll = () => {
    const approvedResults = results.filter((_, i) => approved.has(i));
    onApprove(approvedResults);
  };

  const current = results[currentIndex];
  const previewUrl = previewUrls.get(currentIndex);

  if (results.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {isProcessing ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Processing images...</p>
          </div>
        ) : (
          <>
            {/* Before / After comparison */}
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
              <div className="space-y-2">
                <p className="text-sm font-bold text-center">Before</p>
                <div className="aspect-square bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] border-2 border-foreground overflow-hidden">
                  <img
                    src={current?.originalUrl}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-bold text-center">After</p>
                <div className="aspect-square bg-[repeating-conic-gradient(hsl(var(--muted))_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] border-2 border-primary overflow-hidden">
                  {previewUrl && (
                    <img
                      src={previewUrl}
                      alt="Edited"
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Navigation for batch */}
            {results.length > 1 && (
              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="p-2 border-2 border-foreground disabled:opacity-30 hover:bg-muted"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex gap-1">
                  {results.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentIndex(i)}
                      className={`w-3 h-3 border border-foreground ${
                        i === currentIndex ? "bg-primary" : approved.has(i) ? "bg-primary/40" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(results.length - 1, i + 1))}
                  disabled={currentIndex === results.length - 1}
                  className="p-2 border-2 border-foreground disabled:opacity-30 hover:bg-muted"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => toggleApproval(currentIndex)}
                  className={`px-3 py-1 text-sm font-bold border-2 border-foreground ${
                    approved.has(currentIndex) ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  {approved.has(currentIndex) ? (
                    <><Check className="w-3 h-3 inline mr-1" />Approved</>
                  ) : (
                    <><X className="w-3 h-3 inline mr-1" />Skipped</>
                  )}
                </button>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between items-center pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {approved.size} of {results.length} approved
              </span>
              <div className="flex gap-2">
                <PopButton variant="outline" onClick={onClose}>
                  Discard All
                </PopButton>
                <PopButton onClick={handleApproveAll} disabled={approved.size === 0}>
                  <Check className="w-4 h-4 mr-2" />
                  Save {approved.size} Edit{approved.size !== 1 ? "s" : ""}
                </PopButton>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
