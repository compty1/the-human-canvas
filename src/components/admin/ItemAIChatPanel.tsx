import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { PopButton } from "@/components/pop-art";
import {
  MessageSquare, Send, Loader2, X, Sparkles, Copy, Check,
  BookOpen, Plus, ChevronDown, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ItemAIChatPanelProps {
  entityType: string;
  entityId?: string;
  entityTitle: string;
  context?: string;
  className?: string;
}

export const ItemAIChatPanel = ({
  entityType,
  entityId,
  entityTitle,
  context,
  className,
}: ItemAIChatPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Fetch saved conversations for this entity
  const { data: conversations = [] } = useQuery({
    queryKey: ["entity-conversations", entityType, entityId],
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("ai_conversations")
        .select("id, title, updated_at")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!entityId && isOpen,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load a conversation
  const loadConversation = useCallback(async (convoId: string) => {
    const { data, error } = await supabase
      .from("ai_conversations")
      .select("messages")
      .eq("id", convoId)
      .single();
    if (error) { toast.error("Failed to load conversation"); return; }
    setMessages((data.messages as unknown as Message[]) || []);
    setActiveConversationId(convoId);
    setShowConversations(false);
  }, []);

  // Save current conversation
  const saveConversation = useCallback(async (msgs: Message[]) => {
    if (!entityId || msgs.length === 0) return;
    const title = msgs[0]?.content.substring(0, 60) || "Chat";

    if (activeConversationId) {
      await supabase
        .from("ai_conversations")
        .update({ messages: msgs as any, title, updated_at: new Date().toISOString() })
        .eq("id", activeConversationId);
    } else {
      const { data, error } = await supabase
        .from("ai_conversations")
        .insert({
          messages: msgs as any,
          title,
          entity_type: entityType,
          entity_id: entityId,
        })
        .select("id")
        .single();
      if (!error && data) setActiveConversationId(data.id);
    }
    queryClient.invalidateQueries({ queryKey: ["entity-conversations", entityType, entityId] });
  }, [entityId, entityType, activeConversationId, queryClient]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput("");
    const newMessages: Message[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: newMessages,
          context: `Entity: ${entityType} - "${entityTitle}"\n${context || ""}`,
          contentType: entityType,
        },
      });
      if (error) throw error;
      const assistantMessage = data?.content || data?.message || "I couldn't generate a response.";
      const finalMessages: Message[] = [...newMessages, { role: "assistant", content: assistantMessage }];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (error) {
      console.error("AI chat error:", error);
      toast.error("Failed to get AI response");
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success("Copied");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Save message to knowledge base
  const saveToKnowledgeBaseMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!entityId) throw new Error("No entity ID");
      const { error } = await supabase.from("knowledge_entries").insert({
        entity_type: entityType,
        entity_id: entityId,
        title: `AI Insight: ${entityTitle}`,
        content,
        category: "ai_generated",
        tags: ["ai-chat", entityType],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Saved to Knowledge Base");
      queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
    },
    onError: () => toast.error("Failed to save to Knowledge Base"),
  });

  const startNewConversation = () => {
    setMessages([]);
    setActiveConversationId(null);
    setShowConversations(false);
  };

  const deleteConversation = async (convoId: string) => {
    await supabase.from("ai_conversations").delete().eq("id", convoId);
    if (activeConversationId === convoId) startNewConversation();
    queryClient.invalidateQueries({ queryKey: ["entity-conversations", entityType, entityId] });
    toast.success("Conversation deleted");
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn("flex items-center gap-2 text-sm text-primary hover:underline", className)}
      >
        <MessageSquare className="w-4 h-4" />
        AI Chat for this {entityType.replace(/_/g, " ")}
        {conversations.length > 0 && (
          <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded">{conversations.length}</span>
        )}
      </button>
    );
  }

  return (
    <div className={cn("border-2 border-primary bg-background", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-2 border-primary bg-primary/10">
        <h3 className="font-bold flex items-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />
          AI Chat — {entityTitle.substring(0, 30)}{entityTitle.length > 30 ? "…" : ""}
        </h3>
        <div className="flex items-center gap-1">
          {entityId && conversations.length > 0 && (
            <button
              onClick={() => setShowConversations(!showConversations)}
              className="p-1 hover:bg-primary/20 text-xs flex items-center gap-1"
            >
              <ChevronDown className="w-3 h-3" />
              {conversations.length}
            </button>
          )}
          <button onClick={startNewConversation} className="p-1 hover:bg-primary/20" title="New conversation">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-primary/20">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Conversations list */}
      {showConversations && (
        <div className="border-b-2 border-primary max-h-40 overflow-y-auto">
          {conversations.map((c) => (
            <div
              key={c.id}
              className={cn(
                "flex items-center justify-between px-3 py-2 text-xs hover:bg-muted cursor-pointer",
                activeConversationId === c.id && "bg-primary/10"
              )}
            >
              <button className="flex-1 text-left truncate" onClick={() => loadConversation(c.id)}>
                {c.title}
              </button>
              <button onClick={() => deleteConversation(c.id)} className="p-1 hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground text-sm py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Chat about this {entityType.replace(/_/g, " ")}</p>
            <p className="mt-1 text-xs">Ask questions, brainstorm ideas, or get suggestions</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("p-3 text-sm", msg.role === "user" ? "bg-primary/10 ml-8" : "bg-muted mr-8")}
          >
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.role === "assistant" && (
              <div className="flex gap-2 mt-2 pt-2 border-t border-foreground/10">
                <button
                  onClick={() => handleCopy(msg.content, i)}
                  className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {copiedIndex === i ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  Copy
                </button>
                {entityId && (
                  <button
                    onClick={() => saveToKnowledgeBaseMutation.mutate(msg.content)}
                    disabled={saveToKnowledgeBaseMutation.isPending}
                    className="text-xs flex items-center gap-1 text-primary hover:underline"
                  >
                    <BookOpen className="w-3 h-3" />
                    Save to Knowledge Base
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
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            placeholder="Ask about this content..."
            rows={2}
            className="flex-1 resize-none"
          />
          <PopButton onClick={sendMessage} disabled={isLoading || !input.trim()} size="sm" className="self-end">
            <Send className="w-4 h-4" />
          </PopButton>
        </div>
      </div>
    </div>
  );
};
