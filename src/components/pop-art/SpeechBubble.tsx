import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface SpeechBubbleProps {
  children: ReactNode;
  className?: string;
  author?: string;
}

export const SpeechBubble = ({ children, className, author }: SpeechBubbleProps) => {
  return (
    <div className={cn("speech-bubble", className)}>
      <div className="font-sans text-foreground">{children}</div>
      {author && (
        <p className="mt-2 text-sm font-bold text-muted-foreground">— {author}</p>
      )}
    </div>
  );
};
