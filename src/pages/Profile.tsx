import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Save, User, Mail, Heart } from "lucide-react";
import { toast } from "sonner";
import { Navigate, Link } from "react-router-dom";

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    display_name: "",
    avatar_url: "",
    show_on_thank_you_wall: false,
  });

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: contributions } = useQuery({
    queryKey: ["user-contributions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contributions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        display_name: profile.display_name || "",
        avatar_url: profile.avatar_url || "",
        show_on_thank_you_wall: profile.show_on_thank_you_wall || false,
      });
    }
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from("profiles")
        .upsert({
          user_id: user.id,
          display_name: form.display_name || null,
          avatar_url: form.avatar_url || null,
          show_on_thank_you_wall: form.show_on_thank_you_wall,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated!");
    },
    onError: (error) => {
      toast.error("Failed to save profile");
      console.error(error);
    },
  });

  if (authLoading) {
    return (
      <Layout>
        <div className="animate-pulse text-center py-20">Loading...</div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse text-center py-20">Loading profile...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-4xl font-display mb-8">Your Profile</h1>

        <ComicPanel className="p-6 mb-6">
          <div className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input value={user.email || ""} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>

            {/* Avatar */}
            <ImageUploader
              value={form.avatar_url}
              onChange={(url) => setForm((prev) => ({ ...prev, avatar_url: url }))}
              label="Profile Picture"
              folder="avatars"
            />

            {/* Display Name */}
            <div>
              <Label htmlFor="display_name" className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Display Name
              </Label>
              <Input
                id="display_name"
                value={form.display_name}
                onChange={(e) => setForm((prev) => ({ ...prev, display_name: e.target.value }))}
                placeholder="Your display name"
              />
            </div>

            {/* Thank You Wall Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="thank-you-wall" className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Show on Thank You Wall
                </Label>
                <p className="text-xs text-muted-foreground">Display your name on the supporters wall</p>
              </div>
              <Switch
                id="thank-you-wall"
                checked={form.show_on_thank_you_wall}
                onCheckedChange={(checked) =>
                  setForm((prev) => ({ ...prev, show_on_thank_you_wall: checked }))
                }
              />
            </div>
          </div>
        </ComicPanel>

        {/* Save Button */}
        <PopButton
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="mb-8"
        >
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Saving..." : "Save Profile"}
        </PopButton>

        {/* Contributions */}
        {contributions && contributions.length > 0 && (
          <ComicPanel className="p-6">
            <h2 className="text-2xl font-display mb-4">Your Contributions</h2>
            <div className="space-y-3">
              {contributions.map((c) => (
                <div key={c.id} className="flex justify-between items-center p-3 bg-muted">
                  <div>
                    <span className="font-bold">${c.amount}</span>
                    <span className="text-muted-foreground ml-2">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm capitalize">{c.contribution_type}</span>
                </div>
              ))}
            </div>
          </ComicPanel>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
