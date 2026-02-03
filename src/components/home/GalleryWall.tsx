import { cn } from "@/lib/utils";
import { PolaroidFrame } from "@/components/pop-art/PolaroidFrame";

interface GalleryItem {
  src: string;
  alt: string;
  title?: string;
  rotation?: number;
}

interface GalleryWallProps {
  items: GalleryItem[];
  className?: string;
  variant?: "scattered" | "grid" | "masonry";
}

export const GalleryWall = ({
  items,
  className,
  variant = "scattered",
}: GalleryWallProps) => {
  if (variant === "scattered") {
    return (
      <div className={cn("relative", className)}>
        {items.map((item, i) => {
          const positions = [
            { top: "5%", left: "10%", rotation: -8 },
            { top: "15%", right: "15%", rotation: 5 },
            { bottom: "20%", left: "25%", rotation: -3 },
            { bottom: "10%", right: "5%", rotation: 7 },
            { top: "40%", left: "5%", rotation: -5 },
            { top: "30%", right: "25%", rotation: 4 },
          ];
          const pos = positions[i % positions.length];
          
          return (
            <div
              key={i}
              className="absolute animate-float"
              style={{
                top: pos.top,
                left: pos.left,
                right: pos.right,
                bottom: pos.bottom,
                animationDelay: `${i * 0.5}s`,
              }}
            >
              <PolaroidFrame
                src={item.src}
                alt={item.alt}
                title={item.title}
                rotation={item.rotation ?? pos.rotation}
                size="sm"
              />
            </div>
          );
        })}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={cn("grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6", className)}>
        {items.map((item, i) => (
          <PolaroidFrame
            key={i}
            src={item.src}
            alt={item.alt}
            title={item.title}
            rotation={item.rotation ?? (i % 2 === 0 ? -2 : 2)}
            size="md"
          />
        ))}
      </div>
    );
  }

  // Masonry variant
  return (
    <div className={cn("columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4", className)}>
      {items.map((item, i) => (
        <div key={i} className="break-inside-avoid">
          <PolaroidFrame
            src={item.src}
            alt={item.alt}
            title={item.title}
            rotation={item.rotation ?? ((i * 3) % 7 - 3)}
            size={i % 3 === 0 ? "lg" : "md"}
          />
        </div>
      ))}
    </div>
  );
};
