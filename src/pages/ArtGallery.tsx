import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ComicPanel, HalftoneImage, LikeButton } from "@/components/pop-art";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";

import moodboard1 from "@/assets/artwork/moodboard-1.png";
import moodboard2 from "@/assets/artwork/moodboard-2.png";
import nancySinatra from "@/assets/artwork/nancy-sinatra.png";
import zacPortrait from "@/assets/artwork/zac-portrait.png";
import piece55 from "@/assets/artwork/piece-55.png";
import piece56 from "@/assets/artwork/piece-56.png";
import piece57 from "@/assets/artwork/piece-57.png";

interface ArtworkItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  likes: number;
}

const artworkData: ArtworkItem[] = [
  {
    id: "1",
    title: "Moodboard I",
    description: "A visual exploration of contrast and emotion through minimalist composition.",
    image: moodboard1,
    category: "mixed",
    likes: 24,
  },
  {
    id: "2",
    title: "Moodboard II",
    description: "Continuing the journey into stark visual storytelling.",
    image: moodboard2,
    category: "mixed",
    likes: 18,
  },
  {
    id: "3",
    title: "Nancy Sinatra",
    description: "Pop art tribute capturing the iconic presence and style of a cultural legend.",
    image: nancySinatra,
    category: "colored",
    likes: 42,
  },
  {
    id: "4",
    title: "Self Portrait",
    description: "Introspective digital illustration exploring identity and perception.",
    image: zacPortrait,
    category: "colored",
    likes: 35,
  },
  {
    id: "5",
    title: "Composition 55",
    description: "Abstract exploration of form and texture.",
    image: piece55,
    category: "sketch",
    likes: 15,
  },
  {
    id: "6",
    title: "Composition 56",
    description: "Study in light, shadow, and emotional depth.",
    image: piece56,
    category: "sketch",
    likes: 12,
  },
  {
    id: "7",
    title: "Composition 57",
    description: "Raw expression through line and movement.",
    image: piece57,
    category: "sketch",
    likes: 19,
  },
];

const categories = [
  { id: "all", label: "All Work" },
  { id: "colored", label: "Colored Digital" },
  { id: "sketch", label: "Pencil & Sketch" },
  { id: "mixed", label: "Mixed Media" },
];

const ArtGallery = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedArtwork, setSelectedArtwork] = useState<ArtworkItem | null>(null);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());

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
            Exploring the human experience through visual art — portraits, abstracts,
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
                      {artwork.category}
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
                    {selectedArtwork.category}
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
