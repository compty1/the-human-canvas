import { cn } from "@/lib/utils";
import { sanitizeHtml } from "@/lib/sanitize";

interface RichTextContentProps {
  content: string;
  className?: string;
}

export const RichTextContent = ({ content, className }: RichTextContentProps) => {
  return (
    <div
      className={cn(
        "prose prose-lg max-w-none",
        "[&_h1]:font-display [&_h1]:text-3xl [&_h1]:mt-6 [&_h1]:mb-3",
        "[&_h2]:font-display [&_h2]:text-2xl [&_h2]:mt-5 [&_h2]:mb-2",
        "[&_h3]:font-display [&_h3]:text-xl [&_h3]:mt-4 [&_h3]:mb-2",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded",
        "[&_pre]:bg-foreground [&_pre]:text-background [&_pre]:p-4 [&_pre]:border-2 [&_pre]:border-foreground",
        "[&_ul]:pl-6 [&_ol]:pl-6",
        "[&_hr]:border-t-4 [&_hr]:border-foreground [&_hr]:my-6",
        "[&_img]:max-w-full [&_img]:h-auto [&_img]:border-2 [&_img]:border-foreground [&_img]:my-4",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary/80",
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }}
    />
  );
};
