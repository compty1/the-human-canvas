import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { PopButton } from "@/components/pop-art";
import { MessageSquare, Send, Loader2, X, Sparkles, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatAssistantProps {
  context?: string;
  contentType: string;
  relatedContent?: string;
  onSuggestionApply?: (text: string) => void;
  className?: string;
}

export const AIChatAssistant = ({
  context,
  contentType,
  relatedContent,
  onSuggestionApply,
  className,
}: AIChatAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Build enriched context
      const enrichedContext = [
        context,
        relatedContent ? `\nRelated existing content:\n${relatedContent}` : "",
      ].filter(Boolean).join("\n");

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [...messages, { role: "user", content: userMessage }],
          context: enrichedContext,
          contentType,
        },
      });

      if (error) throw error;

      const assistantMessage = data?.content || data?.message || "I couldn't generate a response.";
      setMessages((prev) => [...prev, { role: "assistant", content: assistantMessage }]);
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error("Failed to get AI response");
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleApply = (text: string) => {
    if (onSuggestionApply) {
      onSuggestionApply(text);
      toast.success("Content applied to editor");
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 text-sm text-primary hover:underline",
          className
        )}
      >
        <MessageSquare className="w-4 h-4" />
        AI Content Assistant
      </button>
    );
  }

  return (
    <div className={cn("border-2 border-primary bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-2 border-primary bg-primary/10">
        <h3 className="font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4" />
          AI Content Assistant
        </h3>
        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-primary/20">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Ask me to help with your {contentType.replace("_", " ")} content!</p>
            <p className="mt-2 text-xs">
              Try: "Write a compelling description" or "Suggest improvements"
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "p-3 text-sm",
              msg.role === "user"
                ? "bg-primary/10 ml-8"
                : "bg-muted mr-8"
            )}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.role === "assistant" && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-foreground/10">
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {copiedIndex === i ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  Copy
                </button>
                {onSuggestionApply && (
                  <button
                    onClick={() => handleApply(msg.content)}
                    className="text-xs flex items-center gap-1 text-primary hover:underline"
                  >
                    <Sparkles className="w-3 h-3" />
                    Apply
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t-2 border-primary">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Ask for content suggestions..."
            rows={2}
            className="flex-1 resize-none"
          />
          <PopButton
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="sm"
            className="self-end"
          >
            <Send className="w-4 h-4" />
          </PopButton>
        </div>
      </div>
    </div>
  );
};
