import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Gift, DollarSign, User, Calendar } from "lucide-react";

const ContributionsManager = () => {
  const { data: contributions, isLoading } = useQuery({
    queryKey: ["admin-contributions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contributions")
        .select("*, profiles:user_id(display_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const totalAmount = contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display">Contributions</h1>
          <p className="text-muted-foreground">View supporter contributions and donations</p>
        </div>

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <ComicPanel className="p-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-pop-green" />
              <div>
                <p className="text-sm text-muted-foreground">Total Raised</p>
                <p className="text-2xl font-display">${totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </ComicPanel>
          <ComicPanel className="p-4">
            <div className="flex items-center gap-3">
              <Gift className="w-8 h-8 text-pop-pink" />
              <div>
                <p className="text-sm text-muted-foreground">Contributions</p>
                <p className="text-2xl font-display">{contributions?.length || 0}</p>
              </div>
            </div>
          </ComicPanel>
          <ComicPanel className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-pop-cyan" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Supporters</p>
                <p className="text-2xl font-display">
                  {new Set(contributions?.map((c) => c.user_id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </ComicPanel>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-muted" />
            ))}
          </div>
        ) : contributions && contributions.length > 0 ? (
          <ComicPanel className="divide-y-2 divide-foreground">
            {contributions.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    ${c.amount}
                  </div>
                  <div>
                    <p className="font-bold">
                      {(c.profiles as { display_name?: string })?.display_name || "Anonymous"}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">{c.contribution_type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {new Date(c.created_at).toLocaleDateString()}
                  </div>
                  {c.message && (
                    <p className="text-sm italic mt-1">"{c.message}"</p>
                  )}
                </div>
              </div>
            ))}
          </ComicPanel>
        ) : (
          <ComicPanel className="p-8 text-center">
            <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No contributions yet.</p>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default ContributionsManager;
