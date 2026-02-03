import { useState, useEffect, useCallback, useRef } from "react";

interface DraftData<T> {
  data: T;
  timestamp: number;
}

interface UseAutosaveOptions<T> {
  key: string;
  data: T;
  interval?: number; // default 30000ms (30 seconds)
  enabled?: boolean;
}

interface UseAutosaveReturn<T> {
  hasDraft: boolean;
  draftData: T | null;
  draftTimestamp: Date | null;
  restoreDraft: () => T | null;
  discardDraft: () => void;
  clearDraft: () => void;
  saveNow: () => void;
}

export function useAutosave<T>({
  key,
  data,
  interval = 30000,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveReturn<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const [draftData, setDraftData] = useState<T | null>(null);
  const [draftTimestamp, setDraftTimestamp] = useState<Date | null>(null);
  const dataRef = useRef(data);
  const initialLoadRef = useRef(true);

  // Keep dataRef in sync
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const storageKey = `autosave_${key}`;

  // Load existing draft on mount
  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: DraftData<T> = JSON.parse(stored);
        setDraftData(parsed.data);
        setDraftTimestamp(new Date(parsed.timestamp));
        setHasDraft(true);
      }
    } catch (e) {
      console.error("Failed to load autosave draft:", e);
    }
    initialLoadRef.current = false;
  }, [storageKey, enabled]);

  // Save draft periodically
  useEffect(() => {
    if (!enabled || initialLoadRef.current) return;

    const saveInterval = setInterval(() => {
      try {
        const draftToSave: DraftData<T> = {
          data: dataRef.current,
          timestamp: Date.now(),
        };
        localStorage.setItem(storageKey, JSON.stringify(draftToSave));
      } catch (e) {
        console.error("Failed to autosave draft:", e);
      }
    }, interval);

    return () => clearInterval(saveInterval);
  }, [storageKey, interval, enabled]);

  const restoreDraft = useCallback((): T | null => {
    if (draftData) {
      setHasDraft(false);
      return draftData;
    }
    return null;
  }, [draftData]);

  const discardDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setDraftData(null);
      setDraftTimestamp(null);
    } catch (e) {
      console.error("Failed to discard draft:", e);
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setDraftData(null);
      setDraftTimestamp(null);
    } catch (e) {
      console.error("Failed to clear draft:", e);
    }
  }, [storageKey]);

  const saveNow = useCallback(() => {
    try {
      const draftToSave: DraftData<T> = {
        data: dataRef.current,
        timestamp: Date.now(),
      };
      localStorage.setItem(storageKey, JSON.stringify(draftToSave));
    } catch (e) {
      console.error("Failed to save draft:", e);
    }
  }, [storageKey]);

  return {
    hasDraft,
    draftData,
    draftTimestamp,
    restoreDraft,
    discardDraft,
    clearDraft,
    saveNow,
  };
}
