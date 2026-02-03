import flowerPotHead from "@/assets/artwork/hero/flower-pot-head.png";
import bandageFace from "@/assets/artwork/hero/bandage-face.png";
import ribbonFeet from "@/assets/artwork/hero/ribbon-feet.png";
import anarchistKing from "@/assets/artwork/hero/anarchist-king.png";
import peaceLoveCollage from "@/assets/artwork/hero/peace-love-collage.png";
import maskedFigure from "@/assets/artwork/hero/masked-figure.png";
import wavingPortrait from "@/assets/artwork/hero/waving-portrait.png";

interface DecorativeArtProps {
  variant: "left" | "right" | "corner" | "floating" | "accent";
  className?: string;
}

export const DecorativeArt = ({ variant, className = "" }: DecorativeArtProps) => {
  const variants = {
    left: {
      src: flowerPotHead,
      alt: "Flower Pot Head",
      baseClass: "w-32 md:w-48 opacity-30 -rotate-6",
    },
    right: {
      src: bandageFace,
      alt: "Bandage Face",
      baseClass: "w-40 md:w-56 opacity-25 rotate-6",
    },
    corner: {
      src: ribbonFeet,
      alt: "Ribbon Feet",
      baseClass: "w-36 md:w-52 opacity-20 -rotate-12",
    },
    floating: {
      src: peaceLoveCollage,
      alt: "Peace Love Collage",
      baseClass: "w-48 md:w-64 opacity-20 rotate-3",
    },
    accent: {
      src: maskedFigure,
      alt: "Masked Figure",
      baseClass: "w-28 md:w-36 opacity-25 rotate-8",
    },
  };

  const config = variants[variant];

  return (
    <div className={`pointer-events-none ${config.baseClass} ${className}`}>
      <img
        src={config.src}
        alt={config.alt}
        className="w-full h-auto mix-blend-multiply dark:mix-blend-screen filter contrast-105 saturate-90"
      />
    </div>
  );
};

// Animated art strip component for section breaks
export const ArtStrip = () => {
  const images = [flowerPotHead, bandageFace, anarchistKing, ribbonFeet, peaceLoveCollage, maskedFigure, wavingPortrait];
  
  return (
    <div className="overflow-hidden py-6 bg-pop-navy/5 border-y border-border/20">
      <div className="flex gap-12 animate-scroll-left">
        {[...images, ...images, ...images].map((src, i) => (
          <img
            key={i}
            src={src}
            alt="Decorative art"
            className="h-20 md:h-28 w-auto opacity-50 grayscale-[30%] hover:grayscale-0 hover:opacity-80 transition-all duration-300"
          />
        ))}
      </div>
    </div>
  );
};

// Polaroid-style art strip for more elegant transitions
export const PolaroidStrip = () => {
  const images = [
    { src: flowerPotHead, title: "Bloom" },
    { src: bandageFace, title: "Heal" },
    { src: anarchistKing, title: "Reign" },
    { src: peaceLoveCollage, title: "Peace" },
  ];
  
  return (
    <div className="overflow-hidden py-8 bg-gradient-to-r from-pop-cream via-background to-pop-cream">
      <div className="flex gap-8 justify-center">
        {images.map((img, i) => (
          <div 
            key={i}
            className="bg-card p-2 pb-8 shadow-md"
            style={{ transform: `rotate(${(i % 2 === 0 ? -3 : 3)}deg)` }}
          >
            <img
              src={img.src}
              alt={img.title}
              className="w-24 h-24 md:w-32 md:h-32 object-cover"
            />
            <p className="text-center text-xs mt-2 font-serif italic text-muted-foreground">
              {img.title}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
