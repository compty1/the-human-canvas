import { useState, useCallback, useEffect } from "react";

interface UseFormHistoryReturn<T> {
  current: T;
  setCurrent: (value: T | ((prev: T) => T)) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  pushState: (state: T) => void;
  reset: (initialState: T) => void;
}

export function useFormHistory<T>(initialState: T): UseFormHistoryReturn<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const current = history[currentIndex];

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback((newState: T) => {
    setHistory(prev => {
      // Remove any future states when adding new state
      const newHistory = prev.slice(0, currentIndex + 1);
      return [...newHistory, newState];
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const setCurrent = useCallback((value: T | ((prev: T) => T)) => {
    const newValue = typeof value === "function" 
      ? (value as (prev: T) => T)(history[currentIndex])
      : value;
    pushState(newValue);
  }, [history, currentIndex, pushState]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [canRedo]);

  const reset = useCallback((initialState: T) => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey && canRedo) {
          redo();
        } else if (!e.shiftKey && canUndo) {
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return {
    current,
    setCurrent,
    canUndo,
    canRedo,
    undo,
    redo,
    pushState,
    reset,
  };
}
