import { cn } from "@/lib/utils";
import { forwardRef, ReactNode, HTMLAttributes } from "react";

interface ComicPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  color?: "magenta" | "cyan" | "yellow" | "default" | "terracotta" | "teal" | "gold";
}

export const ComicPanel = forwardRef<HTMLDivElement, ComicPanelProps>(
  ({ children, className, size = "md", color = "default", onClick, ...props }, ref) => {
    const sizeClasses = {
      sm: "comic-panel-sm",
      md: "comic-panel",
      lg: "comic-panel-lg",
    };

    const colorClasses = {
      default: "bg-card",
      magenta: "bg-pop-terracotta",
      cyan: "bg-pop-teal",
      yellow: "bg-pop-gold",
      terracotta: "bg-pop-terracotta",
      teal: "bg-pop-teal",
      gold: "bg-pop-gold",
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
        {...props}
      >
        {children}
      </div>
    );
  }
);

ComicPanel.displayName = "ComicPanel";
