import { cn } from "@/lib/utils";

interface TickerProps {
  items: string[];
  className?: string;
}

export const Ticker = ({ items, className }: TickerProps) => {
  const content = items.join(" • ");

  return (
    <div
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
};
