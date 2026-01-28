import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { RichTextEditor } from "@/components/editor";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";

const AboutContent = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    profile_image: "",
    bio_intro: "",
    bio_full: "",
    services: [] as string[],
    interests: [] as string[],
    speech_bubble_quote: "",
    location: "",
    experience_years: "",
  });
  const [newService, setNewService] = useState("");
  const [newInterest, setNewInterest] = useState("");

  const { data: content, isLoading } = useQuery({
    queryKey: ["about-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("section_key, content_value")
        .in("section_key", [
          "profile_image",
          "bio_intro",
          "bio_full",
          "about_services",
          "about_interests",
          "speech_bubble_quote",
          "about_location",
          "experience_years"
        ]);
      if (error) throw error;
      return data;
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
        profile_image: contentMap.profile_image || prev.profile_image,
        bio_intro: contentMap.bio_intro || prev.bio_intro,
        bio_full: contentMap.bio_full || prev.bio_full,
        services: contentMap.about_services ? JSON.parse(contentMap.about_services) : prev.services,
        interests: contentMap.about_interests ? JSON.parse(contentMap.about_interests) : prev.interests,
        speech_bubble_quote: contentMap.speech_bubble_quote || prev.speech_bubble_quote,
        location: contentMap.about_location || prev.location,
        experience_years: contentMap.experience_years || prev.experience_years,
      }));
    }
  }, [content]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const entries = [
        { key: "profile_image", value: form.profile_image, type: "image" },
        { key: "bio_intro", value: form.bio_intro, type: "text" },
        { key: "bio_full", value: form.bio_full, type: "rich_text" },
        { key: "about_services", value: JSON.stringify(form.services), type: "json" },
        { key: "about_interests", value: JSON.stringify(form.interests), type: "json" },
        { key: "speech_bubble_quote", value: form.speech_bubble_quote, type: "text" },
        { key: "about_location", value: form.location, type: "text" },
        { key: "experience_years", value: form.experience_years, type: "text" },
      ];
      
      for (const entry of entries) {
        const { error } = await supabase
          .from("site_content")
          .upsert({
            section_key: entry.key,
            content_value: entry.value,
            content_type: entry.type as "text" | "rich_text" | "json" | "image",
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "section_key",
          });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["about-content"] });
      toast.success("About content saved");
    },
    onError: (error) => {
      toast.error("Failed to save content");
      console.error(error);
    },
  });

  const addService = () => {
    if (newService.trim()) {
      setForm(prev => ({ ...prev, services: [...prev.services, newService.trim()] }));
      setNewService("");
    }
  };

  const removeService = (index: number) => {
    setForm(prev => ({ ...prev, services: prev.services.filter((_, i) => i !== index) }));
  };

  const addInterest = () => {
    if (newInterest.trim()) {
      setForm(prev => ({ ...prev, interests: [...prev.interests, newInterest.trim()] }));
      setNewInterest("");
    }
  };

  const removeInterest = (index: number) => {
    setForm(prev => ({ ...prev, interests: prev.interests.filter((_, i) => i !== index) }));
  };

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
            <h1 className="text-4xl font-display">About Page Content</h1>
            <p className="text-muted-foreground">Manage your bio, services, and interests</p>
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

        {/* Profile Image */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Profile Image</h2>
          <ImageUploader
            value={form.profile_image}
            onChange={(url) => setForm(prev => ({ ...prev, profile_image: url }))}
            label="Profile Photo"
            folder="profile"
          />
        </ComicPanel>

        {/* Bio */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Biography</h2>
          <div className="grid gap-4">
            <div>
              <Label htmlFor="bio_intro">Short Intro</Label>
              <Textarea
                id="bio_intro"
                value={form.bio_intro}
                onChange={(e) => setForm(prev => ({ ...prev, bio_intro: e.target.value }))}
                rows={3}
                placeholder="A brief introduction..."
              />
            </div>
            <div>
              <Label>Full Biography</Label>
              <RichTextEditor
                content={form.bio_full}
                onChange={(content) => setForm(prev => ({ ...prev, bio_full: content }))}
                placeholder="Write your full bio here..."
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={form.location}
                  onChange={(e) => setForm(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Los Angeles, CA"
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  value={form.experience_years}
                  onChange={(e) => setForm(prev => ({ ...prev, experience_years: e.target.value }))}
                  placeholder="10+"
                />
              </div>
            </div>
          </div>
        </ComicPanel>

        {/* Speech Bubble Quote */}
        <ComicPanel className="p-6 bg-pop-yellow/20">
          <h2 className="text-xl font-display mb-4">Speech Bubble Quote</h2>
          <Textarea
            value={form.speech_bubble_quote}
            onChange={(e) => setForm(prev => ({ ...prev, speech_bubble_quote: e.target.value }))}
            rows={2}
            placeholder="A memorable quote or tagline..."
          />
        </ComicPanel>

        {/* Services */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Services Offered</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.services.map((service, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 border-2 border-primary font-bold text-sm">
                {service}
                <button onClick={() => removeService(index)} className="hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              placeholder="Add service..."
              onKeyDown={(e) => e.key === "Enter" && addService()}
            />
            <PopButton onClick={addService}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>

        {/* Interests */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Areas of Interest</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {form.interests.map((interest, index) => (
              <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-pop-cyan/20 border-2 border-pop-cyan font-bold text-sm">
                {interest}
                <button onClick={() => removeInterest(index)} className="hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              placeholder="Add interest..."
              onKeyDown={(e) => e.key === "Enter" && addInterest()}
            />
            <PopButton onClick={addInterest}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
        </ComicPanel>
      </div>
    </AdminLayout>
  );
};

export default AboutContent;
