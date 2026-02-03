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

const floatingImages = [
  { src: anarchistKing, alt: "Anarchist King", className: "top-0 left-0 w-48 md:w-64 opacity-40 -rotate-12" },
  { src: blueShirt, alt: "Blue Shirt Portrait", className: "top-20 right-0 w-40 md:w-56 opacity-30 rotate-6" },
  { src: crackOrTweak, alt: "Crack or Tweak", className: "bottom-32 left-10 w-56 md:w-72 opacity-25 rotate-3" },
  { src: maskedFigure, alt: "Masked Figure", className: "top-1/3 left-1/4 w-32 md:w-40 opacity-20 -rotate-6" },
  { src: peaceLoveCollage, alt: "Peace Love Collage", className: "bottom-0 right-10 w-64 md:w-80 opacity-35 -rotate-3" },
  { src: wavingPortrait, alt: "Waving Portrait", className: "top-10 left-1/3 w-36 md:w-44 opacity-25 rotate-12" },
  { src: medusaHair, alt: "Medusa Hair", className: "bottom-20 left-1/2 w-48 md:w-60 opacity-20 -rotate-6" },
  { src: flowerPotHead, alt: "Flower Pot Head", className: "top-1/2 right-1/4 w-40 md:w-52 opacity-30 rotate-6" },
  { src: bandageFace, alt: "Bandage Face", className: "bottom-10 left-20 w-44 md:w-56 opacity-35 rotate-3" },
  { src: ribbonFeet, alt: "Ribbon Feet", className: "top-40 right-1/3 w-36 md:w-48 opacity-25 -rotate-12" },
];

export const HeroBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Animated floating artwork */}
      {floatingImages.map((img, i) => (
        <div
          key={i}
          className={`absolute ${img.className} animate-float transition-transform duration-1000`}
          style={{
            animationDelay: `${i * 0.5}s`,
            animationDuration: `${8 + i * 0.5}s`,
          }}
        >
          <img
            src={img.src}
            alt={img.alt}
            className="w-full h-auto mix-blend-multiply dark:mix-blend-screen filter contrast-125"
          />
        </div>
      ))}
      
      {/* Halftone gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-pop-yellow/20 via-pop-magenta/10 to-pop-cyan/20" />
      
      {/* Comic dots pattern */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '20px 20px',
        }}
      />
      
      {/* Diagonal lines accent */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `repeating-linear-gradient(45deg, hsl(var(--foreground)) 0, hsl(var(--foreground)) 1px, transparent 0, transparent 50%)`,
          backgroundSize: '10px 10px',
        }}
      />
    </div>
  );
};
