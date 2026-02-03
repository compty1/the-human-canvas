import { Undo2, Redo2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  className?: string;
}

export const UndoRedoControls = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  className,
}: UndoRedoControlsProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <button
        type="button"
        onClick={onUndo}
        disabled={!canUndo}
        className={cn(
          "p-2 border-2 border-foreground transition-colors",
          canUndo
            ? "hover:bg-muted cursor-pointer"
            : "opacity-40 cursor-not-allowed bg-muted/50"
        )}
        title="Undo (Ctrl+Z)"
        aria-label="Undo"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={onRedo}
        disabled={!canRedo}
        className={cn(
          "p-2 border-2 border-foreground transition-colors",
          canRedo
            ? "hover:bg-muted cursor-pointer"
            : "opacity-40 cursor-not-allowed bg-muted/50"
        )}
        title="Redo (Ctrl+Shift+Z)"
        aria-label="Redo"
      >
        <Redo2 className="w-4 h-4" />
      </button>
    </div>
  );
};
