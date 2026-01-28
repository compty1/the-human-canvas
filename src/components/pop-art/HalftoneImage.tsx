import { cn } from "@/lib/utils";

interface HalftoneImageProps {
  src: string;
  alt: string;
  className?: string;
  frameColor?: "magenta" | "cyan" | "yellow";
}

export const HalftoneImage = ({
  src,
  alt,
  className,
  frameColor = "cyan",
}: HalftoneImageProps) => {
  const frameClasses = {
    magenta: "pop-frame-magenta",
    cyan: "pop-frame",
    yellow: "pop-frame-yellow",
  };

  return (
    <div className={cn("pop-frame", frameClasses[frameColor], className)}>
      <div className="halftone-overlay overflow-hidden border-4 border-foreground">
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
    </div>
  );
};
