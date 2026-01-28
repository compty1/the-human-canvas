import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ComicPanelProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "magenta" | "cyan" | "yellow" | "default";
  onClick?: () => void;
}

export const ComicPanel = ({
  children,
  className,
  size = "md",
  color = "default",
  onClick,
}: ComicPanelProps) => {
  const sizeClasses = {
    sm: "comic-panel-sm",
    md: "comic-panel",
    lg: "comic-panel-lg",
  };

  const colorClasses = {
    default: "bg-card",
    magenta: "bg-pop-magenta",
    cyan: "bg-pop-cyan",
    yellow: "bg-pop-yellow",
  };

  return (
    <div
      className={cn(
        sizeClasses[size],
        colorClasses[color],
        "transition-transform hover:translate-x-1 hover:translate-y-1",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
