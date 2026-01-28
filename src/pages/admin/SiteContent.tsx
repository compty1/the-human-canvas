import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SiteContentItem {
  section_key: string;
  content_value: string | null;
  content_type: string;
  notes?: string | null;
}

const SiteContent = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    site_title: "LeCompte",
    site_tagline: "Exploring the human experience through art, technology, and words.",
    contact_email: "",
    footer_text: "Made with love exploring the human experience",
    nav_items: "",
    social_twitter: "",
    social_instagram: "",
    social_github: "",
    social_linkedin: "",
  });

  const { data: content, isLoading } = useQuery({
    queryKey: ["site-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value, content_type, notes");
      if (error) throw error;
      return data as SiteContentItem[];
    },
  });

  useEffect(() => {
    if (content) {
      const contentMap = content.reduce((acc, item) => {
        acc[item.section_key] = item.content_value || "";
        return acc;
      }, {} as Record<string, string>);

      setForm(prev => ({
        ...prev,
        site_title: contentMap.site_title || prev.site_title,
        site_tagline: contentMap.site_tagline || prev.site_tagline,
        contact_email: contentMap.contact_email || prev.contact_email,
        footer_text: contentMap.footer_text || prev.footer_text,
        nav_items: contentMap.nav_items || prev.nav_items,
        social_twitter: contentMap.social_twitter || prev.social_twitter,
        social_instagram: contentMap.social_instagram || prev.social_instagram,
        social_github: contentMap.social_github || prev.social_github,
        social_linkedin: contentMap.social_linkedin || prev.social_linkedin,
      }));
    }
  }, [content]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = Object.entries(form);
      
      for (const [key, value] of entries) {
        const { error } = await supabase
          .from("site_content")
          .upsert({
            section_key: key,
            content_value: value,
            content_type: "text",
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "section_key",
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Site content saved");
    },
    onError: (error) => {
      toast.error("Failed to save content");
      console.error(error);
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-display">Site Settings</h1>
            <p className="text-muted-foreground">Manage global site content and settings</p>
          </div>
          <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </PopButton>
        </div>

        {/* Branding */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Branding</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="site_title">Site Title</Label>
              <Input
                id="site_title"
                value={form.site_title}
                onChange={(e) => setForm(prev => ({ ...prev, site_title: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="site_tagline">Tagline</Label>
              <Textarea
                id="site_tagline"
                value={form.site_tagline}
                onChange={(e) => setForm(prev => ({ ...prev, site_tagline: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
        </ComicPanel>

        {/* Contact */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Contact Information</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="contact_email">Contact Email</Label>
              <Input
                id="contact_email"
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm(prev => ({ ...prev, contact_email: e.target.value }))}
                placeholder="hello@example.com"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Social Links */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Social Links</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="social_twitter">Twitter/X</Label>
              <Input
                id="social_twitter"
                value={form.social_twitter}
                onChange={(e) => setForm(prev => ({ ...prev, social_twitter: e.target.value }))}
                placeholder="https://twitter.com/username"
              />
            </div>
            <div>
              <Label htmlFor="social_instagram">Instagram</Label>
              <Input
                id="social_instagram"
                value={form.social_instagram}
                onChange={(e) => setForm(prev => ({ ...prev, social_instagram: e.target.value }))}
                placeholder="https://instagram.com/username"
              />
            </div>
            <div>
              <Label htmlFor="social_github">GitHub</Label>
              <Input
                id="social_github"
                value={form.social_github}
                onChange={(e) => setForm(prev => ({ ...prev, social_github: e.target.value }))}
                placeholder="https://github.com/username"
              />
            </div>
            <div>
              <Label htmlFor="social_linkedin">LinkedIn</Label>
              <Input
                id="social_linkedin"
                value={form.social_linkedin}
                onChange={(e) => setForm(prev => ({ ...prev, social_linkedin: e.target.value }))}
                placeholder="https://linkedin.com/in/username"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Footer */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Footer</h2>
          <div>
            <Label htmlFor="footer_text">Footer Text</Label>
            <Input
              id="footer_text"
              value={form.footer_text}
              onChange={(e) => setForm(prev => ({ ...prev, footer_text: e.target.value }))}
            />
          </div>
        </ComicPanel>
      </div>
    </AdminLayout>
  );
};

export default SiteContent;
