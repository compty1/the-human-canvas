import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Save, Download, Key, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast.error("Failed to update password");
      console.error(error);
    } finally {
      setChangingPassword(false);
    }
  };

  const exportAllData = async () => {
    setExporting(true);
    try {
      const tables = ["projects", "articles", "updates", "artwork", "skills", "learning_goals", "admin_notes"];
      const exportData: Record<string, unknown[]> = {};

      for (const table of tables) {
        const { data, error } = await supabase.from(table as "projects").select("*");
        if (error) throw error;
        exportData[table] = data || [];
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
    } catch (error) {
      toast.error("Failed to export data");
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-display">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Account Info */}
        <ComicPanel className="p-6">
          <h2 className="text-xl font-display mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground">Email</Label>
              <p className="font-bold">{user?.email || "Not logged in"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">User ID</Label>
              <p className="text-sm font-mono text-muted-foreground">{user?.id || "N/A"}</p>
            </div>
          </div>
        </ComicPanel>

        {/* Change Password */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5" />
            <h2 className="text-xl font-display">Change Password</h2>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            <PopButton 
              onClick={handlePasswordChange} 
              disabled={changingPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Update Password
            </PopButton>
          </div>
        </ComicPanel>

        {/* Data Export */}
        <ComicPanel className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Download className="w-5 h-5" />
            <h2 className="text-xl font-display">Export Data</h2>
          </div>
          <p className="text-muted-foreground mb-4">
            Download all your content as a JSON file. Includes projects, articles, updates, artwork, skills, learning goals, and notes.
          </p>
          <PopButton onClick={exportAllData} disabled={exporting}>
            {exporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export All Data
          </PopButton>
        </ComicPanel>

        {/* Danger Zone */}
        <ComicPanel className="p-6 border-destructive">
          <h2 className="text-xl font-display text-destructive mb-4">Danger Zone</h2>
          <p className="text-muted-foreground mb-4">
            These actions are irreversible. Please be careful.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact support if you need to delete your account or perform other destructive actions.
          </p>
        </ComicPanel>
      </div>
    </AdminLayout>
  );
};

export default Settings;
