import { cn } from "@/lib/utils";

interface FilmStripProps {
  images: { src: string; alt: string }[];
  direction?: "left" | "right";
  speed?: "slow" | "normal" | "fast";
  className?: string;
}

export const FilmStrip = ({
  images,
  direction = "left",
  speed = "normal",
  className,
}: FilmStripProps) => {
  const speedDurations = {
    slow: "40s",
    normal: "25s",
    fast: "15s",
  };

  // Duplicate images for seamless loop
  const allImages = [...images, ...images, ...images];

  return (
    <div className={cn("film-strip", className)}>
      <div
        className="flex gap-4 px-8 py-2"
        style={{
          animation: `film-scroll ${speedDurations[speed]} linear infinite`,
          animationDirection: direction === "right" ? "reverse" : "normal",
        }}
      >
        {allImages.map((img, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-32 h-24 md:w-40 md:h-28 overflow-hidden border-2 border-pop-cream/20"
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover filter saturate-90 hover:saturate-100 transition-all"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
