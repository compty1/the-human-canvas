import { useEffect, useCallback } from "react";

interface UseEditorShortcutsOptions {
  onSave?: () => void;
  onSaveAndExit?: () => void;
  onTogglePublish?: () => void;
  onExit?: () => void;
  isDirty?: boolean;
  enabled?: boolean;
}

export const useEditorShortcuts = ({
  onSave,
  onSaveAndExit,
  onTogglePublish,
  onExit,
  isDirty = false,
  enabled = true,
}: UseEditorShortcutsOptions) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl+S or Cmd+S - Save
      if (isCtrlOrCmd && e.key === "s" && !e.shiftKey) {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Ctrl+Shift+S or Cmd+Shift+S - Save and exit
      if (isCtrlOrCmd && e.key === "s" && e.shiftKey) {
        e.preventDefault();
        onSaveAndExit?.();
        return;
      }

      // Ctrl+P or Cmd+P - Toggle publish (prevent print dialog)
      if (isCtrlOrCmd && e.key === "p") {
        e.preventDefault();
        onTogglePublish?.();
        return;
      }

      // Ctrl+Enter - Save and continue
      if (isCtrlOrCmd && e.key === "Enter") {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Escape - Exit with confirmation if dirty
      if (e.key === "Escape") {
        if (isDirty) {
          if (confirm("You have unsaved changes. Are you sure you want to leave?")) {
            onExit?.();
          }
        } else {
          onExit?.();
        }
        return;
      }
    },
    [onSave, onSaveAndExit, onTogglePublish, onExit, isDirty, enabled]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts: [
      { keys: "Ctrl+S", action: "Save" },
      { keys: "Ctrl+Shift+S", action: "Save & Exit" },
      { keys: "Ctrl+P", action: "Toggle Publish" },
      { keys: "Ctrl+Enter", action: "Save" },
      { keys: "Escape", action: "Exit" },
    ],
  };
};
