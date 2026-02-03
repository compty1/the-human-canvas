import { cn } from "@/lib/utils";

interface PolaroidFrameProps {
  src: string;
  alt: string;
  title?: string;
  date?: string;
  rotation?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PolaroidFrame = ({
  src,
  alt,
  title,
  date,
  rotation = 0,
  className,
  size = "md",
}: PolaroidFrameProps) => {
  const sizeClasses = {
    sm: "w-32 p-2 pb-8",
    md: "w-48 p-3 pb-12",
    lg: "w-64 p-4 pb-16",
  };

  const imageSizes = {
    sm: "h-28",
    md: "h-40",
    lg: "h-56",
  };

  return (
    <div
      className={cn(
        "bg-card shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        sizeClasses[size],
        className
      )}
      style={{
        transform: `rotate(${rotation}deg)`,
        boxShadow: `
          0 4px 6px -1px hsl(var(--foreground) / 0.1),
          0 2px 4px -2px hsl(var(--foreground) / 0.1),
          4px 4px 0 0 hsl(var(--pop-navy) / 0.2)
        `,
      }}
    >
      <div className={cn("overflow-hidden bg-muted", imageSizes[size])}>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
      {(title || date) && (
        <div className="mt-2 text-center">
          {title && (
            <p className="font-heading text-sm text-foreground truncate">
              {title}
            </p>
          )}
          {date && (
            <p className="text-xs text-muted-foreground italic font-serif">
              {date}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
