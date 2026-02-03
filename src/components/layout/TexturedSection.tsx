import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface TexturedSectionProps {
  children: ReactNode;
  className?: string;
  variant?: "cream" | "warm" | "dark" | "teal" | "terracotta";
  texture?: "paper" | "dots" | "lines" | "none";
}

export const TexturedSection = ({
  children,
  className,
  variant = "cream",
  texture = "paper",
}: TexturedSectionProps) => {
  const variantClasses = {
    cream: "bg-background",
    warm: "warm-section",
    dark: "bg-foreground text-background",
    teal: "bg-pop-teal text-pop-cream",
    terracotta: "bg-pop-terracotta text-pop-cream",
  };

  const textureClasses = {
    paper: "paper-texture",
    dots: "benday-dots",
    lines: "screen-print",
    none: "",
  };

  return (
    <section
      className={cn(
        "relative overflow-hidden",
        variantClasses[variant],
        textureClasses[texture],
        className
      )}
    >
      {children}
    </section>
  );
};
