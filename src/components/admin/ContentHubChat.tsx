import { useState, useRef, useEffect, useCallback } from "react";
import { sanitizeHtml } from "@/lib/sanitize";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useContentActions, ContentPlan } from "@/hooks/useContentActions";
import { ContentPlanCard } from "./ContentPlanCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Plus, Loader2, Clipboard, Search, FileText, BarChart3, Sparkles, PenTool } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Json } from "@/integrations/supabase/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  plans?: ContentPlan[];
}

interface ContentHubChatProps {
  externalPrompt?: string | null;
  onExternalPromptConsumed?: () => void;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-content-hub`;

const QUICK_ACTIONS = [
  { label: "Audit all content", icon: Search, prompt: "Audit all site content and suggest improvements for missing fields, SEO gaps, and stale records." },
  { label: "Find missing fields", icon: FileText, prompt: "Identify all records across every content type that have missing descriptions, excerpts, images, or tags." },
  { label: "Generate descriptions", icon: PenTool, prompt: "Find all records missing descriptions and generate appropriate descriptions for them." },
  { label: "Content report", icon: BarChart3, prompt: "Give me a comprehensive content report: total counts per type, published vs draft, and any issues found." },
  { label: "Publish ready content", icon: Sparkles, prompt: "Find content that's in approved review status or looks ready to publish. Suggest a plan to publish them." },
];

/** Lightweight markdown-to-HTML for AI responses */
const renderMarkdown = (text: string): string => {
  if (!text) return "";
  let html = text
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted rounded p-2 my-2 text-xs overflow-x-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 rounded text-xs">$1</code>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, '<h4 class="font-bold mt-3 mb-1">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-base mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-lg mt-3 mb-1">$1</h2>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^• (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  return `<p>${html}</p>`;
};

export const ContentHubChat = ({ externalPrompt, onExternalPromptConsumed }: ContentHubChatProps) => {
  const queryClient = useQueryClient();
  const { fetchSiteContext } = useContentActions();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [showPasteHint, setShowPasteHint] = useState(false);
  const [activeConversation, setActiveConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle external prompts (from suggestions "Fix with AI")
  useEffect(() => {
    if (externalPrompt && !streaming) {
      sendMessage(externalPrompt);
      onExternalPromptConsumed?.();
    }
  }, [externalPrompt]);

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

  useEffect(() => {
    if (conversationId && !streaming && !activeConversation) {
      const conv = conversations?.find((c) => c.id === conversationId);
      if (conv?.messages) {
        setMessages(conv.messages as unknown as ChatMessage[]);
      }
    }
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setInput(value);
    setShowPasteHint(value.length > 200);
  };

  const sendWithPrompt = (prompt: string) => {
    const text = input.trim();
    if (!text || streaming) return;
    sendMessage(`${prompt}\n\n${text}`);
  };

  const saveConversation = async (msgs: ChatMessage[]) => {
    const msgsJson = msgs.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      plans: m.plans || undefined,
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
        .maybeSingle();
      if (data) setConversationId(data.id);
    }
    setTimeout(() => refetchConversations(), 1000);
  };

  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || streaming) return;

    setActiveConversation(true);

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

      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          siteContent,
        }),
      });

      if (!resp.ok) {
        let errMsg = `HTTP ${resp.status}`;
        try {
          const errBody = await resp.text();
          try { errMsg = JSON.parse(errBody).error || errMsg; } catch { errMsg = errBody || errMsg; }
        } catch { /* use default */ }
        throw new Error(errMsg);
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
              i === prev.length - 1 ? { ...m, content: text, plans: currentPlans.length > 0 ? currentPlans : undefined } : m
            );
          }
          return [
            ...prev,
            { role: "assistant", content: text, timestamp: new Date().toISOString(), plans: currentPlans.length > 0 ? currentPlans : undefined },
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
            // Incomplete JSON chunk - skip and continue, don't re-prepend to avoid infinite loop
          }
        }
      }

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
        { role: "assistant", content: assistantText, timestamp: new Date().toISOString(), plans: plans.length > 0 ? plans : undefined },
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
      setActiveConversation(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setInput("");
    setActiveConversation(false);
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
            else {
              setActiveConversation(false);
              setConversationId(v);
            }
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
          <div className="text-center text-muted-foreground py-8">
            <Sparkles className="w-8 h-8 mx-auto mb-3 text-primary" />
            <p className="font-bold mb-2">AI Content Hub</p>
            <p className="text-sm mb-4">
              Ask me to create, edit, or manage any content on your site.
              <br />
              You can also paste content and I'll suggest where to put it.
            </p>
            <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => sendMessage(action.prompt)}
                  disabled={streaming}
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </Button>
              ))}
            </div>
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
              {msg.role === "assistant" ? (
                <div
                  className="text-sm prose prose-sm max-w-none dark:prose-invert [&_p]:my-1 [&_li]:my-0.5 [&_pre]:my-2 [&_h2]:my-2 [&_h3]:my-2 [&_h4]:my-1"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(renderMarkdown(msg.content)) }}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              )}

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
                        queryClient.invalidateQueries({ queryKey: ["content-suggestions"] });
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

        {streaming && messages[messages.length - 1]?.role !== "assistant" && (
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
          <div className="mb-2 p-3 bg-accent/50 rounded-lg border border-border space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Clipboard className="w-3 h-3" />
              <span>Pasted content detected — generate from it:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Article", prompt: "Analyze this pasted text and create an article with title, slug, excerpt, category, tags, and full content:" },
                { label: "Project", prompt: "Analyze this pasted text and create a project entry with title, slug, description, tech_stack, and features:" },
                { label: "Update", prompt: "Turn this pasted text into a site update with title, slug, and content:" },
                { label: "Experience", prompt: "Extract an experience entry from this text with title, slug, category, description, skills_used, and key_achievements:" },
                { label: "Product Review", prompt: "Create a product review from this text with product_name, company, slug, summary, strengths, pain_points, and content:" },
                { label: "Auto-detect", prompt: "Analyze this pasted content and suggest the best content type and fields for it. Create a structured plan:" },
              ].map((action) => (
                <Button
                  key={action.label}
                  size="sm"
                  variant={action.label === "Auto-detect" ? "default" : "outline"}
                  className="h-6 text-xs px-2"
                  onClick={() => sendWithPrompt(action.prompt)}
                  disabled={streaming}
                >
                  {action.label}
                </Button>
              ))}
            </div>
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
            onClick={() => sendMessage()}
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
