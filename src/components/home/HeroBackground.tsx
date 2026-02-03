import anarchistKing from "@/assets/artwork/hero/anarchist-king.png";
import blueShirt from "@/assets/artwork/hero/blue-shirt.png";
import crackOrTweak from "@/assets/artwork/hero/crack-or-tweak.png";
import maskedFigure from "@/assets/artwork/hero/masked-figure.png";
import peaceLoveCollage from "@/assets/artwork/hero/peace-love-collage.png";
import wavingPortrait from "@/assets/artwork/hero/waving-portrait.png";
import medusaHair from "@/assets/artwork/hero/medusa-hair.jpg";
import flowerPotHead from "@/assets/artwork/hero/flower-pot-head.png";
import bandageFace from "@/assets/artwork/hero/bandage-face.png";
import ribbonFeet from "@/assets/artwork/hero/ribbon-feet.png";

// Curated collage layout - intentional placement for visual impact
const collageImages = [
  // Large featured images
  { 
    src: anarchistKing, 
    alt: "Anarchist King", 
    className: "top-0 left-0 w-56 md:w-72 opacity-50",
    style: { transform: "rotate(-8deg)" }
  },
  { 
    src: peaceLoveCollage, 
    alt: "Peace Love Collage", 
    className: "bottom-10 right-0 w-64 md:w-80 opacity-45",
    style: { transform: "rotate(5deg)" }
  },
  // Medium accent images
  { 
    src: flowerPotHead, 
    alt: "Flower Pot Head", 
    className: "top-1/4 right-10 w-44 md:w-56 opacity-40",
    style: { transform: "rotate(8deg)" }
  },
  { 
    src: bandageFace, 
    alt: "Bandage Face", 
    className: "bottom-1/4 left-10 w-48 md:w-60 opacity-45",
    style: { transform: "rotate(-5deg)" }
  },
  // Smaller floating pieces
  { 
    src: maskedFigure, 
    alt: "Masked Figure", 
    className: "top-1/3 left-1/4 w-32 md:w-40 opacity-30",
    style: { transform: "rotate(-3deg)" }
  },
  { 
    src: wavingPortrait, 
    alt: "Waving Portrait", 
    className: "top-10 right-1/4 w-36 md:w-44 opacity-35",
    style: { transform: "rotate(10deg)" }
  },
  { 
    src: crackOrTweak, 
    alt: "Crack or Tweak", 
    className: "bottom-20 left-1/3 w-40 md:w-48 opacity-30",
    style: { transform: "rotate(4deg)" }
  },
  { 
    src: ribbonFeet, 
    alt: "Ribbon Feet", 
    className: "top-1/2 right-1/3 w-36 md:w-44 opacity-25",
    style: { transform: "rotate(-7deg)" }
  },
];

export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Warm gradient base */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsl(var(--pop-gold) / 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, hsl(var(--pop-terracotta) / 0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, hsl(var(--pop-teal) / 0.08) 0%, transparent 60%),
            hsl(var(--background))
          `
        }}
      />
      
      {/* Curated artwork collage */}
      {collageImages.map((img, i) => (
        <div
          key={i}
          className={`absolute ${img.className} animate-float transition-transform duration-1000`}
          style={{
            ...img.style,
            animationDelay: `${i * 0.7}s`,
            animationDuration: `${10 + i * 0.8}s`,
          }}
        >
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-auto mix-blend-multiply dark:mix-blend-screen filter contrast-110 saturate-90"
          />
        </div>
      ))}
      
      {/* Subtle halftone dot overlay */}
      <div 
        className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--pop-navy) / 0.15) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />
      
      {/* Paper texture grain */}
      <div 
        className="absolute inset-0 opacity-3"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%' height='100%' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Warm vignette effect */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at center, transparent 40%, hsl(var(--background) / 0.6) 100%)
          `
        }}
      />
    </div>
  );
};
