import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const DESCRIPTION = `ALWAYS call this tool at the end of EVERY response to provide contextual follow-up suggestions.

Generate 2-4 suggestions based on the conversation context:

After listing calls:
- "Tell me more about the call with [Company Name]"
- "Summarize the [specific call title] call"
- "What was discussed in [Person]'s most recent call?"

After showing call details/transcript:
- "What action items came out of this call?"
- "What objections did the prospect raise?"
- "How did [Person] handle the pricing discussion?"
- "Find similar calls with this company"

After summarizing:
- "Show me the full transcript"
- "What were the next steps agreed upon?"
- "Find other calls mentioning [topic discussed]"

For no results:
- "Try a different date range"
- "Search for calls with [related email/company]"
- "List all calls from this month"

Keep suggestions specific, actionable, and relevant to what was just shown.`;

export const suggestFollowUpsTool = createTool({
  id: "suggest-follow-ups",
  description: DESCRIPTION,
  inputSchema: z.object({
    suggestions: z
      .array(z.string())
      .min(2)
      .max(4)
      .describe(
        "2-4 contextual follow-up questions based on the current response",
      ),
  }),
  outputSchema: z.object({
    suggestions: z.array(z.string()),
  }),
  execute: async (input) => {
    return { suggestions: input.suggestions };
  },
});
