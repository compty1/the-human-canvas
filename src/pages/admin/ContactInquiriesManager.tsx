import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Search, Mail, Loader2, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Inquiry {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string | null;
  created_at: string | null;
}

const statusOptions = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "read", label: "Read" },
  { value: "replied", label: "Replied" },
];

const statusIcons: Record<string, React.ElementType> = {
  new: AlertCircle,
  read: Clock,
  replied: CheckCircle,
};

const ContactInquiriesManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["admin-contact-inquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_inquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Inquiry[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("contact_inquiries")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-contact-inquiries"] });
      toast.success("Status updated");
    },
  });

  const filtered = inquiries.filter((inq) => {
    const matchesSearch =
      !search ||
      inq.name.toLowerCase().includes(search.toLowerCase()) ||
      inq.email.toLowerCase().includes(search.toLowerCase()) ||
      (inq.subject || "").toLowerCase().includes(search.toLowerCase()) ||
      inq.message.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display">Contact Inquiries</h1>
          <p className="text-muted-foreground">
            View and manage messages from your contact form
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search inquiries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filtered.length} of {inquiries.length}
          </span>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Mail className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Inquiries</h3>
            <p className="text-muted-foreground">
              {search || statusFilter !== "all"
                ? "No inquiries match your filters"
                : "No contact form submissions yet"}
            </p>
          </ComicPanel>
        ) : (
          <div className="space-y-3">
            {filtered.map((inq) => {
              const StatusIcon = statusIcons[inq.status || "new"] || AlertCircle;
              const isExpanded = expandedId === inq.id;
              return (
                <ComicPanel key={inq.id} className="p-4">
                  <div
                    className="flex items-start gap-4 cursor-pointer"
                    onClick={() => {
                      setExpandedId(isExpanded ? null : inq.id);
                      if (inq.status === "new") {
                        updateStatusMutation.mutate({ id: inq.id, status: "read" });
                      }
                    }}
                  >
                    <StatusIcon
                      className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        inq.status === "new"
                          ? "text-pop-orange"
                          : inq.status === "replied"
                          ? "text-green-500"
                          : "text-muted-foreground"
                      }`}
                    />
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold truncate">{inq.name}</span>
                        <span className="text-sm text-muted-foreground truncate">
                          &lt;{inq.email}&gt;
                        </span>
                        {inq.created_at && (
                          <span className="text-xs text-muted-foreground ml-auto flex-shrink-0">
                            {format(new Date(inq.created_at), "MMM d, yyyy h:mm a")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium">
                        {inq.subject || "(No subject)"}
                      </p>
                      {!isExpanded && (
                        <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                          {inq.message}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Select
                        value={inq.status || "new"}
                        onValueChange={(v) => {
                          updateStatusMutation.mutate({ id: inq.id, status: v });
                        }}
                      >
                        <SelectTrigger className="w-[100px] h-8 text-xs" onClick={(e) => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="replied">Replied</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(inq.id);
                        }}
                        className="p-2 hover:bg-destructive/10 rounded text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="mt-4 ml-9 p-4 bg-muted/50 border border-foreground/10 rounded">
                      <p className="whitespace-pre-wrap text-sm">{inq.message}</p>
                      <div className="mt-4">
                        <a
                          href={`mailto:${inq.email}?subject=Re: ${inq.subject || ""}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                          <Mail className="w-4 h-4" />
                          Reply via Email
                        </a>
                      </div>
                    </div>
                  )}
                </ComicPanel>
              );
            })}
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          const { error } = await supabase
            .from("contact_inquiries")
            .delete()
            .eq("id", deleteId);
          if (error) {
            toast.error("Failed to delete");
          } else {
            queryClient.invalidateQueries({ queryKey: ["admin-contact-inquiries"] });
            toast.success("Inquiry deleted");
          }
          setDeleteId(null);
        }}
        title="Delete this inquiry?"
        description="This action cannot be undone."
      />
    </AdminLayout>
  );
};

export default ContactInquiriesManager;
