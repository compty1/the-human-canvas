import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface Supply {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  product_url: string | null;
  price: number;
  funded_amount: number;
  priority: string;
  category: string;
  status: string;
  created_at: string;
}

const defaultSupply = {
  name: "",
  description: "",
  image_url: "",
  product_url: "",
  price: 0,
  funded_amount: 0,
  priority: "medium",
  category: "Equipment",
  status: "needed",
};

const SuppliesManager = () => {
  const queryClient = useQueryClient();
  const [editingSupply, setEditingSupply] = useState<Partial<Supply> | null>(null);
  const [isNew, setIsNew] = useState(false);

  const { data: supplies = [], isLoading } = useQuery({
    queryKey: ["admin-supplies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplies_needed")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Supply[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (supply: Partial<Supply>) => {
      if (supply.id) {
        const { error } = await supabase
          .from("supplies_needed")
          .update({
            name: supply.name,
            description: supply.description,
            image_url: supply.image_url,
            product_url: supply.product_url,
            price: supply.price,
            funded_amount: supply.funded_amount,
            priority: supply.priority,
            category: supply.category,
            status: supply.status,
          })
          .eq("id", supply.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("supplies_needed").insert({
          name: supply.name,
          description: supply.description,
          image_url: supply.image_url,
          product_url: supply.product_url,
          price: supply.price,
          funded_amount: supply.funded_amount || 0,
          priority: supply.priority,
          category: supply.category,
          status: supply.status,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-supplies"] });
      toast.success(isNew ? "Supply added!" : "Supply updated!");
      setEditingSupply(null);
    },
    onError: (error) => {
      toast.error("Failed to save supply");
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("supplies_needed")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-supplies"] });
      toast.success("Supply deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete supply");
      console.error(error);
    },
  });

  const openNewDialog = () => {
    setIsNew(true);
    setEditingSupply({ ...defaultSupply });
  };

  const openEditDialog = (supply: Supply) => {
    setIsNew(false);
    setEditingSupply({ ...supply });
  };

  const statusColors: Record<string, string> = {
    needed: "bg-orange-100 text-orange-700",
    partially_funded: "bg-blue-100 text-blue-700",
    funded: "bg-green-100 text-green-700",
    purchased: "bg-purple-100 text-purple-700",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display">Supplies Manager</h1>
            <p className="text-muted-foreground">
              Manage equipment and supplies wishlist
            </p>
          </div>
          <PopButton onClick={openNewDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Supply
          </PopButton>
        </div>

        {/* Supplies List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : supplies.length === 0 ? (
          <ComicPanel className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-display mb-2">No Supplies Yet</h3>
            <p className="text-muted-foreground mb-4">
              Add equipment and supplies you need
            </p>
            <PopButton onClick={openNewDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Supply
            </PopButton>
          </ComicPanel>
        ) : (
          <div className="grid gap-4">
            {supplies.map((supply) => {
              const progress =
                supply.price > 0
                  ? (supply.funded_amount / supply.price) * 100
                  : 0;

              return (
                <ComicPanel key={supply.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    {supply.image_url && (
                      <img
                        src={supply.image_url}
                        alt={supply.name}
                        className="w-24 h-24 object-cover border-2 border-foreground"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-0.5 text-xs font-bold uppercase ${
                            statusColors[supply.status] || statusColors.needed
                          }`}
                        >
                          {supply.status.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {supply.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          • {supply.priority} priority
                        </span>
                      </div>
                      <h3 className="text-lg font-display">{supply.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {supply.description}
                      </p>

                      {/* Progress */}
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex-grow max-w-xs">
                          <div className="h-2 bg-muted border border-foreground overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min(progress, 100)}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm">
                          ${supply.funded_amount} / ${supply.price}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {supply.product_url && (
                        <a
                          href={supply.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded"
                          title="View Product"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => openEditDialog(supply)}
                        className="p-2 hover:bg-muted rounded"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this supply?")) {
                            deleteMutation.mutate(supply.id);
                          }
                        }}
                        className="p-2 hover:bg-destructive/10 rounded text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </ComicPanel>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingSupply} onOpenChange={() => setEditingSupply(null)}>
        <DialogContent className="max-w-lg border-4 border-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-display">
              {isNew ? "Add Supply" : "Edit Supply"}
            </DialogTitle>
          </DialogHeader>

          {editingSupply && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={editingSupply.name || ""}
                  onChange={(e) =>
                    setEditingSupply({ ...editingSupply, name: e.target.value })
                  }
                  placeholder="e.g., Laser Color Printer"
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingSupply.description || ""}
                  onChange={(e) =>
                    setEditingSupply({
                      ...editingSupply,
                      description: e.target.value,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    value={editingSupply.price || 0}
                    onChange={(e) =>
                      setEditingSupply({
                        ...editingSupply,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Funded Amount ($)</Label>
                  <Input
                    type="number"
                    value={editingSupply.funded_amount || 0}
                    onChange={(e) =>
                      setEditingSupply({
                        ...editingSupply,
                        funded_amount: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <select
                    value={editingSupply.priority || "medium"}
                    onChange={(e) =>
                      setEditingSupply({
                        ...editingSupply,
                        priority: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <Label>Status</Label>
                  <select
                    value={editingSupply.status || "needed"}
                    onChange={(e) =>
                      setEditingSupply({
                        ...editingSupply,
                        status: e.target.value,
                      })
                    }
                    className="w-full h-10 px-3 border-2 border-input bg-background"
                  >
                    <option value="needed">Needed</option>
                    <option value="partially_funded">Partially Funded</option>
                    <option value="funded">Funded</option>
                    <option value="purchased">Purchased</option>
                  </select>
                </div>
              </div>

              <div>
                <Label>Category</Label>
                <Input
                  value={editingSupply.category || ""}
                  onChange={(e) =>
                    setEditingSupply({
                      ...editingSupply,
                      category: e.target.value,
                    })
                  }
                  placeholder="e.g., Equipment, Software, Materials"
                />
              </div>

              <div>
                <Label>Product URL</Label>
                <Input
                  value={editingSupply.product_url || ""}
                  onChange={(e) =>
                    setEditingSupply({
                      ...editingSupply,
                      product_url: e.target.value,
                    })
                  }
                  placeholder="https://amazon.com/..."
                />
              </div>

              <ImageUploader
                value={editingSupply.image_url || ""}
                onChange={(url) =>
                  setEditingSupply({ ...editingSupply, image_url: url })
                }
                label="Product Image"
                folder="supplies"
              />

              <div className="flex justify-end gap-2 pt-4">
                <button
                  onClick={() => setEditingSupply(null)}
                  className="px-4 py-2 border-2 border-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <PopButton
                  onClick={() => saveMutation.mutate(editingSupply)}
                  disabled={saveMutation.isPending}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : null}
                  Save
                </PopButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default SuppliesManager;
