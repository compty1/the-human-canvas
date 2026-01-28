import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, LikeButton } from "@/components/pop-art";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Fallback local artwork imports
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

interface ArtworkItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  likes: number;
}

// Static fallback data for when DB is empty or as defaults
const fallbackArtwork: ArtworkItem[] = [
  { id: "golden-hour", title: "Golden Hour", description: "The sun descends over rolling hills - a future artifact of light and land.", image: goldenHour, category: "photography", likes: 34 },
  { id: "sailboat", title: "Sailboat at Dock", description: "Two figures prepare for water - a moment of human activity frozen in time.", image: sailboat, category: "photography", likes: 28 },
  { id: "red-brick", title: "Red Brick Cathedral", description: "Architecture tells stories of those who built it.", image: redBrick, category: "photography", likes: 45 },
  { id: "venice-palms", title: "Venice Palms", description: "Silhouettes reaching skyward - California's iconic sentinels.", image: venicePalms, category: "photography", likes: 31 },
  { id: "cemetery-stone", title: "The 1859 Stone", description: "A gravestone from 1859 - the most literal artifact of humanity.", image: cemeteryStone, category: "photography", likes: 52 },
  { id: "victorian-mansion", title: "Victorian Mansion", description: "Architectural history captured in amber light.", image: victorianMansion, category: "photography", likes: 39 },
  { id: "hollywood-scene", title: "Hollywood Belief", description: "Street culture and belief systems intersecting.", image: hollywoodScene, category: "photography", likes: 27 },
  { id: "anarchist", title: "The Anarchist", description: "Pop art portrait with crown and protest - social commentary through bold color.", image: anarchist, category: "colored", likes: 67 },
  { id: "harlequin", title: "The Harlequin", description: "Masked identity with heterochromia - the duality of self.", image: harlequin, category: "colored", likes: 58 },
  { id: "bandaged-portrait", title: "Bandaged Portrait", description: "Expression through imperfection - the beauty in wounds.", image: bandagedPortrait, category: "colored", likes: 44 },
  { id: "nancy", title: "Nancy Sinatra", description: "Pop art tribute capturing the iconic presence and style of a cultural legend.", image: nancySinatra, category: "colored", likes: 42 },
  { id: "self-portrait", title: "Self Portrait", description: "Introspective digital illustration exploring identity and perception.", image: zacPortrait, category: "colored", likes: 35 },
  { id: "moodboard-1", title: "Moodboard I", description: "A visual exploration of contrast and emotion through minimalist composition.", image: moodboard1, category: "mixed", likes: 24 },
  { id: "moodboard-2", title: "Moodboard II", description: "Continuing the journey into stark visual storytelling.", image: moodboard2, category: "mixed", likes: 18 },
  { id: "composition-55", title: "Composition 55", description: "Abstract exploration of form and texture.", image: piece55, category: "sketch", likes: 15 },
  { id: "composition-56", title: "Composition 56", description: "Study in light, shadow, and emotional depth.", image: piece56, category: "sketch", likes: 12 },
  { id: "composition-57", title: "Composition 57", description: "Raw expression through line and movement.", image: piece57, category: "sketch", likes: 19 },
];

const categories = [
  { id: "all", label: "All Work" },
  { id: "photography", label: "Photography" },
  { id: "colored", label: "Colored Digital" },
  { id: "sketch", label: "Pencil & Sketch" },
  { id: "mixed", label: "Mixed Media" },
  { id: "graphic_design", label: "Graphic Design" },
];

const ArtGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkItem | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

  // Fetch artwork from database
  const { data: dbArtwork = [], isLoading } = useQuery({
    queryKey: ["artwork-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("artwork")
        .select("id, title, description, image_url, category")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Merge database artwork with fallback, prioritizing database items
  const artworkData: ArtworkItem[] = [
    // Database artwork first
    ...dbArtwork.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description || "",
      image: item.image_url,
      category: item.category || "mixed",
      likes: 0, // Likes would come from likes table in production
    })),
    // Then fallback artwork for items not in DB (check by title to avoid duplicates)
    ...fallbackArtwork.filter(
      fallback => !dbArtwork.some(db => db.title.toLowerCase() === fallback.title.toLowerCase())
    ),
  ];

  const filteredArtwork =
    selectedCategory === "all"
      ? artworkData
      : artworkData.filter((item) => item.category === selectedCategory);

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

      {/* Gallery Grid */}
      <section className="py-16 screen-print">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredArtwork.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-xl text-muted-foreground">
                No artwork in this category yet. More coming soon!
              </p>
            </div>
          ) : (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {filteredArtwork.map((artwork, index) => (
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
                        {artwork.category.replace("_", " ")}
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
          )}
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 bg-foreground text-background">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-display text-pop-yellow mb-8">
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
                    {selectedArtwork.category.replace("_", " ")}
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
