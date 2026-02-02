import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Loader2, 
  Building, 
  MapPin, 
  ExternalLink, 
  Mail, 
  User, 
  Sparkles,
  Plus,
  X,
  Save,
  DollarSign,
  Briefcase,
  Users,
  Handshake
} from "lucide-react";
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
  lead_type: string | null;
  estimated_pay: number | null;
  work_description: string | null;
  benefits: string[] | null;
  contact_person: string | null;
  contact_title: string | null;
  suggested_services: string[] | null;
  is_accepted: boolean | null;
}

interface SearchProfile {
  id: string;
  name: string;
  skills: string[];
  terms: string[];
  industries: string[];
  is_default: boolean;
}

const LeadFinder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    industry: "",
    location: "",
    companySize: "",
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [leadType, setLeadType] = useState<"work" | "partnership" | "organization">("work");
  const [searching, setSearching] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [profileName, setProfileName] = useState("");
  const [showSaveProfile, setShowSaveProfile] = useState(false);
  const queryClient = useQueryClient();

  // Fetch leads
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

  // Fetch skills from database
  const { data: dbSkills } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("name")
        .order("name");
      if (error) throw error;
      return data.map(s => s.name);
    },
  });

  // Fetch saved profiles
  const { data: savedProfiles } = useQuery({
    queryKey: ["lead-search-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_search_profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SearchProfile[];
    },
  });

  // Auto-load skills from database
  const loadSkillsFromDb = () => {
    if (dbSkills) {
      setSkills(prev => [...new Set([...prev, ...dbSkills])]);
      toast.success(`Loaded ${dbSkills.length} skills from your profile`);
    }
  };

  // Add skill
  const addSkill = () => {
    if (newSkill && !skills.includes(newSkill)) {
      setSkills(prev => [...prev, newSkill]);
      setNewSkill("");
    }
  };

  // Add search term
  const addTerm = () => {
    if (newTerm && !searchTerms.includes(newTerm)) {
      setSearchTerms(prev => [...prev, newTerm]);
      setNewTerm("");
    }
  };

  // Save profile
  const saveProfile = async () => {
    if (!profileName) {
      toast.error("Please enter a profile name");
      return;
    }
    
    const { error } = await supabase.from("lead_search_profiles").insert({
      name: profileName,
      skills,
      terms: searchTerms,
      industries: filters.industry ? [filters.industry] : [],
    });

    if (error) {
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile saved!");
      setShowSaveProfile(false);
      setProfileName("");
      queryClient.invalidateQueries({ queryKey: ["lead-search-profiles"] });
    }
  };

  // Load profile
  const loadProfile = (profile: SearchProfile) => {
    setSkills(profile.skills);
    setSearchTerms(profile.terms);
    if (profile.industries.length > 0) {
      setFilters(prev => ({ ...prev, industry: profile.industries[0] }));
    }
    toast.success(`Loaded profile: ${profile.name}`);
  };

  // Find leads
  const findLeads = async () => {
    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("find-leads", {
        body: {
          query: searchQuery,
          skills: skills.length > 0 ? skills : undefined,
          searchTerms: searchTerms.length > 0 ? searchTerms : undefined,
          leadType,
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

  const getLeadTypeIcon = (type: string | null) => {
    switch (type) {
      case "partnership": return <Handshake className="w-4 h-4" />;
      case "organization": return <Users className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const statusOptions = ["new", "contacted", "responded", "converted", "archived"];

  // Filter leads by type
  const filteredLeads = leads?.filter(lead => 
    leadType === "work" 
      ? (!lead.lead_type || lead.lead_type === "work")
      : lead.lead_type === leadType
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display">Lead Finder</h1>
          <p className="text-muted-foreground">Discover opportunities matching your skills and interests</p>
        </div>

        {/* Lead Type Tabs */}
        <div className="flex gap-2">
          {[
            { id: "work", label: "Work & Gigs", icon: Briefcase },
            { id: "partnership", label: "Partnerships", icon: Handshake },
            { id: "organization", label: "Organizations", icon: Users },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setLeadType(type.id as typeof leadType)}
              className={`flex items-center gap-2 px-4 py-2 font-bold uppercase text-sm border-2 border-foreground transition-colors ${
                leadType === type.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>

        {/* Search Section */}
        <ComicPanel className="p-6 bg-pop-cyan/10">
          <h2 className="text-xl font-display mb-4">Find New {leadType === "work" ? "Opportunities" : leadType === "partnership" ? "Partners" : "Organizations"}</h2>
          
          {/* Skills Input */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <Label>My Skills & Expertise</Label>
              <button
                onClick={loadSkillsFromDb}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                Auto-load from Skills Manager
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mb-2">
              {skills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-primary text-primary-foreground text-sm font-bold flex items-center gap-1">
                  {skill}
                  <button onClick={() => setSkills(prev => prev.filter(s => s !== skill))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
              />
              <button onClick={addSkill} className="p-2 border-2 border-foreground hover:bg-muted">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Custom Search Terms */}
          <div className="mb-4">
            <Label className="mb-2 block">Custom Search Terms</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {searchTerms.map((term) => (
                <span key={term} className="px-3 py-1 bg-pop-yellow text-foreground text-sm font-bold flex items-center gap-1">
                  {term}
                  <button onClick={() => setSearchTerms(prev => prev.filter(t => t !== term))}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Add a search term (e.g., 'diabetes tech', 'health apps')..."
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTerm())}
              />
              <button onClick={addTerm} className="p-2 border-2 border-foreground hover:bg-muted">
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="grid md:grid-cols-4 gap-4 mb-4">
            <div>
              <Label>Search Query (optional)</Label>
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Additional context..."
              />
            </div>
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

          {/* Actions */}
          <div className="flex flex-wrap gap-4">
            <PopButton onClick={findLeads} disabled={searching}>
              {searching ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Find Matches
            </PopButton>
            
            <button
              onClick={() => setShowSaveProfile(!showSaveProfile)}
              className="px-4 py-2 border-2 border-foreground hover:bg-muted flex items-center gap-2 font-bold"
            >
              <Save className="w-4 h-4" />
              Save Profile
            </button>

            {savedProfiles && savedProfiles.length > 0 && (
              <select
                onChange={(e) => {
                  const profile = savedProfiles.find(p => p.id === e.target.value);
                  if (profile) loadProfile(profile);
                }}
                className="px-4 py-2 border-2 border-foreground bg-background"
                defaultValue=""
              >
                <option value="" disabled>Load Saved Profile...</option>
                {savedProfiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Save Profile Form */}
          {showSaveProfile && (
            <div className="mt-4 p-4 bg-background border-2 border-foreground">
              <Label className="mb-2 block">Profile Name</Label>
              <div className="flex gap-2">
                <Input
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="My Search Profile"
                />
                <PopButton onClick={saveProfile} size="sm">Save</PopButton>
              </div>
            </div>
          )}
        </ComicPanel>

        {/* Leads Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Leads List */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-display">
              Your {leadType === "work" ? "Leads" : leadType === "partnership" ? "Partnerships" : "Organizations"} ({filteredLeads?.length || 0})
            </h2>
            
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredLeads && filteredLeads.length > 0 ? (
              <div className="space-y-3">
                {filteredLeads.map((lead) => (
                  <Link 
                    key={lead.id} 
                    to={`/admin/leads/${lead.id}`}
                    className="block"
                  >
                    <ComicPanel 
                      className={`p-4 transition-all hover:translate-y-[-2px] ${
                        selectedLead?.id === lead.id ? "ring-2 ring-primary" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Score Badge */}
                        <div className={`w-12 h-12 ${getScoreColor(lead.match_score)} flex items-center justify-center border-2 border-foreground flex-shrink-0`}>
                          <span className="text-lg font-display">{lead.match_score || "?"}</span>
                        </div>
                        
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                {getLeadTypeIcon(lead.lead_type)}
                                <h3 className="font-display text-lg">{lead.company || lead.name || "Unknown"}</h3>
                              </div>
                              {lead.contact_person && (
                                <p className="text-sm text-muted-foreground">
                                  {lead.contact_person} {lead.contact_title && `(${lead.contact_title})`}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {lead.estimated_pay && (
                                <span className="flex items-center gap-1 text-sm font-bold text-green-600">
                                  <DollarSign className="w-3 h-3" />
                                  {lead.estimated_pay.toLocaleString()}
                                </span>
                              )}
                              <span className={`text-xs font-bold uppercase px-2 py-1 border-2 border-foreground ${
                                lead.status === "converted" ? "bg-green-500" :
                                lead.status === "responded" ? "bg-pop-cyan" :
                                lead.status === "contacted" ? "bg-pop-yellow" :
                                lead.status === "archived" ? "bg-muted" : "bg-background"
                              }`}>
                                {lead.status || "new"}
                              </span>
                            </div>
                          </div>
                          
                          {lead.work_description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                              {lead.work_description}
                            </p>
                          )}
                          
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

                          {lead.suggested_services && lead.suggested_services.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {lead.suggested_services.slice(0, 3).map((service, i) => (
                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-xs font-bold">
                                  {service}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </ComicPanel>
                  </Link>
                ))}
              </div>
            ) : (
              <ComicPanel className="p-12 text-center">
                <p className="text-muted-foreground mb-4">
                  No {leadType === "work" ? "leads" : leadType === "partnership" ? "partnerships" : "organizations"} yet. 
                  Add your skills above and click "Find Matches" to discover opportunities.
                </p>
              </ComicPanel>
            )}
          </div>

          {/* Quick Preview Panel */}
          <div>
            <h2 className="text-2xl font-display mb-4">Quick View</h2>
            <ComicPanel className="p-6 text-center text-muted-foreground">
              <p>Click a lead to view full details</p>
            </ComicPanel>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default LeadFinder;
