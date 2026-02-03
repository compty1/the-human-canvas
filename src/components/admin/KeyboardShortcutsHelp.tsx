import { Keyboard } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ShortcutItem {
  keys: string;
  action: string;
}

const EDITOR_SHORTCUTS: ShortcutItem[] = [
  { keys: "Ctrl+S", action: "Save" },
  { keys: "Ctrl+Shift+S", action: "Save & Exit" },
  { keys: "Ctrl+P", action: "Toggle Publish" },
  { keys: "Ctrl+Z", action: "Undo" },
  { keys: "Ctrl+Shift+Z", action: "Redo" },
  { keys: "Escape", action: "Exit" },
];

const GLOBAL_SHORTCUTS: ShortcutItem[] = [
  { keys: "Ctrl+K", action: "Command Palette" },
];

export const KeyboardShortcutsHelp = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="p-2 hover:bg-muted rounded text-muted-foreground">
            <Keyboard className="w-4 h-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="w-64 p-3">
          <div className="space-y-3">
            <div>
              <h4 className="font-bold text-xs uppercase mb-2">Editor</h4>
              <div className="space-y-1">
                {EDITOR_SHORTCUTS.map((s) => (
                  <div key={s.keys} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s.action}</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase mb-2">Global</h4>
              <div className="space-y-1">
                {GLOBAL_SHORTCUTS.map((s) => (
                  <div key={s.keys} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{s.action}</span>
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
