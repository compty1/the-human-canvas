import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

interface DraftRecoveryBannerProps {
  timestamp: Date;
  onRestore: () => void;
  onDiscard: () => void;
}

export const DraftRecoveryBanner = ({
  timestamp,
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) => {
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <div className="bg-pop-yellow/20 border-2 border-pop-yellow p-4 flex items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-3">
        <AlertTriangle className="w-5 h-5 text-pop-yellow flex-shrink-0" />
        <div>
          <p className="font-bold text-sm">Unsaved draft found</p>
          <p className="text-xs text-muted-foreground">
            Last saved {timeAgo}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onRestore}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold bg-pop-yellow text-foreground border-2 border-foreground hover:bg-pop-yellow/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Restore Draft
        </button>
        <button
          onClick={onDiscard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-bold bg-background border-2 border-foreground hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
          Discard
        </button>
      </div>
    </div>
  );
};
