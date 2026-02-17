

# Comprehensive Fix Plan for AI Content Hub

## Root Cause Analysis

After thorough debugging, I identified these specific issues:

### Issue 1: Plan Cards Disappear Immediately (Critical)
The AI **is** returning structured `content_plan` tool calls correctly, and the streaming parser **does** parse them into plan cards. However, they vanish instantly because:

1. Stream finishes -> `setMessages(finalMessages)` includes plans in React state
2. `saveConversation()` runs -> saves messages to database **without plans** (only saves `role`, `content`, `timestamp`)
3. `refetchConversations()` triggers `useEffect` which reloads messages from database -> **overwrites state, losing plans**

**Fix:** Save plans data alongside messages in `ai_conversations.messages` JSON, and stop the `useEffect` from overwriting in-flight state.

### Issue 2: Markdown Not Rendered
AI responses contain markdown (`**bold**`, bullet lists, backticks) but are rendered with `whitespace-pre-wrap` in a plain `<p>` tag instead of using a markdown renderer.

### Issue 3: Console Warning About Refs
`ContentPlanCard` is wrapped in `AlertDialog` which tries to pass a ref to a function component. The component needs `forwardRef` or the structure needs adjustment.

### Issue 4: Content Overview Counts Use HEAD Requests That Error
The `HEAD` requests for content stats are returning `ERR` status (visible in network logs). The `{ count: "exact", head: true }` approach fails silently.

---

## Fix Details

### File 1: `src/components/admin/ContentHubChat.tsx`

**Changes:**

1. **Persist plans in conversation messages**: When saving to database, include plans data in the messages JSON so they survive page reloads:
```typescript
const saveConversation = async (msgs: ChatMessage[]) => {
  const msgsJson = msgs.map((m) => ({
    role: m.role,
    content: m.content,
    timestamp: m.timestamp,
    plans: m.plans || undefined, // Persist plans!
  })) as unknown as Json;
  // ... rest unchanged
};
```

2. **Prevent useEffect from overwriting in-flight state**: Add a guard so loading conversation from DB doesn't clobber active streaming state:
```typescript
const [activeConversation, setActiveConversation] = useState(false);

useEffect(() => {
  if (conversationId && !streaming && !activeConversation) {
    // Only load from DB when not actively chatting
    const conv = conversations?.find((c) => c.id === conversationId);
    if (conv?.messages) {
      setMessages(conv.messages as unknown as ChatMessage[]);
    }
  }
}, [conversationId]); // Remove conversations from deps
```

3. **Add markdown rendering**: Install/use a simple markdown approach for AI responses. Since we don't want to add a dependency, use a lightweight approach with `dangerouslySetInnerHTML` and basic markdown-to-HTML conversion, or better yet, render structured content with proper formatting.

4. **Handle the tool call parsing more robustly**: The current parser works but can miss edge cases where tool_calls arguments are split across multiple chunks. Add a fallback that also checks for complete JSON in the buffer after streaming ends.

### File 2: `src/components/admin/ContentPlanCard.tsx`

**Changes:**

1. **Fix AlertDialog ref warning**: Wrap the component properly or restructure so `AlertDialog` doesn't try to pass a ref to a function component that doesn't accept it. The fix is to ensure `AlertDialogTrigger asChild` wraps a proper DOM element.

2. **Auto-expand review on first render**: When a plan card appears in chat, automatically show the review state so users immediately see what will change without needing to click "Review Changes" first.

### File 3: `src/pages/admin/ContentHub.tsx`

**Changes:**

1. **Fix content overview count queries**: Replace the `head: true` approach with a working count method that doesn't produce `ERR` network requests.

### File 4: `src/components/admin/ChangeHistoryPanel.tsx`

**Minor fix:**
1. Handle case where `record_id` could be null (for edge cases) to prevent `.slice()` errors.

---

## Summary of All Changes

| File | What's Fixed |
|------|-------------|
| `ContentHubChat.tsx` | Plans persist across reloads; useEffect doesn't overwrite active state; markdown rendering; robust stream parsing |
| `ContentPlanCard.tsx` | AlertDialog ref warning fixed; plans auto-expand review on first render |
| `ContentHub.tsx` | Content overview counts work without HEAD request errors |
| `ChangeHistoryPanel.tsx` | Null safety for record_id display |

No database changes or new files needed. These are targeted fixes to make the existing system fully functional.
