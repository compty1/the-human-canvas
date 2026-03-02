import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Search, Mail, Loader2, Trash2, CheckCircle, XCircle, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  source: string | null;
  confirmed: boolean | null;
  subscribed_at: string | null;
  unsubscribed_at: string | null;
}

const SubscribersManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: subscribers = [], isLoading } = useQuery({
    queryKey: ["admin-subscribers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) throw error;
      return data as Subscriber[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_subscribers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-subscribers"] });
      toast.success("Subscriber removed");
    },
  });

  const filtered = subscribers.filter(
    (sub) =>
      !search ||
      sub.email.toLowerCase().includes(search.toLowerCase()) ||
      (sub.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = subscribers.filter((s) => !s.unsubscribed_at).length;
  const confirmedCount = subscribers.filter((s) => s.confirmed).length;

  const exportCsv = () => {
    const rows = [
      ["Email", "Name", "Source", "Confirmed", "Subscribed At"],
      ...subscribers
        .filter((s) => !s.unsubscribed_at)
        .map((s) => [
          s.email,
          s.name || "",
          s.source || "",
          s.confirmed ? "Yes" : "No",
          s.subscribed_at || "",
        ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display">Email Subscribers</h1>
            <p className="text-muted-foreground">
              {activeCount} active · {confirmedCount} confirmed
            </p>
          </div>
          <PopButton onClick={exportCsv}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </PopButton>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search subscribers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Subscribers</h3>
            <p className="text-muted-foreground">
              {search ? "No subscribers match your search" : "No email subscribers yet"}
            </p>
          </ComicPanel>
        ) : (
          <div className="space-y-2">
            {filtered.map((sub) => (
              <ComicPanel key={sub.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Status */}
                  {sub.unsubscribed_at ? (
                    <XCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                  ) : sub.confirmed ? (
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}

                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold truncate">{sub.email}</span>
                      {sub.name && (
                        <span className="text-sm text-muted-foreground">({sub.name})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {sub.source && <span>Source: {sub.source}</span>}
                      {sub.subscribed_at && (
                        <span>
                          Joined {format(new Date(sub.subscribed_at), "MMM d, yyyy")}
                        </span>
                      )}
                      {sub.unsubscribed_at && (
                        <span className="text-destructive">
                          Unsubscribed {format(new Date(sub.unsubscribed_at), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteId(sub.id)}
                    className="p-2 hover:bg-destructive/10 rounded text-destructive flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </ComicPanel>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteMutation.mutate(deleteId);
          setDeleteId(null);
        }}
        title="Remove this subscriber?"
        description="This will permanently delete this subscriber record."
      />
    </AdminLayout>
  );
};

export default SubscribersManager;
