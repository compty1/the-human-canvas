import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ThemePreset {
  name: string;
  colors: Record<string, string>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Gallery Warmth",
    colors: {
      "pop-gold": "38 78% 56%",
      "pop-teal": "180 50% 32%",
      "pop-terracotta": "15 55% 50%",
      "pop-cream": "45 50% 95%",
      "pop-navy": "210 40% 17%",
      primary: "38 78% 56%",
      secondary: "180 50% 32%",
      accent: "15 55% 50%",
    },
  },
  {
    name: "Monochrome",
    colors: {
      "pop-gold": "0 0% 40%",
      "pop-teal": "0 0% 25%",
      "pop-terracotta": "0 0% 50%",
      "pop-cream": "0 0% 96%",
      "pop-navy": "0 0% 12%",
      primary: "0 0% 40%",
      secondary: "0 0% 25%",
      accent: "0 0% 50%",
    },
  },
  {
    name: "Ocean",
    colors: {
      "pop-gold": "45 80% 55%",
      "pop-teal": "195 70% 40%",
      "pop-terracotta": "200 60% 50%",
      "pop-cream": "200 30% 96%",
      "pop-navy": "210 50% 15%",
      primary: "195 70% 40%",
      secondary: "45 80% 55%",
      accent: "200 60% 50%",
    },
  },
  {
    name: "Sunset",
    colors: {
      "pop-gold": "35 90% 55%",
      "pop-teal": "340 50% 45%",
      "pop-terracotta": "15 70% 55%",
      "pop-cream": "35 40% 96%",
      "pop-navy": "280 30% 15%",
      primary: "35 90% 55%",
      secondary: "340 50% 45%",
      accent: "15 70% 55%",
    },
  },
];

export function useThemeColors() {
  const { data: themeColors } = useQuery({
    queryKey: ["site-content-theme-colors"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("content_value")
        .eq("section_key", "theme_colors")
        .single();
      if (error) return null;
      try {
        return JSON.parse(data?.content_value || "null");
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!themeColors) return;
    const root = document.documentElement;
    
    const colorMap: Record<string, string> = themeColors;
    Object.entries(colorMap).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value as string);
    });
  }, [themeColors]);

  return { themeColors };
}
