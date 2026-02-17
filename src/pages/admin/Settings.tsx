import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { THEME_PRESETS } from "@/hooks/useThemeColors";
import { Save, Download, Key, Loader2, Palette, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

const COLOR_FIELDS = [
  { key: "pop-gold", label: "Gold (Primary)" },
  { key: "pop-teal", label: "Teal (Secondary)" },
  { key: "pop-terracotta", label: "Terracotta (Accent)" },
  { key: "pop-cream", label: "Cream (Background)" },
  { key: "pop-navy", label: "Navy (Foreground)" },
];

// Convert HSL string "38 78% 56%" to hex for color picker
function hslToHex(hsl: string): string {
  const parts = hsl.match(/[\d.]+/g);
  if (!parts || parts.length < 3) return "#888888";
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;
  const a2 = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const color = l - a2 * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// Convert hex to HSL string
function hexToHsl(hex: string): string {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

const Settings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Theme colors state
  const [themeColors, setThemeColors] = useState<Record<string, string>>({
    "pop-gold": "38 78% 56%",
    "pop-teal": "180 50% 32%",
    "pop-terracotta": "15 55% 50%",
    "pop-cream": "45 50% 95%",
    "pop-navy": "210 40% 17%",
  });

  // Layout settings
  const [layoutSettings, setLayoutSettings] = useState({
    default_theme: "system",
    layout_mobile_columns: "1",
    layout_hero_mobile: "show",
    layout_sticky_filters: "sticky",
  });

  // Load existing settings
  const { data: existingSettings } = useQuery({
    queryKey: ["admin-settings-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value")
        .in("section_key", [
          "theme_colors", "default_theme",
          "layout_mobile_columns", "layout_hero_mobile", "layout_sticky_filters",
        ]);
      if (error) return [];
      return data || [];
    },
  });

  useEffect(() => {
    if (existingSettings) {
      const map = existingSettings.reduce((acc, item) => {
        acc[item.section_key] = item.content_value || "";
        return acc;
      }, {} as Record<string, string>);

      if (map.theme_colors) {
        try {
          setThemeColors(JSON.parse(map.theme_colors));
        } catch { /* keep defaults */ }
      }
      setLayoutSettings(prev => ({
        ...prev,
        default_theme: map.default_theme || prev.default_theme,
        layout_mobile_columns: map.layout_mobile_columns || prev.layout_mobile_columns,
        layout_hero_mobile: map.layout_hero_mobile || prev.layout_hero_mobile,
        layout_sticky_filters: map.layout_sticky_filters || prev.layout_sticky_filters,
      }));
    }
  }, [existingSettings]);

  const saveThemeMutation = useMutation({
    mutationFn: async () => {
      const fullColors = {
        ...themeColors,
        primary: themeColors["pop-gold"],
        secondary: themeColors["pop-teal"],
        accent: themeColors["pop-terracotta"],
      };

      const entries = [
        { key: "theme_colors", value: JSON.stringify(fullColors), type: "json" },
        { key: "default_theme", value: layoutSettings.default_theme, type: "text" },
        { key: "layout_mobile_columns", value: layoutSettings.layout_mobile_columns, type: "text" },
        { key: "layout_hero_mobile", value: layoutSettings.layout_hero_mobile, type: "text" },
        { key: "layout_sticky_filters", value: layoutSettings.layout_sticky_filters, type: "text" },
      ];

      for (const entry of entries) {
        const { error } = await supabase
          .from("site_content")
          .upsert({
            section_key: entry.key,
            content_value: entry.value,
            content_type: entry.type as "text" | "json" | "rich_text" | "image",
            updated_at: new Date().toISOString(),
          }, { onConflict: "section_key" });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content-theme-colors"] });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      queryClient.invalidateQueries({ queryKey: ["admin-settings-all"] });
      toast.success("Settings saved — theme will update on next page load");
    },
    onError: () => toast.error("Failed to save settings"),
  });

  const applyPreset = (preset: typeof THEME_PRESETS[0]) => {
    const newColors: Record<string, string> = {};
    COLOR_FIELDS.forEach(({ key }) => {
      if (preset.colors[key]) newColors[key] = preset.colors[key];
    });
    setThemeColors(prev => ({ ...prev, ...newColors }));
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully");
      setNewPassword("");
      setConfirmPassword("");
    } catch { toast.error("Failed to update password"); }
    finally { setChangingPassword(false); }
  };

  const exportAllData = async () => {
    setExporting(true);
    try {
      const tables = ["projects", "articles", "updates", "artwork", "skills", "learning_goals", "admin_notes"];
      const exportData: Record<string, unknown[]> = {};
      for (const table of tables) {
        const { data, error } = await supabase.from(table as "projects").select("*");
        if (error) throw error;
        exportData[table] = data || [];
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch { toast.error("Failed to export data"); }
    finally { setExporting(false); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display">Settings</h1>
            <p className="text-muted-foreground">Manage your account, theme, and layout</p>
          </div>
          <PopButton onClick={() => saveThemeMutation.mutate()} disabled={saveThemeMutation.isPending}>
            {saveThemeMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save All
          </PopButton>
        </div>

        {/* Account Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-bold">{user?.email || "Not logged in"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <p className="text-sm font-mono text-muted-foreground">{user?.id || "N/A"}</p>
            </div>
          </div>
        </ComicPanel>

        {/* Theme Colors */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5" />
            <h2 className="text-xl font-display">Theme Colors</h2>
          </div>

          {/* Presets */}
          <div className="mb-6">
            <Label className="text-muted-foreground mb-2 block">Quick Presets</Label>
            <div className="flex flex-wrap gap-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => applyPreset(preset)}
                  className="px-3 py-2 border-2 border-foreground font-bold text-sm hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {Object.values(preset.colors).slice(0, 5).map((c, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 border border-foreground/30"
                          style={{ background: `hsl(${c})` }}
                        />
                      ))}
                    </div>
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Color Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {COLOR_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={hslToHex(themeColors[key] || "0 0% 50%")}
                  onChange={(e) => setThemeColors(prev => ({ ...prev, [key]: hexToHsl(e.target.value) }))}
                  className="w-10 h-10 border-2 border-foreground cursor-pointer"
                />
                <div>
                  <p className="font-bold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground font-mono">{themeColors[key]}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Live Preview */}
          <div className="mt-4 p-4 border-2 border-foreground">
            <p className="text-sm font-bold mb-2">Preview</p>
            <div className="flex gap-2">
              {COLOR_FIELDS.map(({ key }) => (
                <div
                  key={key}
                  className="w-12 h-12 border-2 border-foreground"
                  style={{ background: `hsl(${themeColors[key]})` }}
                />
              ))}
            </div>
          </div>
        </ComicPanel>

        {/* Default Theme */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Monitor className="w-5 h-5" />
            <h2 className="text-xl font-display">Default Theme</h2>
          </div>
          <div className="flex gap-2">
            {["light", "dark", "system"].map((t) => (
              <button
                key={t}
                onClick={() => setLayoutSettings(prev => ({ ...prev, default_theme: t }))}
                className={`px-4 py-2 border-2 font-bold text-sm capitalize transition-colors ${
                  layoutSettings.default_theme === t
                    ? "border-primary bg-primary/10"
                    : "border-foreground hover:bg-muted"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </ComicPanel>

        {/* Mobile Layout */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Smartphone className="w-5 h-5" />
            <h2 className="text-xl font-display">Mobile Layout</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Card Columns on Mobile</p>
                <p className="text-xs text-muted-foreground">1 column or 2 columns for card grids</p>
              </div>
              <div className="flex gap-2">
                {["1", "2"].map((v) => (
                  <button
                    key={v}
                    onClick={() => setLayoutSettings(prev => ({ ...prev, layout_mobile_columns: v }))}
                    className={`px-3 py-1 border-2 font-bold text-sm ${
                      layoutSettings.layout_mobile_columns === v
                        ? "border-primary bg-primary/10"
                        : "border-foreground"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Hero on Mobile</p>
                <p className="text-xs text-muted-foreground">Show or hide hero images on small screens</p>
              </div>
              <Switch
                checked={layoutSettings.layout_hero_mobile === "show"}
                onCheckedChange={(c) => setLayoutSettings(prev => ({ ...prev, layout_hero_mobile: c ? "show" : "hide" }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">Sticky Filters</p>
                <p className="text-xs text-muted-foreground">Keep filter bars fixed while scrolling</p>
              </div>
              <Switch
                checked={layoutSettings.layout_sticky_filters === "sticky"}
                onCheckedChange={(c) => setLayoutSettings(prev => ({ ...prev, layout_sticky_filters: c ? "sticky" : "scroll" }))}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Change Password */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" />
            <h2 className="text-xl font-display">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" />
            </div>
            <PopButton onClick={handlePasswordChange} disabled={changingPassword || !newPassword || !confirmPassword}>
              {changingPassword ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Update Password
            </PopButton>
          </div>
        </ComicPanel>

        {/* Data Export */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" />
            <h2 className="text-xl font-display">Export Data</h2>
          </div>
          <p className="text-muted-foreground mb-4">Download all your content as a JSON file.</p>
          <PopButton onClick={exportAllData} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export All Data
          </PopButton>
        </ComicPanel>

        {/* Danger Zone */}
        <ComicPanel className="p-6 border-destructive">
          <h2 className="text-xl font-display text-destructive mb-4">Danger Zone</h2>
          <p className="text-muted-foreground mb-4">These actions are irreversible. Please be careful.</p>
          <p className="text-sm text-muted-foreground">Contact support if you need to delete your account or perform other destructive actions.</p>
        </ComicPanel>
      </div>
    </AdminLayout>
  );
};

export default Settings;
