import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Loader2, Building, MapPin, ExternalLink, Mail, User, Filter } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string | null;
  company: string | null;
  email: string | null;
  website: string | null;
  linkedin: string | null;
  industry: string | null;
  company_size: string | null;
  location: string | null;
  match_score: number | null;
  match_reasons: string[] | null;
  status: string | null;
  notes: string | null;
}

const LeadFinder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    industry: "",
    location: "",
    companySize: "",
  });
  const [searching, setSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("match_score", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Lead[];
    },
  });

  const findLeads = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-leads", {
        body: {
          query: searchQuery,
          filters: {
            industry: filters.industry || undefined,
            location: filters.location || undefined,
            company_size: filters.companySize || undefined,
          },
        },
      });

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success(`Found ${data?.leads?.length || 0} potential leads`);
    } catch (error) {
      toast.error("Failed to find leads");
      console.error(error);
    } finally {
      setSearching(false);
    }
  };

  const updateLeadStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "new" | "contacted" | "responded" | "converted" | "archived" }) => {
      const { error } = await supabase
        .from("leads")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Lead status updated");
    },
  });

  const updateLeadNotes = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("leads")
        .update({ notes })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
      toast.success("Notes saved");
    },
  });

  const getScoreColor = (score: number | null) => {
    if (!score) return "bg-muted";
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-pop-yellow";
    if (score >= 40) return "bg-pop-orange";
    return "bg-muted";
  };

  const statusOptions = ["new", "contacted", "responded", "converted", "archived"];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display">Lead Finder</h1>
          <p className="text-muted-foreground">Discover potential clients matching your brand</p>
        </div>

        {/* Search Section */}
        <ComicPanel className="p-6 bg-pop-cyan/10">
          <h2 className="text-xl font-display mb-4">Find New Leads</h2>
          <div className="grid gap-4">
            <div>
              <Label>Search Query</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., small businesses needing web design, diabetes startups..."
              />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Industry</Label>
                <Input
                  value={filters.industry}
                  onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Healthcare, Tech"
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  value={filters.location}
                  onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Los Angeles, Remote"
                />
              </div>
              <div>
                <Label>Company Size</Label>
                <Input
                  value={filters.companySize}
                  onChange={(e) => setFilters(prev => ({ ...prev, companySize: e.target.value }))}
                  placeholder="e.g., 1-10, 50-200"
                />
              </div>
            </div>
            <div>
              <PopButton onClick={findLeads} disabled={searching}>
                {searching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Search className="w-4 h-4 mr-2" />
                )}
                Find Matches
              </PopButton>
            </div>
          </div>
        </ComicPanel>

        {/* Leads Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leads List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-display">Your Leads ({leads?.length || 0})</h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : leads && leads.length > 0 ? (
              <div className="space-y-3">
                {leads.map((lead) => (
                  <ComicPanel 
                    key={lead.id} 
                    className={`p-4 cursor-pointer transition-all hover:translate-y-[-2px] ${
                      selectedLead?.id === lead.id ? "ring-2 ring-primary" : ""
                    }`}
                    onClick={() => setSelectedLead(lead)}
                  >
                    <div className="flex items-start gap-4">
                      {/* Score Badge */}
                      <div className={`w-12 h-12 ${getScoreColor(lead.match_score)} flex items-center justify-center border-2 border-foreground flex-shrink-0`}>
                        <span className="text-lg font-display">{lead.match_score || "?"}</span>
                      </div>
                      
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-display text-lg">{lead.company || "Unknown Company"}</h3>
                            {lead.name && (
                              <p className="text-sm text-muted-foreground">{lead.name}</p>
                            )}
                          </div>
                          <select
                            value={lead.status || "new"}
                            onChange={(e) => updateLeadStatus.mutate({ id: lead.id, status: e.target.value as "new" | "contacted" | "responded" | "converted" | "archived" })}
                            onClick={(e) => e.stopPropagation()}
                            className={`text-xs font-bold uppercase px-2 py-1 border-2 border-foreground ${
                              lead.status === "converted" ? "bg-green-500" :
                              lead.status === "responded" ? "bg-pop-cyan" :
                              lead.status === "contacted" ? "bg-pop-yellow" :
                              lead.status === "archived" ? "bg-muted" : "bg-background"
                            }`}
                          >
                            {statusOptions.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                          {lead.industry && (
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" /> {lead.industry}
                            </span>
                          )}
                          {lead.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {lead.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </ComicPanel>
                ))}
              </div>
            ) : (
              <ComicPanel className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No leads yet. Use the search above to find potential clients.</p>
              </ComicPanel>
            )}
          </div>

          {/* Lead Detail Panel */}
          <div>
            <h2 className="text-2xl font-display mb-4">Lead Details</h2>
            {selectedLead ? (
              <ComicPanel className="p-6 sticky top-24">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-display">{selectedLead.company}</h3>
                    {selectedLead.name && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <User className="w-4 h-4" /> {selectedLead.name}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    {selectedLead.email && (
                      <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 hover:text-primary">
                        <Mail className="w-4 h-4" /> {selectedLead.email}
                      </a>
                    )}
                    {selectedLead.website && (
                      <a href={selectedLead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                        <ExternalLink className="w-4 h-4" /> Website
                      </a>
                    )}
                    {selectedLead.linkedin && (
                      <a href={selectedLead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary">
                        <ExternalLink className="w-4 h-4" /> LinkedIn
                      </a>
                    )}
                  </div>

                  {selectedLead.match_reasons && selectedLead.match_reasons.length > 0 && (
                    <div>
                      <Label className="mb-2 block">Match Reasons</Label>
                      <div className="flex flex-wrap gap-1">
                        {selectedLead.match_reasons.map((reason, i) => (
                          <span key={i} className="px-2 py-1 bg-primary/10 text-xs font-bold">
                            {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label className="mb-2 block">Notes</Label>
                    <Textarea
                      value={selectedLead.notes || ""}
                      onChange={(e) => setSelectedLead(prev => prev ? { ...prev, notes: e.target.value } : null)}
                      onBlur={() => selectedLead && updateLeadNotes.mutate({ id: selectedLead.id, notes: selectedLead.notes || "" })}
                      rows={4}
                      placeholder="Add notes about this lead..."
                    />
                  </div>
                </div>
              </ComicPanel>
            ) : (
              <ComicPanel className="p-6 text-center text-muted-foreground">
                Select a lead to view details
              </ComicPanel>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LeadFinder;
