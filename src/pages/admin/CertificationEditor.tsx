import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, ArrowLeft, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

const categories = [
  { value: "technical", label: "Technical" },
  { value: "creative", label: "Creative" },
  { value: "business", label: "Business" },
  { value: "health", label: "Health" },
];

const statuses = [
  { value: "earned", label: "Earned" },
  { value: "in_progress", label: "In Progress" },
  { value: "planned", label: "Planned" },
  { value: "wanted", label: "Wanted" },
];

const CertificationEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [form, setForm] = useState({
    name: "",
    issuer: "",
    category: "technical",
    description: "",
    image_url: "",
    status: "planned",
    earned_date: "",
    expiration_date: "",
    credential_url: "",
    credential_id: "",
    estimated_cost: "",
    funded_amount: "",
    funding_enabled: true,
    skills: [] as string[],
    admin_notes: "",
    order_index: 0,
  });

  const [newSkill, setNewSkill] = useState("");

  const { data: certification, isLoading } = useQuery({
    queryKey: ["certification-edit", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("certifications")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: isEditing,
  });

  useEffect(() => {
    if (certification) {
      setForm({
        name: certification.name || "",
        issuer: certification.issuer || "",
        category: certification.category || "technical",
        description: certification.description || "",
        image_url: certification.image_url || "",
        status: certification.status || "planned",
        earned_date: certification.earned_date || "",
        expiration_date: certification.expiration_date || "",
        credential_url: certification.credential_url || "",
        credential_id: certification.credential_id || "",
        estimated_cost: certification.estimated_cost?.toString() || "",
        funded_amount: certification.funded_amount?.toString() || "",
        funding_enabled: certification.funding_enabled ?? true,
        skills: certification.skills || [],
        admin_notes: certification.admin_notes || "",
        order_index: certification.order_index || 0,
      });
    }
  }, [certification]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...form,
        estimated_cost: form.estimated_cost ? parseFloat(form.estimated_cost) : null,
        funded_amount: form.funded_amount ? parseFloat(form.funded_amount) : 0,
        earned_date: form.earned_date || null,
        expiration_date: form.expiration_date || null,
        credential_url: form.credential_url || null,
        credential_id: form.credential_id || null,
        image_url: form.image_url || null,
        description: form.description || null,
        admin_notes: form.admin_notes || null,
        category: form.category || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from("certifications")
          .update(data)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("certifications").insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-certifications"] });
      toast.success(isEditing ? "Certification updated" : "Certification created");
      navigate("/admin/certifications");
    },
    onError: (error) => {
      toast.error("Failed to save");
      console.error(error);
    },
  });

  const addSkill = () => {
    if (newSkill && !form.skills.includes(newSkill)) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, newSkill] }));
      setNewSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setForm(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/admin/certifications")} className="p-2 hover:bg-muted rounded">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-display">
              {isEditing ? "Edit Certification" : "Add Certification"}
            </h1>
          </div>
        </div>

        {/* Basic Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Certification Details</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Certification Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., AWS Solutions Architect"
                />
              </div>
              <div>
                <Label htmlFor="issuer">Issuing Organization *</Label>
                <Input
                  id="issuer"
                  value={form.issuer}
                  onChange={(e) => setForm(prev => ({ ...prev, issuer: e.target.value }))}
                  placeholder="e.g., Amazon Web Services"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status *</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {statuses.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                placeholder="What this certification covers and why it's valuable"
              />
            </div>

            <ImageUploader
              value={form.image_url}
              onChange={(url) => setForm(prev => ({ ...prev, image_url: url }))}
              label="Certificate Image or Logo"
              folder="certifications"
            />
          </div>
        </ComicPanel>

        {/* Credential Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Credential Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="earned_date">Date Earned</Label>
                <Input
                  id="earned_date"
                  type="date"
                  value={form.earned_date}
                  onChange={(e) => setForm(prev => ({ ...prev, earned_date: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input
                  id="expiration_date"
                  type="date"
                  value={form.expiration_date}
                  onChange={(e) => setForm(prev => ({ ...prev, expiration_date: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="credential_url">Credential Verification URL</Label>
              <Input
                id="credential_url"
                type="url"
                value={form.credential_url}
                onChange={(e) => setForm(prev => ({ ...prev, credential_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div>
              <Label htmlFor="credential_id">Credential ID</Label>
              <Input
                id="credential_id"
                value={form.credential_id}
                onChange={(e) => setForm(prev => ({ ...prev, credential_id: e.target.value }))}
                placeholder="Certificate ID or number"
              />
            </div>
          </div>
        </ComicPanel>

        {/* Funding */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Funding & Sponsorship</h2>
          <div className="grid gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="funding_enabled"
                checked={form.funding_enabled}
                onChange={(e) => setForm(prev => ({ ...prev, funding_enabled: e.target.checked }))}
                className="w-4 h-4"
              />
              <Label htmlFor="funding_enabled">Allow visitors to sponsor this certification</Label>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="estimated_cost">Estimated Cost ($)</Label>
                <Input
                  id="estimated_cost"
                  type="number"
                  step="0.01"
                  value={form.estimated_cost}
                  onChange={(e) => setForm(prev => ({ ...prev, estimated_cost: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="funded_amount">Funded Amount ($)</Label>
                <Input
                  id="funded_amount"
                  type="number"
                  step="0.01"
                  value={form.funded_amount}
                  onChange={(e) => setForm(prev => ({ ...prev, funded_amount: e.target.value }))}
                />
              </div>
            </div>
          </div>
        </ComicPanel>

        {/* Skills */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Skills Covered</h2>
          <div className="flex gap-2 mb-3">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill"
              onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
            />
            <PopButton size="sm" onClick={addSkill}>
              <Plus className="w-4 h-4" />
            </PopButton>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((skill) => (
              <span key={skill} className="px-3 py-1 bg-muted border-2 border-foreground flex items-center gap-2">
                {skill}
                <button onClick={() => removeSkill(skill)}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </ComicPanel>

        {/* Admin Notes */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Admin Notes</h2>
          <Textarea
            value={form.admin_notes}
            onChange={(e) => setForm(prev => ({ ...prev, admin_notes: e.target.value }))}
            rows={3}
            placeholder="Private notes about this certification..."
          />
        </ComicPanel>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <PopButton variant="secondary" onClick={() => navigate("/admin/certifications")}>
            Cancel
          </PopButton>
          <PopButton onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? "Update" : "Create"} Certification
          </PopButton>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CertificationEditor;
