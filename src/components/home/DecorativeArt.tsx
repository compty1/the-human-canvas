import flowerPotHead from "@/assets/artwork/hero/flower-pot-head.png";
import bandageFace from "@/assets/artwork/hero/bandage-face.png";
import ribbonFeet from "@/assets/artwork/hero/ribbon-feet.png";
import anarchistKing from "@/assets/artwork/hero/anarchist-king.png";
import peaceLoveCollage from "@/assets/artwork/hero/peace-love-collage.png";

interface DecorativeArtProps {
  variant: "left" | "right" | "corner" | "floating";
  className?: string;
}

export const DecorativeArt = ({ variant, className = "" }: DecorativeArtProps) => {
  const variants = {
    left: {
      src: flowerPotHead,
      alt: "Flower Pot Head",
      baseClass: "w-32 md:w-48 opacity-40 -rotate-6",
    },
    right: {
      src: bandageFace,
      alt: "Bandage Face",
      baseClass: "w-40 md:w-56 opacity-35 rotate-6",
    },
    corner: {
      src: ribbonFeet,
      alt: "Ribbon Feet",
      baseClass: "w-36 md:w-52 opacity-30 -rotate-12",
    },
    floating: {
      src: peaceLoveCollage,
      alt: "Peace Love Collage",
      baseClass: "w-48 md:w-64 opacity-25 rotate-3",
    },
  };

  const config = variants[variant];

  return (
    <div className={`pointer-events-none ${config.baseClass} ${className}`}>
      <img
        src={config.src}
        alt={config.alt}
        className="w-full h-auto mix-blend-multiply dark:mix-blend-screen filter contrast-110"
      />
    </div>
  );
};

// Accent strip component for section breaks
export const ArtStrip = () => {
  const images = [flowerPotHead, bandageFace, anarchistKing, ribbonFeet, peaceLoveCollage];
  
  return (
    <div className="overflow-hidden py-4 bg-foreground/5">
      <div className="flex gap-8 animate-scroll-left">
        {[...images, ...images, ...images].map((src, i) => (
          <img
            key={i}
            src={src}
            alt="Decorative art"
            className="h-24 md:h-32 w-auto opacity-60 grayscale hover:grayscale-0 transition-all duration-300"
          />
        ))}
      </div>
    </div>
  );
};
