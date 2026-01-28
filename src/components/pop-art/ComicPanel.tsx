import { cn } from "@/lib/utils";
import { forwardRef, ReactNode } from "react";

interface ComicPanelProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "magenta" | "cyan" | "yellow" | "default";
  onClick?: () => void;
}

export const ComicPanel = forwardRef<HTMLDivElement, ComicPanelProps>(
  ({ children, className, size = "md", color = "default", onClick }, ref) => {
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
        ref={ref}
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
  }
);

ComicPanel.displayName = "ComicPanel";
