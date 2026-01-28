import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, LikeButton, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Tag, Plus } from "lucide-react";
import { format } from "date-fns";

interface Update {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  tags: string[] | null;
  published: boolean | null;
  created_at: string;
}

const Updates = () => {
  const { user } = useAuth();
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  const { data: updates, isLoading } = useQuery({
    queryKey: ["updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Update[];
    },
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      if (error) return false;
      return data;
    },
    enabled: !!user,
  });

  const toggleLike = (id: string) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="caption-box inline-block mb-4">Quick Notes</div>
              <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
                Updates
              </h1>
              <p className="text-xl font-sans max-w-2xl text-muted-foreground">
                Short-form thoughts, observations, work-in-progress notes, and
                commentary on topics that catch my attention.
              </p>
            </div>
            {isAdmin && (
              <Link to="/admin/updates/new">
                <PopButton size="sm" variant="primary">
                  <Plus className="w-4 h-4 mr-1" />
                  New Update
                </PopButton>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Updates Feed */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-48 bg-muted border-4 border-foreground animate-pulse"
                />
              ))}
            </div>
          ) : updates && updates.length > 0 ? (
            <div className="space-y-8 max-w-3xl mx-auto">
              {updates.map((update, index) => (
                <ComicPanel
                  key={update.id}
                  className={`p-6 animate-fade-in stagger-${(index % 5) + 1}`}
                >
                  <Link to={`/updates/${update.slug}`}>
                    <h2 className="text-2xl font-display mb-3 hover:text-primary transition-colors">
                      {update.title}
                    </h2>
                  </Link>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(update.created_at), "MMM d, yyyy")}
                    </span>
                    {update.tags && update.tags.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-4 h-4" />
                        {update.tags.slice(0, 3).join(", ")}
                      </span>
                    )}
                  </div>

                  {update.excerpt && (
                    <p className="text-muted-foreground font-sans mb-4">
                      {update.excerpt}
                    </p>
                  )}

                  <div className="flex justify-between items-center">
                    <Link
                      to={`/updates/${update.slug}`}
                      className="font-bold text-primary hover:underline"
                    >
                      Read more →
                    </Link>
                    <LikeButton
                      count={likedItems.has(update.id) ? 1 : 0}
                      liked={likedItems.has(update.id)}
                      onLike={() => toggleLike(update.id)}
                    />
                  </div>
                </ComicPanel>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="speech-bubble inline-block">
                <p className="text-xl">No updates yet. Check back soon!</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default Updates;
