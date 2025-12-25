import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const CallDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  start_time: z.string(),
  duration: z.number().nullable().optional(),
  status: z.object({
    code: z.enum(["queued", "in_progress", "completed", "failed", "cancelled"]),
  }),
  summary: z.string().nullable().optional(),
  url_link: z.string().nullable().optional(),
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
  insights: z
    .array(
      z.object({
        name: z.string(),
        value: z.string().nullable().optional(),
      }),
    )
    .nullable()
    .optional(),
});

export type CallDetailData = z.infer<typeof CallDetailSchema>;

const DESCRIPTION = `Display detailed information about a single call to the user.

Use this tool AFTER fetching call details with get-call-info to present the information.
The call will be displayed with:
- Header with title, date, duration, and status
- AI-generated summary
- Key insights extracted from the call
- Participant list with contact info
- Company information
- Link to original recording

Always use this tool when showing detailed call information to the user.`;

export const showCallInfoInputSchema = z.object({
  call: CallDetailSchema.describe("The call details to display"),
});

export type ShowCallInfoInput = z.infer<typeof showCallInfoInputSchema>;

export const showCallInfoTool = createTool({
  id: "show-call-info",
  description: DESCRIPTION,
  inputSchema: showCallInfoInputSchema,
  outputSchema: z.object({
    displayed: z.boolean(),
    callId: z.string(),
  }),
  execute: async (input) => {
    return { displayed: true, callId: input.call.id };
  },
});

