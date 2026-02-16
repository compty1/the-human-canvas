

# Enhance AI Content Hub Plan Review and Functionality

## What's Already Working

The AI Content Hub has a solid foundation:
- AI chat with streaming responses and conversation persistence
- Structured plan generation via tool calling
- Execute, Save for Later, and Edit buttons on plans
- Change history tracking with per-change and per-plan revert
- Content overview stats dashboard
- Paste content detection

## What Needs Improvement

### 1. Plan Review Before Execution
Currently, clicking "Execute Plan" runs immediately with no confirmation. Plans need a clear review step:
- Add a **confirmation dialog** before execution that summarizes all changes
- For **update** actions, show a **diff view** (current value vs proposed value) by fetching the existing record
- Add a "Review Plan" expanded state that fetches and shows current data alongside proposed changes

### 2. Missing Confirmation Safety
No guard against accidental execution. A simple "Are you sure?" dialog with a summary of actions prevents mistakes.

### 3. Better Diff Visualization for Updates
When a plan proposes updating a record, the card currently only shows the new values. It should fetch the current record and display: `field: "old value" -> "new value"`.

---

## Implementation Details

### File: `src/components/admin/ContentPlanCard.tsx`

**Changes:**
1. Add a `reviewing` state that, when toggled, fetches current data for all update/delete actions and displays a side-by-side diff
2. Add a confirmation `AlertDialog` before execution
3. Show a "Review Changes" button that expands to show current vs proposed values
4. Improve the action display with clearer labels

**New flow:**
```text
Plan appears -> User clicks "Review Changes" -> 
  Card expands showing current vs new values for each action ->
  User clicks "Confirm & Execute" -> AlertDialog confirms -> Execution runs
```

**Key additions:**
- `fetchCurrentData()` function that queries each action's table for existing records
- `ReviewDiff` section showing `current -> proposed` for each field
- `AlertDialog` wrapping the execute button with action count summary
- Better visual indicators: green highlight for new fields, yellow for changed fields, red for deletions

### File: `src/components/admin/ChangeHistoryPanel.tsx`

**Minor enhancement:**
- Show the actual field values that changed (not just action type and table)
- Display a compact diff of `previous_data` vs `new_data` for each change entry

---

## Technical Approach

### ContentPlanCard Review Mode

When "Review Changes" is clicked:
1. For each `update` action with a `record_id`, fetch the current record from the database
2. Compare each field in `action.data` against the fetched record
3. Display: `fieldName: "current value" -> "new value"` with color coding
4. For `create` actions, show all fields as "new" (green)
5. For `delete` actions, show the existing record data as "will be removed" (red)

### Confirmation Dialog

Before execution, show an `AlertDialog`:
- Title: "Execute Plan: {plan.title}"
- Body: "{N} actions will be performed: {X} creates, {Y} updates, {Z} deletes"
- Buttons: "Cancel" and "Execute"

### ChangeHistoryPanel Diff Display

For each change entry, extract the key fields from `previous_data` and `new_data` and show a compact inline diff of what actually changed.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/admin/ContentPlanCard.tsx` | Add review mode with diff fetching, confirmation dialog, better action display |
| `src/components/admin/ChangeHistoryPanel.tsx` | Show field-level diffs in history entries |

No database changes or new files needed -- this is purely a UI/UX enhancement to the existing working system.

