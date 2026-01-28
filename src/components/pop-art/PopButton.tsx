import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface PopButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "accent" | "outline";
  size?: "sm" | "md" | "lg";
}

export const PopButton = forwardRef<HTMLButtonElement, PopButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variantClasses = {
      primary: "pop-button",
      secondary: "pop-button pop-button-secondary",
      accent: "pop-button pop-button-accent",
      outline: "font-bold uppercase tracking-wide border-2 border-foreground bg-background hover:bg-muted transition-all",
    };
    const sizeClasses = {
      sm: "text-sm px-4 py-2",
      md: "text-base px-6 py-3",
      lg: "text-lg px-8 py-4",
    };

    return (
      <button
        ref={ref}
        className={cn(variantClasses[variant], sizeClasses[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

PopButton.displayName = "PopButton";
