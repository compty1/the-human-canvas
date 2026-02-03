import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ComicPanel, PopButton } from "@/components/pop-art";
import { BulkActionsBar, SelectableCheckbox, useSelection } from "@/components/admin/BulkActionsBar";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Eye,
  Star,
  CheckSquare
} from "lucide-react";
import { toast } from "sonner";

const ProductReviewsManager = () => {
  const [search, setSearch] = useState("");
  const queryClient = useQueryClient();
  const { selectedIds, toggleSelection, selectAll, clearSelection } = useSelection();

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin-product-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-product-reviews"] });
      toast.success("Review deleted");
    },
    onError: () => {
      toast.error("Failed to delete review");
    },
  });

  const filteredReviews = reviews?.filter(r => 
    r.product_name.toLowerCase().includes(search.toLowerCase()) ||
    r.company.toLowerCase().includes(search.toLowerCase())
  );

  const getRatingColor = (rating: number | null) => {
    if (!rating) return "bg-muted";
    if (rating >= 8) return "bg-green-500";
    if (rating >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const handleSelectAll = () => {
    if (filteredReviews) {
      if (selectedIds.length === filteredReviews.length) {
        clearSelection();
      } else {
        selectAll(filteredReviews.map((r) => r.id));
      }
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-display">Product Reviews</h1>
            <p className="text-muted-foreground">Manage your UX reviews and case studies</p>
          </div>
          <div className="flex items-center gap-2">
            {filteredReviews && filteredReviews.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="flex items-center gap-2 px-3 py-2 border-2 border-foreground hover:bg-muted transition-colors"
              >
                <CheckSquare className="w-4 h-4" />
                {selectedIds.length === filteredReviews.length ? "Deselect All" : "Select All"}
              </button>
            )}
            <Link to="/admin/product-reviews/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> New Review
              </PopButton>
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded" />
            ))}
          </div>
        ) : filteredReviews && filteredReviews.length > 0 ? (
          <div className="space-y-4">
            {filteredReviews.map((review) => (
              <ComicPanel key={review.id} className="p-4">
                <div className="flex items-start gap-4">
                  {/* Selection checkbox */}
                  <SelectableCheckbox
                    id={review.id}
                    selectedIds={selectedIds}
                    onToggle={toggleSelection}
                  />

                  {/* Rating Badge */}
                  <div className={`w-16 h-16 ${getRatingColor(review.overall_rating)} flex items-center justify-center border-2 border-foreground flex-shrink-0`}>
                    <div className="text-center">
                      <Star className="w-4 h-4 mx-auto text-white" />
                      <span className="text-xl font-bold text-white">{review.overall_rating || "?"}</span>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-xl font-display">{review.product_name}</h3>
                          <span className={`px-2 py-0.5 text-xs font-bold uppercase ${review.published ? "bg-pop-cyan" : "bg-muted"}`}>
                            {review.published ? "Published" : "Draft"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{review.company} • {review.category}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{review.summary}</p>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link 
                          to={`/product-reviews/${review.slug}`}
                          className="p-2 hover:bg-muted rounded"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/admin/product-reviews/${review.id}/edit`}
                          className="p-2 hover:bg-muted rounded"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => {
                            if (confirm("Delete this review?")) {
                              deleteMutation.mutate(review.id);
                            }
                          }}
                          className="p-2 hover:bg-destructive/10 rounded text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Meta */}
                    <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                      {review.pain_points && review.pain_points.length > 0 && (
                        <span>{review.pain_points.length} pain points</span>
                      )}
                      {review.improvement_suggestions && review.improvement_suggestions.length > 0 && (
                        <span>{review.improvement_suggestions.length} suggestions</span>
                      )}
                      <span>
                        Updated: {new Date(review.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </ComicPanel>
            ))}
          </div>
        ) : (
          <ComicPanel className="p-12 text-center">
            <p className="text-muted-foreground mb-4">No product reviews found</p>
            <Link to="/admin/product-reviews/new">
              <PopButton>
                <Plus className="w-4 h-4 mr-2" /> Create Your First Review
              </PopButton>
            </Link>
          </ComicPanel>
        )}

        {/* Bulk Actions Bar */}
        <BulkActionsBar
          selectedIds={selectedIds}
          onClearSelection={clearSelection}
          tableName="product_reviews"
          queryKey={["admin-product-reviews"]}
          actions={["publish", "unpublish", "delete"]}
          statusField="published"
        />
      </div>
    </AdminLayout>
  );
};

export default ProductReviewsManager;
