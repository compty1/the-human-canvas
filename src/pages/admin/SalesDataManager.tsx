import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Plus, Trash2, Loader2, TrendingUp } from "lucide-react";
import { toast } from "sonner";

interface SalesData {
  id: string;
  period: string;
  category: string;
  amount: number;
  units_sold: number | null;
  notes: string | null;
  created_at: string;
}

const categories = ["stickers", "art", "commissions", "prints", "digital", "other"];

const SalesDataManager = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    period: "",
    category: "stickers",
    amount: "",
    units_sold: "",
    notes: "",
  });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ["sales-data"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_data")
        .select("*")
        .order("period", { ascending: false });
      if (error) throw error;
      return data as SalesData[];
    },
  });

  const addSaleMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sales_data").insert({
        period: form.period,
        category: form.category,
        amount: parseFloat(form.amount),
        units_sold: form.units_sold ? parseInt(form.units_sold) : null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-data"] });
      toast.success("Sales data added");
      setForm({ period: "", category: "stickers", amount: "", units_sold: "", notes: "" });
    },
    onError: (error) => {
      toast.error("Failed to add sales data");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sales_data").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sales-data"] });
      toast.success("Deleted");
    },
  });

  // Calculate totals
  const totalRevenue = sales.reduce((sum, s) => sum + s.amount, 0);
  const totalUnits = sales.reduce((sum, s) => sum + (s.units_sold || 0), 0);
  const byCategory = sales.reduce((acc, s) => {
    acc[s.category] = (acc[s.category] || 0) + s.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-display">Sales Data</h1>
          <p className="text-muted-foreground">Track sticker, art, and commission sales</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4">
          <ComicPanel className="p-4 text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-2 text-primary" />
            <div className="text-3xl font-display">${totalRevenue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Revenue</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <div className="text-3xl font-display">{totalUnits}</div>
            <div className="text-sm text-muted-foreground">Units Sold</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{sales.length}</div>
            <div className="text-sm text-muted-foreground">Records</div>
          </ComicPanel>
          <ComicPanel className="p-4 text-center">
            <div className="text-3xl font-display">{Object.keys(byCategory).length}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </ComicPanel>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Add Form */}
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">Add Sales Record</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="period">Period (e.g., 2024-Q1, Jan 2024)</Label>
                <Input
                  id="period"
                  value={form.period}
                  onChange={(e) => setForm(prev => ({ ...prev, period: e.target.value }))}
                  placeholder="2024-Q1"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 px-3 border-2 border-input bg-background"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="amount">Amount ($)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="units">Units Sold (optional)</Label>
                <Input
                  id="units"
                  type="number"
                  value={form.units_sold}
                  onChange={(e) => setForm(prev => ({ ...prev, units_sold: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>

              <PopButton 
                onClick={() => addSaleMutation.mutate()}
                disabled={!form.period || !form.amount || addSaleMutation.isPending}
                className="w-full justify-center"
              >
                {addSaleMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add Record
              </PopButton>
            </div>
          </ComicPanel>

          {/* Sales List */}
          <ComicPanel className="p-6 lg:col-span-2">
            <h2 className="text-xl font-display mb-4">Sales Records</h2>

            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto" />
              </div>
            ) : sales.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No sales data yet</p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {sales.map((sale) => (
                  <div key={sale.id} className="flex items-center gap-4 p-3 border-2 border-foreground bg-background">
                    <div className="flex-grow">
                      <div className="font-bold">{sale.period}</div>
                      <div className="text-sm text-muted-foreground">
                        {sale.category} {sale.units_sold && `• ${sale.units_sold} units`}
                      </div>
                      {sale.notes && (
                        <div className="text-xs text-muted-foreground truncate">{sale.notes}</div>
                      )}
                    </div>
                    <div className="text-lg font-display text-primary">
                      ${sale.amount.toLocaleString()}
                    </div>
                    <button
                      onClick={() => deleteMutation.mutate(sale.id)}
                      className="p-1 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ComicPanel>
        </div>

        {/* Category Breakdown */}
        {Object.keys(byCategory).length > 0 && (
          <ComicPanel className="p-6">
            <h2 className="text-xl font-display mb-4">Revenue by Category</h2>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
              {Object.entries(byCategory).map(([cat, amount]) => (
                <div key={cat} className="p-4 bg-muted border-2 border-foreground text-center">
                  <div className="text-xl font-display">${amount.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground capitalize">{cat}</div>
                </div>
              ))}
            </div>
          </ComicPanel>
        )}
      </div>
    </AdminLayout>
  );
};

export default SalesDataManager;
