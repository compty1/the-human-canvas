import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface TickerProps {
  items: string[];
  className?: string;
}

export const Ticker = forwardRef<HTMLDivElement, TickerProps>(
  ({ items, className }, ref) => {
    const content = items.join(" • ");

    return (
      <div
        ref={ref}
        className={cn(
          "ticker bg-foreground text-background py-2 overflow-hidden",
          className
        )}
      >
        <div className="ticker-content font-display text-lg tracking-wide">
          <span>{content} • </span>
          <span>{content} • </span>
        </div>
      </div>
    );
  }
);

Ticker.displayName = "Ticker";
