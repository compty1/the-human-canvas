import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface LikeButtonProps {
  count: number;
  liked?: boolean;
  onLike?: () => void;
  className?: string;
}

export const LikeButton = ({
  count,
  liked = false,
  onLike,
  className,
}: LikeButtonProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onLike?.();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 px-3 py-2 border-2 border-foreground transition-all",
        liked
          ? "bg-primary text-primary-foreground"
          : "bg-background hover:bg-muted",
        className
      )}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-transform",
          liked && "fill-current",
          isAnimating && "animate-pop-in"
        )}
      />
      <span className="font-bold">{count}</span>
    </button>
  );
};
