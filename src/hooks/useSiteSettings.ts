import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  layout_mobile_columns: "1" | "2";
  layout_hero_mobile: "show" | "hide";
  layout_sticky_filters: "sticky" | "scroll";
  default_theme: "light" | "dark" | "system";
}

const DEFAULTS: SiteSettings = {
  layout_mobile_columns: "1",
  layout_hero_mobile: "show",
  layout_sticky_filters: "sticky",
  default_theme: "system",
};

const SETTING_KEYS = [
  "layout_mobile_columns",
  "layout_hero_mobile",
  "layout_sticky_filters",
  "default_theme",
];

export function useSiteSettings() {
  const { data: settings = DEFAULTS } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value")
        .in("section_key", SETTING_KEYS);
      if (error) return DEFAULTS;

      const map = (data || []).reduce((acc, item) => {
        acc[item.section_key] = item.content_value || "";
        return acc;
      }, {} as Record<string, string>);

      return {
        layout_mobile_columns: (map.layout_mobile_columns || DEFAULTS.layout_mobile_columns) as SiteSettings["layout_mobile_columns"],
        layout_hero_mobile: (map.layout_hero_mobile || DEFAULTS.layout_hero_mobile) as SiteSettings["layout_hero_mobile"],
        layout_sticky_filters: (map.layout_sticky_filters || DEFAULTS.layout_sticky_filters) as SiteSettings["layout_sticky_filters"],
        default_theme: (map.default_theme || DEFAULTS.default_theme) as SiteSettings["default_theme"],
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  return settings;
}
