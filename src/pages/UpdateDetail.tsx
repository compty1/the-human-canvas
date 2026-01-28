import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, LikeButton, PopButton } from "@/components/pop-art";
import { RichTextContent } from "@/components/editor/RichTextContent";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar, Tag, ArrowLeft, Edit } from "lucide-react";
import { format } from "date-fns";

const UpdateDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  const { data: update, isLoading } = useQuery({
    queryKey: ["update", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
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

  const { data: recentUpdates } = useQuery({
    queryKey: ["recent-updates", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("updates")
        .select("id, title, slug, created_at")
        .eq("published", true)
        .neq("slug", slug)
        .order("created_at", { ascending: false })
        .limit(3);

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-3xl mx-auto">
            <div className="h-12 bg-muted animate-pulse mb-4" />
            <div className="h-8 bg-muted animate-pulse mb-8 w-1/3" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-4 bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!update) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-display mb-4">Update Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This update doesn't exist or has been removed.
          </p>
          <Link to="/updates">
            <PopButton>Back to Updates</PopButton>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            {/* Back Link */}
            <Link
              to="/updates"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Updates
            </Link>

            {/* Header */}
            <ComicPanel className="p-8 mb-8">
              <div className="flex justify-between items-start mb-4">
                <div className="caption-box">Quick Note</div>
                {isAdmin && (
                  <Link to={`/admin/updates/${update.id}/edit`}>
                    <PopButton size="sm" variant="outline">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </PopButton>
                  </Link>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-display mb-6">
                {update.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(update.created_at), "MMMM d, yyyy")}
                </span>
                {update.tags && update.tags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {update.tags.join(", ")}
                  </span>
                )}
              </div>
            </ComicPanel>

            {/* Content */}
            <div className="mb-12">
              {update.content ? (
                <RichTextContent content={update.content} />
              ) : (
                <p className="text-muted-foreground italic">
                  No content available.
                </p>
              )}
            </div>

            {/* Like Button */}
            <div className="flex justify-center mb-16">
              <LikeButton
                count={liked ? 1 : 0}
                liked={liked}
                onLike={() => setLiked(!liked)}
              />
            </div>

            {/* More Updates */}
            {recentUpdates && recentUpdates.length > 0 && (
              <section className="border-t-4 border-foreground pt-12">
                <h2 className="text-2xl font-display mb-6">More Updates</h2>
                <div className="space-y-4">
                  {recentUpdates.map((item) => (
                    <Link
                      key={item.id}
                      to={`/updates/${item.slug}`}
                      className="block p-4 border-2 border-foreground hover:bg-muted transition-colors"
                    >
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(item.created_at), "MMM d, yyyy")}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </article>
    </Layout>
  );
};

export default UpdateDetail;
