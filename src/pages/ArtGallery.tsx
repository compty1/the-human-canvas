import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, LikeButton } from "@/components/pop-art";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Local asset imports for resolving paths
import moodboard1 from "@/assets/artwork/moodboard-1.png";
import moodboard2 from "@/assets/artwork/moodboard-2.png";
import nancySinatra from "@/assets/artwork/nancy-sinatra.png";
import zacPortrait from "@/assets/artwork/zac-portrait.png";
import piece55 from "@/assets/artwork/piece-55.png";
import piece56 from "@/assets/artwork/piece-56.png";
import piece57 from "@/assets/artwork/piece-57.png";
import goldenHour from "@/assets/artwork/golden-hour.png";
import sailboat from "@/assets/artwork/sailboat.png";
import redBrick from "@/assets/artwork/red-brick.png";
import venicePalms from "@/assets/artwork/venice-palms.png";
import cemeteryStone from "@/assets/artwork/cemetery-stone.png";
import victorianMansion from "@/assets/artwork/victorian-mansion.png";
import hollywoodScene from "@/assets/artwork/hollywood-scene.png";
import anarchist from "@/assets/artwork/anarchist.png";
import harlequin from "@/assets/artwork/harlequin.png";
import bandagedPortrait from "@/assets/artwork/bandaged-portrait.png";

// Map local paths to resolved imports
const localAssetMap: Record<string, string> = {
  "/src/assets/artwork/moodboard-1.png": moodboard1,
  "/src/assets/artwork/moodboard-2.png": moodboard2,
  "/src/assets/artwork/nancy-sinatra.png": nancySinatra,
  "/src/assets/artwork/zac-portrait.png": zacPortrait,
  "/src/assets/artwork/piece-55.png": piece55,
  "/src/assets/artwork/piece-56.png": piece56,
  "/src/assets/artwork/piece-57.png": piece57,
  "/src/assets/artwork/golden-hour.png": goldenHour,
  "/src/assets/artwork/sailboat.png": sailboat,
  "/src/assets/artwork/red-brick.png": redBrick,
  "/src/assets/artwork/venice-palms.png": venicePalms,
  "/src/assets/artwork/cemetery-stone.png": cemeteryStone,
  "/src/assets/artwork/victorian-mansion.png": victorianMansion,
  "/src/assets/artwork/hollywood-scene.png": hollywoodScene,
  "/src/assets/artwork/anarchist.png": anarchist,
  "/src/assets/artwork/harlequin.png": harlequin,
  "/src/assets/artwork/bandaged-portrait.png": bandagedPortrait,
};

// Resolve image URL - converts local asset paths to imported modules
const resolveImageUrl = (url: string): string => {
  return localAssetMap[url] || url;
};

interface ArtworkItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  likes: number;
  created_at?: string;
}

// Media categories
const categories = [
  { id: "all", label: "All Work" },
  { id: "photography", label: "Photography" },
  { id: "colored", label: "Colored Digital" },
  { id: "sketch", label: "Pencil & Sketch" },
  { id: "mixed", label: "Mixed Media" },
  { id: "graphic_design", label: "Graphic Design" },
];

// Period sections
interface PeriodSection {
  id: string;
  title: string;
  subtitle: string;
  yearRange: string;
  startYear: number;
  endYear: number;
}

const periodSections: PeriodSection[] = [
  {
    id: "current",
    title: "Current Work",
    subtitle: "Ongoing creative exploration",
    yearRange: "2020-Present",
    startYear: 2020,
    endYear: 9999,
  },
  {
    id: "experimentation",
    title: "Continuation of Experimentation",
    subtitle: "Expanding techniques and finding voice",
    yearRange: "2015-2019",
    startYear: 2015,
    endYear: 2019,
  },
  {
    id: "foundational",
    title: "Older Foundational Work",
    subtitle: "Early explorations and artistic beginnings",
    yearRange: "2011-2015",
    startYear: 2011,
    endYear: 2014,
  },
];

const ArtGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkItem | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [expandedPeriods, setExpandedPeriods] = useState<Set<string>>(new Set(["current"]));

  // Fetch all artwork from database
  const { data: dbArtwork = [], isLoading } = useQuery({
    queryKey: ["artwork-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artwork")
        .select("id, title, description, image_url, category, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Map database artwork to display format
  const artworkData: ArtworkItem[] = dbArtwork.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description || "",
    image: resolveImageUrl(item.image_url),
    category: item.category || "mixed",
    likes: 0,
    created_at: item.created_at,
  }));

  // Filter by category
  const filteredByCategory =
    selectedCategory === "all"
      ? artworkData
      : artworkData.filter((item) => item.category === selectedCategory);

  // Group artwork by period based on created_at year
  const getArtworkYear = (item: ArtworkItem): number => {
    if (!item.created_at) return new Date().getFullYear();
    return new Date(item.created_at).getFullYear();
  };

  const getArtworkByPeriod = (period: PeriodSection): ArtworkItem[] => {
    return filteredByCategory.filter(item => {
      const year = getArtworkYear(item);
      return year >= period.startYear && year <= period.endYear;
    });
  };

  // Group by category within a period
  const groupByCategory = (items: ArtworkItem[]): Record<string, ArtworkItem[]> => {
    return items.reduce((acc, item) => {
      const cat = item.category || "mixed";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, ArtworkItem[]>);
  };

  const toggleLike = (id: string) => {
    setLikedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const togglePeriod = (periodId: string) => {
    setExpandedPeriods(prev => {
      const newSet = new Set(prev);
      if (newSet.has(periodId)) {
        newSet.delete(periodId);
      } else {
        newSet.add(periodId);
      }
      return newSet;
    });
  };

  const getCategoryLabel = (categoryId: string): string => {
    return categories.find(c => c.id === categoryId)?.label || categoryId.replace(/_/g, " ");
  };

  return (
    <Layout>
      {/* Hero */}
      <section className="py-20 benday-dots">
        <div className="container mx-auto px-4">
          <div className="caption-box inline-block mb-4">Visual Art</div>
          <h1 className="text-5xl md:text-7xl font-display gradient-text mb-6">
            Art Gallery
          </h1>
          <p className="text-xl font-sans max-w-2xl text-muted-foreground">
            Future artifacts of humanity — each piece is a direct channel of my 
            interpretation of reality and experience. Photography, portraits, abstracts,
            and compositions that reflect society, emotion, and transformation.
          </p>
        </div>
      </section>

      {/* Filter */}
      <section className="py-8 border-y-4 border-foreground bg-background sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 font-bold uppercase text-sm tracking-wide border-2 border-foreground transition-all ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery by Period */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredByCategory.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                No artwork in this category yet. More coming soon!
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {periodSections.map((period) => {
                const periodArtwork = getArtworkByPeriod(period);
                if (periodArtwork.length === 0) return null;
                
                const isExpanded = expandedPeriods.has(period.id);
                const groupedArtwork = groupByCategory(periodArtwork);

                return (
                  <div key={period.id} className="border-4 border-foreground">
                    {/* Period Header */}
                    <button
                      onClick={() => togglePeriod(period.id)}
                      className="w-full p-6 bg-muted flex items-center justify-between hover:bg-accent transition-colors"
                    >
                      <div className="text-left">
                        <h2 className="text-3xl font-display">{period.title}</h2>
                        <p className="text-muted-foreground">{period.subtitle}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-primary text-primary-foreground text-sm font-bold">
                          {period.yearRange} • {periodArtwork.length} pieces
                        </span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-8 h-8" />
                      ) : (
                        <ChevronDown className="w-8 h-8" />
                      )}
                    </button>

                    {/* Period Content */}
                    {isExpanded && (
                      <div className="p-6 space-y-8">
                        {Object.entries(groupedArtwork).map(([categoryId, items]) => (
                          <div key={categoryId}>
                            {/* Category Subheader */}
                            <div className="flex items-center gap-4 mb-4">
                              <h3 className="text-xl font-display capitalize">
                                {getCategoryLabel(categoryId)}
                              </h3>
                              <span className="text-sm text-muted-foreground">
                                ({items.length})
                              </span>
                              <div className="flex-1 h-0.5 bg-foreground/20" />
                            </div>

                            {/* Artwork Grid */}
                            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
                              {items.map((artwork, index) => (
                                <ComicPanel
                                  key={artwork.id}
                                  className={`break-inside-avoid p-4 animate-fade-in stagger-${(index % 5) + 1}`}
                                  onClick={() => setSelectedArtwork(artwork)}
                                >
                                  <div className="halftone-overlay overflow-hidden border-2 border-foreground">
                                    <img
                                      src={artwork.image}
                                      alt={artwork.title}
                                      className="w-full h-auto object-cover transition-transform duration-300 hover:scale-105"
                                    />
                                  </div>
                                  <div className="mt-4 flex justify-between items-start">
                                    <div>
                                      <h3 className="text-xl font-display">{artwork.title}</h3>
                                      <p className="text-sm text-muted-foreground capitalize">
                                        {artwork.category.replace(/_/g, " ")}
                                      </p>
                                    </div>
                                    <LikeButton
                                      count={artwork.likes + (likedItems.has(artwork.id) ? 1 : 0)}
                                      liked={likedItems.has(artwork.id)}
                                      onLike={() => toggleLike(artwork.id)}
                                    />
                                  </div>
                                </ComicPanel>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-display text-pop-gold mb-8">
              Future Artifacts of Humanity
            </h2>
            <p className="text-lg font-sans leading-relaxed">
              I view culture and our creations as future artifacts — imagine a being 
              discovering our remnants in ancient ruins thousands of years from now. 
              Each photograph, each portrait, each composition is a document of our 
              existence, a fragment of the human experience preserved in pixels and 
              pigment. Inspired by the narrative intensity of Brett Helquist and the 
              raw emotion of the human condition.
            </p>
          </div>
        </div>
      </section>

      {/* Detail Modal */}
      <Dialog open={!!selectedArtwork} onOpenChange={() => setSelectedArtwork(null)}>
        <DialogContent className="max-w-4xl p-0 border-4 border-foreground bg-background">
          <DialogTitle className="sr-only">
            {selectedArtwork?.title || "Artwork details"}
          </DialogTitle>
          {selectedArtwork && (
            <div className="relative">
              <button
                onClick={() => setSelectedArtwork(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-background border-2 border-foreground"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="grid md:grid-cols-2">
                <div className="halftone-overlay">
                  <img
                    src={selectedArtwork.image}
                    alt={selectedArtwork.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8">
                  <div className="caption-box inline-block mb-4 capitalize">
                    {selectedArtwork.category.replace(/_/g, " ")}
                  </div>
                  <h2 className="text-4xl font-display mb-4">
                    {selectedArtwork.title}
                  </h2>
                  <p className="text-lg font-sans text-muted-foreground mb-6">
                    {selectedArtwork.description}
                  </p>
                  <LikeButton
                    count={
                      selectedArtwork.likes +
                      (likedItems.has(selectedArtwork.id) ? 1 : 0)
                    }
                    liked={likedItems.has(selectedArtwork.id)}
                    onLike={() => toggleLike(selectedArtwork.id)}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ArtGallery;
