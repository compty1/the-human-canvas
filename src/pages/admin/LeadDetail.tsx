import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { AIChatAssistant } from "@/components/admin/AIChatAssistant";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, Building, MapPin, ExternalLink, Mail, User, 
  DollarSign, Briefcase, Check, X, Plus, Loader2, Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface LeadPlan {
  id: string;
  lead_id: string;
  title: string;
  description: string | null;
  timeline: string | null;
  steps: unknown;
  ai_suggestions: unknown;
  status: string;
  estimated_hours: number | null;
  estimated_cost: number | null;
}

// Type helpers for JSON fields
const parseSteps = (steps: unknown): { step: string; completed: boolean }[] => {
  if (!steps || !Array.isArray(steps)) return [];
  return steps.map((s: unknown) => {
    if (typeof s === "object" && s !== null && "step" in s) {
      return { step: String((s as Record<string, unknown>).step), completed: Boolean((s as Record<string, unknown>).completed) };
    }
    return { step: String(s), completed: false };
  });
};

const parseSuggestions = (suggestions: unknown): string[] => {
  if (!suggestions || !Array.isArray(suggestions)) return [];
  return suggestions.map((s) => String(s));
};

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newPlanTitle, setNewPlanTitle] = useState("");
  const [editingPlan, setEditingPlan] = useState<LeadPlan | null>(null);

  const { data: lead, isLoading } = useQuery({
    queryKey: ["lead-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: plans } = useQuery({
    queryKey: ["lead-plans", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_plans")
        .select("*")
        .eq("lead_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as LeadPlan[];
    },
    enabled: !!id,
  });

  const acceptLeadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("leads")
        .update({ is_accepted: true, accepted_at: new Date().toISOString(), status: "contacted" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-detail", id] });
      toast.success("Lead accepted!");
    },
  });

  const createPlanMutation = useMutation({
    mutationFn: async (title: string) => {
      const { error } = await supabase.from("lead_plans").insert({
        lead_id: id,
        title,
        steps: [],
        ai_suggestions: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-plans", id] });
      setNewPlanTitle("");
      toast.success("Plan created");
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (plan: { id: string; steps?: { step: string; completed: boolean }[]; ai_suggestions?: string[]; description?: string; timeline?: string; status?: string }) => {
      const { id: planId, ...data } = plan;
      const { error } = await supabase
        .from("lead_plans")
        .update(data)
        .eq("id", planId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-plans", id] });
      toast.success("Plan updated");
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { error } = await supabase
        .from("leads")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lead-detail", id] });
      toast.success("Lead updated");
    },
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!lead) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <h1 className="text-2xl font-display mb-4">Lead Not Found</h1>
          <Link to="/admin/leads">
            <PopButton>Back to Leads</PopButton>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const leadContext = `
Lead: ${lead.company || lead.name}
Industry: ${lead.industry || "Unknown"}
Location: ${lead.location || "Unknown"}
Lead Type: ${lead.lead_type || "work"}
Match Reasons: ${lead.match_reasons?.join(", ") || "None"}
Work Description: ${lead.work_description || "Not specified"}
Estimated Pay: ${lead.estimated_pay ? `$${lead.estimated_pay}` : "Not specified"}
  `.trim();

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/leads")} className="p-2 hover:bg-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-grow">
            <h1 className="text-3xl font-display">{lead.company || lead.name}</h1>
            <div className="flex items-center gap-4 text-muted-foreground">
              {lead.industry && <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {lead.industry}</span>}
              {lead.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {lead.location}</span>}
            </div>
          </div>
          {!lead.is_accepted && (
            <PopButton onClick={() => acceptLeadMutation.mutate()}>
              <Check className="w-4 h-4 mr-2" /> Accept Lead
            </PopButton>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Info */}
            <ComicPanel className="p-6">
              <h2 className="text-xl font-display mb-4">Lead Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Contact Person</Label>
                  <Input
                    value={lead.contact_person || ""}
                    onChange={(e) => updateLeadMutation.mutate({ contact_person: e.target.value })}
                    placeholder="Contact name"
                  />
                </div>
                <div>
                  <Label>Contact Title</Label>
                  <Input
                    value={lead.contact_title || ""}
                    onChange={(e) => updateLeadMutation.mutate({ contact_title: e.target.value })}
                    placeholder="Job title"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={lead.email || ""}
                    onChange={(e) => updateLeadMutation.mutate({ email: e.target.value })}
                    placeholder="email@company.com"
                  />
                </div>
                <div>
                  <Label>Estimated Pay</Label>
                  <Input
                    type="number"
                    value={lead.estimated_pay || ""}
                    onChange={(e) => updateLeadMutation.mutate({ estimated_pay: parseFloat(e.target.value) || null })}
                    placeholder="$0"
                  />
                </div>
              </div>
              <div className="mt-4">
                <Label>Work Description</Label>
                <Textarea
                  value={lead.work_description || ""}
                  onChange={(e) => updateLeadMutation.mutate({ work_description: e.target.value })}
                  placeholder="Describe the work required..."
                  rows={3}
                />
              </div>
              <div className="mt-4">
                <Label>Notes</Label>
                <Textarea
                  value={lead.notes || ""}
                  onChange={(e) => updateLeadMutation.mutate({ notes: e.target.value })}
                  placeholder="Additional notes..."
                  rows={3}
                />
              </div>
            </ComicPanel>

            {/* Plans */}
            <ComicPanel className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-display">Project Plans</h2>
              </div>

              {/* Create Plan */}
              <div className="flex gap-2 mb-6">
                <Input
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  placeholder="New plan title..."
                  onKeyDown={(e) => e.key === "Enter" && newPlanTitle && createPlanMutation.mutate(newPlanTitle)}
                />
                <PopButton
                  onClick={() => newPlanTitle && createPlanMutation.mutate(newPlanTitle)}
                  disabled={!newPlanTitle}
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                </PopButton>
              </div>

              {/* Plans List */}
              {plans && plans.length > 0 ? (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div key={plan.id} className="border-2 border-foreground p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-bold">{plan.title}</h3>
                        <span className={`px-2 py-1 text-xs font-bold uppercase ${
                          plan.status === "active" ? "bg-pop-green" :
                          plan.status === "completed" ? "bg-green-500" : "bg-muted"
                        }`}>
                          {plan.status}
                        </span>
                      </div>
                      
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-2">{plan.description}</p>
                      )}
                      
                      {plan.timeline && (
                        <p className="text-sm mb-2"><strong>Timeline:</strong> {plan.timeline}</p>
                      )}

                      {parseSteps(plan.steps).length > 0 && (
                        <div className="mt-3">
                          <strong className="text-sm">Steps:</strong>
                          <ul className="mt-1 space-y-1">
                            {parseSteps(plan.steps).map((step, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm">
                                <input
                                  type="checkbox"
                                  checked={step.completed}
                                  onChange={() => {
                                    const currentSteps = parseSteps(plan.steps);
                                    const newSteps = currentSteps.map((s, idx) => 
                                      idx === i ? { ...s, completed: !s.completed } : s
                                    );
                                    updatePlanMutation.mutate({ id: plan.id, steps: newSteps });
                                  }}
                                />
                                <span className={step.completed ? "line-through opacity-50" : ""}>
                                  {step.step}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {parseSuggestions(plan.ai_suggestions).length > 0 && (
                        <div className="mt-3 p-2 bg-primary/10">
                          <strong className="text-sm flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> AI Suggestions:
                          </strong>
                          <ul className="mt-1 space-y-1">
                            {parseSuggestions(plan.ai_suggestions).map((sug, i) => (
                              <li key={i} className="text-sm flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const currentSteps = parseSteps(plan.steps);
                                    const newSteps = [...currentSteps, { step: sug, completed: false }];
                                    const currentSuggestions = parseSuggestions(plan.ai_suggestions);
                                    const newSuggestions = currentSuggestions.filter((_, idx) => idx !== i);
                                    updatePlanMutation.mutate({ id: plan.id, steps: newSteps, ai_suggestions: newSuggestions });
                                  }}
                                  className="text-primary hover:underline"
                                >
                                  + Add
                                </button>
                                {sug}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No plans yet. Create one to start organizing this lead.
                </p>
              )}
            </ComicPanel>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <ComicPanel className="p-6">
              <h3 className="font-display text-lg mb-4">Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Match Score</span>
                  <span className="font-bold">{lead.match_score || "N/A"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lead Type</span>
                  <span className="font-bold capitalize">{lead.lead_type || "work"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company Size</span>
                  <span className="font-bold">{lead.company_size || "Unknown"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="font-bold capitalize">{lead.status}</span>
                </div>
                {lead.is_accepted && (
                  <div className="pt-2 border-t">
                    <span className="text-green-600 font-bold flex items-center gap-1">
                      <Check className="w-4 h-4" /> Accepted
                    </span>
                  </div>
                )}
              </div>
            </ComicPanel>

            {/* Links */}
            <ComicPanel className="p-6">
              <h3 className="font-display text-lg mb-4">Links</h3>
              <div className="space-y-2">
                {lead.website && (
                  <a href={lead.website} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="w-4 h-4" /> Website
                  </a>
                )}
                {lead.linkedin && (
                  <a href={lead.linkedin} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-2 text-primary hover:underline">
                    <ExternalLink className="w-4 h-4" /> LinkedIn
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-primary hover:underline">
                    <Mail className="w-4 h-4" /> {lead.email}
                  </a>
                )}
              </div>
            </ComicPanel>

            {/* Match Reasons */}
            {lead.match_reasons && lead.match_reasons.length > 0 && (
              <ComicPanel className="p-6">
                <h3 className="font-display text-lg mb-4">Match Reasons</h3>
                <div className="flex flex-wrap gap-2">
                  {lead.match_reasons.map((reason: string, i: number) => (
                    <span key={i} className="px-2 py-1 bg-primary/10 text-sm">
                      {reason}
                    </span>
                  ))}
                </div>
              </ComicPanel>
            )}

            {/* AI Chat */}
            <AIChatAssistant
              context={leadContext}
              contentType="lead"
              onSuggestionApply={(text) => {
                updateLeadMutation.mutate({ notes: (lead.notes || "") + "\n\n" + text });
              }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LeadDetail;
