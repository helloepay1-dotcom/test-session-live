# AI Session Live - Project Notes

## Build/Test Commands

- **Development server**: `npm run dev`
- **Build**: `npm run build`
- **Extension syntax check**: `node --check chrome-extension/content.js`

## Recent Changes (Aug 16, 2025)

### Fixed: Polling Loop Issue

**Problem**: The polling API `/api/poll-messages` was returning the same 5 messages indefinitely, causing an infinite loop where the extension would skip them as "our captured message" but never stop receiving them.

**Root Cause**: No server-side mechanism to mark messages as "sent" to the extension. The extension had local tracking (`lastProcessedMessageId`) but the API didn't know which messages were already processed.

**Solution**:
1. Added `sent_at` column to `messages` table in `supabase/schema.sql`
2. Created `/api/mark-message-sent` endpoint to mark messages as sent
3. Modified `/api/poll-messages` to only return messages where `sent_at IS NULL`
4. Added `markMessageAsSent()` function in `chrome-extension/content.js` to call the API after successful injection
5. Created migration script `supabase/migration-add-sent-at.sql` for existing databases

**Files Changed**:
- `supabase/schema.sql` - Added `sent_at TIMESTAMPTZ` column
- `src/app/api/mark-message-sent/route.ts` - New API endpoint
- `src/app/api/poll-messages/route.ts` - Added `.is("sent_at", null)` filter
- `chrome-extension/content.js` - Added `markMessageAsSent()` function and call after injection
- `supabase/migration-add-sent-at.sql` - Migration script for existing databases

**Migration Executed**: The migration was successfully executed on Aug 16, 2025 using Supabase Management API. The `sent_at` column now exists in the `messages` table.

**Testing Required**:
1. Reload/reinstall the Chrome extension
2. Test that polling no longer returns the same messages repeatedly
3. Verify new messages are injected correctly
4. Verify marked messages don't appear in subsequent polls

## Gemini Issues Fixed (Aug 16, 2025)

The following Gemini issues have been corrected:

1. **User prompts not captured**: Fixed by removing broad input selectors (`.input-container`, `.user-input`, `.query-text`, `.input-area`) and only targeting actual user message containers. Added check to ignore elements with `contenteditable="true"` to avoid capturing the active input field.

2. **Assistant response duplicated**: Fixed by:
   - Adding `seenElements` Set to track and deduplicate DOM elements
   - Removing overly broad assistant selectors (`.markdown`, `.model-text`, `.output-container`, `.response-text`, `.gemini-response`, `.ai-response`)
   - Only using specific Gemini data attributes and class names
   - Avoiding nested elements inside user messages

3. **Injected text not submitted**: Fixed by:
   - Removing `button svg` and `button:has(svg)` selectors that could select SVG elements instead of buttons
   - Only targeting actual button elements and `[role="button"]` divs with proper aria-labels
   - Adding check to skip SVG elements and elements inside buttons
   - Increased delay for Gemini injection (800ms vs 300ms) to allow UI state to settle

4. **DOM selector overlap**: Fixed by implementing proper deduplication with `seenElements` Set and using more specific, targeted selectors

**Files Changed**:
- `chrome-extension/content.js` - Updated `extractGeminiMessages()`, `sendMessageButton()`, and injection delay
