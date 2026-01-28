import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TrendingUp, Plus, Trash2, Loader2, Edit2, X, Check } from "lucide-react";
import { toast } from "sonner";

interface FundingCampaign {
  id: string;
  campaign_type: string;
  title: string;
  description: string | null;
  target_amount: number;
  raised_amount: number;
  project_id: string | null;
  status: string;
  created_at: string;
  projects?: { title: string; status: string } | null;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

const campaignTypes = [
  { value: "development", label: "Development", color: "bg-blue-500" },
  { value: "research", label: "Research", color: "bg-purple-500" },
  { value: "supplies", label: "Supplies", color: "bg-green-500" },
];

const FundingCampaignsManager = () => {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    campaign_type: "development",
    title: "",
    description: "",
    target_amount: "",
    project_id: "",
    status: "active",
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-funding-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funding_campaigns")
        .select("*, projects(title, status)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FundingCampaign[];
    },
  });

  // Fetch projects with in_progress or planned status
  const { data: projects = [] } = useQuery({
    queryKey: ["fundable-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, title, status")
        .in("status", ["in_progress", "planned"])
        .order("title");
      if (error) throw error;
      return data as Project[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        campaign_type: form.campaign_type,
        title: form.title,
        description: form.description || null,
        target_amount: parseFloat(form.target_amount) || 0,
        project_id: form.project_id || null,
        status: form.status,
      };

      if (editingId) {
        const { error } = await supabase
          .from("funding_campaigns")
          .update(data)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("funding_campaigns").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-funding-campaigns"] });
      toast.success(editingId ? "Campaign updated" : "Campaign created");
      resetForm();
    },
    onError: (error) => {
      toast.error("Failed to save campaign");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("funding_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-funding-campaigns"] });
      toast.success("Campaign deleted");
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setForm({
      campaign_type: "development",
      title: "",
      description: "",
      target_amount: "",
      project_id: "",
      status: "active",
    });
  };

  const editCampaign = (campaign: FundingCampaign) => {
    setEditingId(campaign.id);
    setForm({
      campaign_type: campaign.campaign_type,
      title: campaign.title,
      description: campaign.description || "",
      target_amount: campaign.target_amount.toString(),
      project_id: campaign.project_id || "",
      status: campaign.status,
    });
  };

  const totalRaised = campaigns.reduce((sum, c) => sum + c.raised_amount, 0);
  const activeCampaigns = campaigns.filter(c => c.status === "active").length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display">Funding Campaigns</h1>
          <p className="text-muted-foreground">Manage development, research, and supplies funding</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{campaigns.length}</div>
            <div className="text-sm text-muted-foreground">Total Campaigns</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{activeCampaigns}</div>
            <div className="text-sm text-muted-foreground">Active</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">${totalRaised.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Raised</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{projects.length}</div>
            <div className="text-sm text-muted-foreground">Fundable Projects</div>
          </ComicPanel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <ComicPanel className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-display">
                {editingId ? "Edit Campaign" : "New Campaign"}
              </h2>
              {editingId && (
                <button onClick={resetForm} className="p-1 hover:text-destructive">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Campaign Type</Label>
                <div className="flex gap-2 mt-1">
                  {campaignTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => setForm(prev => ({ ...prev, campaign_type: type.value }))}
                      className={`px-3 py-1 text-sm font-bold border-2 transition-colors ${
                        form.campaign_type === type.value
                          ? `${type.color} text-white border-foreground`
                          : "border-foreground hover:bg-muted"
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Campaign title"
                />
              </div>

              <div>
                <Label htmlFor="project">Link to Project (optional)</Label>
                <select
                  id="project"
                  value={form.project_id}
                  onChange={(e) => setForm(prev => ({ ...prev, project_id: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  <option value="">No linked project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.status === "in_progress" ? "In Progress" : "Planned"})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Only projects with "In Progress" or "Planned" status appear here
                </p>
              </div>

              <div>
                <Label htmlFor="target">Target Amount ($)</Label>
                <Input
                  id="target"
                  type="number"
                  value={form.target_amount}
                  onChange={(e) => setForm(prev => ({ ...prev, target_amount: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <PopButton 
                onClick={() => saveMutation.mutate()}
                disabled={!form.title || saveMutation.isPending}
                className="w-full justify-center"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : editingId ? (
                  <Check className="w-4 h-4 mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                {editingId ? "Update Campaign" : "Create Campaign"}
              </PopButton>
            </div>
          </ComicPanel>

          {/* Campaigns List */}
          <ComicPanel className="p-6 lg:col-span-2">
            <h2 className="text-xl font-display mb-4">All Campaigns</h2>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No campaigns yet</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {campaigns.map((campaign) => {
                  const typeInfo = campaignTypes.find(t => t.value === campaign.campaign_type);
                  const progress = campaign.target_amount > 0 
                    ? (campaign.raised_amount / campaign.target_amount) * 100 
                    : 0;

                  return (
                    <div key={campaign.id} className="p-4 border-2 border-foreground bg-background">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`px-2 py-0.5 text-xs font-bold text-white ${typeInfo?.color}`}>
                              {typeInfo?.label}
                            </span>
                            <span className={`px-2 py-0.5 text-xs font-bold border ${
                              campaign.status === "active" ? "border-green-500 text-green-600" :
                              campaign.status === "paused" ? "border-yellow-500 text-yellow-600" :
                              "border-muted text-muted-foreground"
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                          <h3 className="font-bold mt-1">{campaign.title}</h3>
                          {campaign.projects && (
                            <div className="text-sm text-muted-foreground">
                              Linked to: {campaign.projects.title}
                            </div>
                          )}
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {campaign.description}
                            </p>
                          )}
                          
                          {/* Progress bar */}
                          <div className="mt-3">
                            <div className="flex justify-between text-xs font-bold mb-1">
                              <span>${campaign.raised_amount} raised</span>
                              <span>${campaign.target_amount} goal</span>
                            </div>
                            <div className="h-2 bg-muted overflow-hidden">
                              <div
                                className={`h-full ${typeInfo?.color}`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => editCampaign(campaign)}
                            className="p-1 hover:text-primary"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteMutation.mutate(campaign.id)}
                            className="p-1 hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ComicPanel>
        </div>
      </div>
    </AdminLayout>
  );
};

export default FundingCampaignsManager;
