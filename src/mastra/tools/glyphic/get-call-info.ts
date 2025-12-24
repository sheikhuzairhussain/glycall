import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getCallInfo } from "@/lib/glyphic";

const DESCRIPTION = `Retrieve detailed information about a call by its ID.

Returns:
- transcript_turns: Full conversation transcript with party_id, turn_text, timestamp
- summary: AI-generated call summary
- insights: Extracted insights from the call
- participants: List with name, email, and id (party_id maps to transcript turns)
- companies: Associated companies with name and domain

Use the participants array to map party_id in transcript_turns to participant names.`;

export const getCallInfoTool = createTool({
  id: "get-call-info",
  description: DESCRIPTION,
  inputSchema: z.object({
    call_id: z.string().describe("The ID of the call to retrieve"),
  }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    start_time: z.string(),
    duration: z.number().nullable().optional(),
    status: z.object({
      code: z.enum([
        "queued",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ]),
    }),
    summary: z.string().nullable().optional(),
    url_link: z.string().nullable().optional(),
    transcript_turns: z
      .array(
        z.object({
          party_id: z.number(),
          turn_text: z.string(),
          timestamp: z.string(),
        }),
      )
      .nullable()
      .optional(),
    insights: z
      .array(
        z.object({
          name: z.string(),
          value: z.string().nullable().optional(),
        }),
      )
      .nullable()
      .optional(),
    companies: z
      .array(
        z.object({
          name: z.string().nullable().optional(),
          domain: z.string(),
        }),
      )
      .optional(),
    participants: z
      .array(
        z.object({
          name: z.string().nullable().optional(),
          email: z.string().nullable().optional(),
          id: z.number(),
        }),
      )
      .optional(),
  }),
  execute: async (input) => {
    const response = await getCallInfo({
      path: { call_id: input.call_id },
    });
    if (!response.data) {
      throw new Error(`Call not found: ${input.call_id}`);
    }
    return response.data;
  },
});
