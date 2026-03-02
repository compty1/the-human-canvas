import { useEffect } from "react";

interface PageMetaOptions {
  title?: string | null;
  description?: string | null;
  suffix?: string;
}

/**
 * Sets document.title and meta description dynamically.
 * Resets to defaults on unmount.
 */
export function usePageMeta({ title, description, suffix = "Zac Hatfield" }: PageMetaOptions) {
  useEffect(() => {
    const prevTitle = document.title;

    if (title) {
      const full = suffix ? `${title} | ${suffix}` : title;
      document.title = full.length > 60 ? full.slice(0, 57) + "..." : full;
    }

    if (description) {
      let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "description";
        document.head.appendChild(meta);
      }
      meta.content = description.length > 160 ? description.slice(0, 157) + "..." : description;
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, suffix]);
}
