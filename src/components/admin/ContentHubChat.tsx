import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContentActions, ContentPlan } from "@/hooks/useContentActions";
import { ContentPlanCard } from "./ContentPlanCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Plus, Loader2, Clipboard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  plans?: ContentPlan[];
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-content-hub`;

export const ContentHubChat = () => {
  const queryClient = useQueryClient();
  const { fetchSiteContext } = useContentActions();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversations
  const { data: conversations, refetch: refetchConversations } = useQuery({
    queryKey: ["ai-conversations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_conversations")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Load conversation messages
  useEffect(() => {
    if (conversationId) {
      const conv = conversations?.find((c) => c.id === conversationId);
      if (conv?.messages) {
        setMessages(conv.messages as unknown as ChatMessage[]);
      }
    }
  }, [conversationId, conversations]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Detect pasted content
  const handleInputChange = (value: string) => {
    setInput(value);
    setShowPasteHint(value.length > 200);
  };

  const saveConversation = async (msgs: ChatMessage[]) => {
    const msgsJson = msgs.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
    })) as unknown as Json;

    if (conversationId) {
      await supabase
        .from("ai_conversations")
        .update({ messages: msgsJson, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    } else {
      const title = msgs[0]?.content.slice(0, 60) || "New Conversation";
      const { data } = await supabase
        .from("ai_conversations")
        .insert({ title, messages: msgsJson })
        .select()
        .single();
      if (data) setConversationId(data.id);
    }
    refetchConversations();
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setShowPasteHint(false);
    setStreaming(true);

    try {
      const siteContent = await fetchSiteContext();

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          siteContent,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let toolCallArgs = "";
      let plans: ContentPlan[] = [];
      let inToolCall = false;

      const updateAssistant = (text: string, currentPlans: ContentPlan[]) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) =>
              i === prev.length - 1 ? { ...m, content: text, plans: currentPlans } : m
            );
          }
          return [
            ...prev,
            { role: "assistant", content: text, timestamp: new Date().toISOString(), plans: currentPlans },
          ];
        });
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta;

            if (delta?.content) {
              assistantText += delta.content;
              updateAssistant(assistantText, plans);
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (tc.function?.name === "content_plan") inToolCall = true;
                if (tc.function?.arguments) toolCallArgs += tc.function.arguments;
              }
            }

            const finishReason = parsed.choices?.[0]?.finish_reason;
            if (finishReason === "tool_calls" && toolCallArgs) {
              try {
                const planData = JSON.parse(toolCallArgs);
                const newPlan: ContentPlan = {
                  title: planData.title,
                  summary: planData.summary,
                  actions: planData.actions || [],
                };
                plans = [...plans, newPlan];
                if (!assistantText) assistantText = planData.summary;
                updateAssistant(assistantText, plans);
                toolCallArgs = "";
                inToolCall = false;
              } catch {
                // partial tool args
              }
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Final flush
      if (toolCallArgs) {
        try {
          const planData = JSON.parse(toolCallArgs);
          const newPlan: ContentPlan = {
            title: planData.title,
            summary: planData.summary,
            actions: planData.actions || [],
          };
          plans = [...plans, newPlan];
          if (!assistantText) assistantText = planData.summary;
          updateAssistant(assistantText, plans);
        } catch {}
      }

      const finalMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: assistantText, timestamp: new Date().toISOString(), plans },
      ];
      setMessages(finalMessages);
      await saveConversation(finalMessages);
    } catch (err) {
      console.error("Chat error:", err);
      toast({
        title: "Chat error",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setStreaming(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Conversation selector */}
      <div className="flex gap-2 p-3 border-b border-border">
        <Select
          value={conversationId || "new"}
          onValueChange={(v) => {
            if (v === "new") startNewConversation();
            else setConversationId(v);
          }}
        >
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue placeholder="Select conversation..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">+ New Conversation</SelectItem>
            {conversations?.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={startNewConversation} className="h-8">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <p className="font-bold mb-2">AI Content Hub</p>
            <p className="text-sm">
              Ask me to create, edit, or manage any content on your site.
              <br />
              You can also paste content and I'll suggest where to put it.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {msg.plans && msg.plans.length > 0 && (
                <div className="mt-3 space-y-3">
                  {msg.plans.map((plan, pIdx) => (
                    <ContentPlanCard
                      key={pIdx}
                      plan={plan}
                      conversationId={conversationId || undefined}
                      onExecuted={() => {
                        queryClient.invalidateQueries({ queryKey: ["ai-content-plans-history"] });
                        queryClient.invalidateQueries({ queryKey: ["ai-change-history"] });
                      }}
                      onSaved={() => {
                        queryClient.invalidateQueries({ queryKey: ["ai-saved-plans"] });
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {streaming && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        {showPasteHint && (
          <div className="flex items-center gap-2 mb-2 p-2 bg-accent/50 rounded text-xs">
            <Clipboard className="w-3 h-3" />
            <span>Looks like you pasted content. I can suggest where to add this!</span>
          </div>
        )}
        <div className="flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me to create, edit, or analyze content..."
            className="min-h-[44px] max-h-[120px] resize-none text-sm"
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            size="sm"
            className="h-auto"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
