import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  Award,
  ExternalLink,
  DollarSign,
  MoreVertical
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";

const statusColors: Record<string, string> = {
  earned: "bg-green-500",
  in_progress: "bg-yellow-500",
  planned: "bg-blue-500",
  wanted: "bg-purple-500",
};

const CertificationsManager = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<string>("all");

  const { data: certifications = [], isLoading } = useQuery({
    queryKey: ["admin-certifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .order("order_index", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("certifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] });
      toast.success("Certification deleted");
    },
    onError: () => {
      toast.error("Failed to delete certification");
    },
  });

  const filteredCertifications = filter === "all" 
    ? certifications 
    : certifications.filter(c => c.status === filter);

  const statuses = ["all", "earned", "in_progress", "planned", "wanted"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display">Certifications</h1>
            <p className="text-muted-foreground">Manage your certifications and credentials</p>
          </div>
          <Link to="/admin/certifications/new">
            <PopButton>
              <Plus className="w-4 h-4 mr-2" /> Add Certification
            </PopButton>
          </Link>
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => {
            const count = status === "all" 
              ? certifications.length 
              : certifications.filter(c => c.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 font-bold text-sm capitalize flex items-center gap-2 border-2 transition-colors ${
                  filter === status
                    ? "bg-foreground text-background border-foreground"
                    : "border-foreground hover:bg-muted"
                }`}
              >
                {status === "all" ? "All" : status.replace("_", " ")} ({count})
              </button>
            );
          })}
        </div>

        {/* Certifications List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredCertifications.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Award className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-display mb-2">No certifications yet</h2>
            <p className="text-muted-foreground mb-4">Add your first certification to get started</p>
            <Link to="/admin/certifications/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Add Certification
              </PopButton>
            </Link>
          </ComicPanel>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCertifications.map((cert) => (
              <ComicPanel key={cert.id} className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-bold text-white capitalize ${statusColors[cert.status || "planned"]}`}>
                      {cert.status?.replace("_", " ")}
                    </span>
                    {cert.category && (
                      <span className="px-2 py-1 text-xs font-bold bg-muted capitalize">
                        {cert.category}
                      </span>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-1 hover:bg-muted rounded">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link to={`/admin/certifications/${cert.id}/edit`} className="flex items-center gap-2">
                          <Edit className="w-4 h-4" /> Edit
                        </Link>
                      </DropdownMenuItem>
                      {cert.credential_url && (
                        <DropdownMenuItem asChild>
                          <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                            <ExternalLink className="w-4 h-4" /> View Credential
                          </a>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => {
                          if (confirm("Delete this certification?")) {
                            deleteMutation.mutate(cert.id);
                          }
                        }}
                        className="flex items-center gap-2 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <h3 className="font-display text-lg mb-1">{cert.name}</h3>
                <p className="text-sm text-muted-foreground mb-3">{cert.issuer}</p>

                {cert.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {cert.description}
                  </p>
                )}

                {/* Funding Progress */}
                {cert.funding_enabled && cert.estimated_cost && cert.status !== "earned" && (
                  <div className="mt-3 pt-3 border-t border-muted">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        Funding
                      </span>
                      <span className="font-bold">
                        ${cert.funded_amount || 0} / ${cert.estimated_cost}
                      </span>
                    </div>
                    <Progress 
                      value={((cert.funded_amount || 0) / cert.estimated_cost) * 100} 
                      className="h-2"
                    />
                  </div>
                )}

                {cert.earned_date && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Earned: {new Date(cert.earned_date).toLocaleDateString()}
                  </p>
                )}
              </ComicPanel>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default CertificationsManager;
