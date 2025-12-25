import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const CallPreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  start_time: z.string(),
  duration: z.number().nullable().optional(),
  status: z.object({
    code: z.enum(["queued", "in_progress", "completed", "failed", "cancelled"]),
  }),
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
});

const DESCRIPTION = `Display a list of calls to the user in a visual card format.

Use this tool AFTER fetching calls with list-calls to present results to the user.
The calls will be displayed as interactive cards showing:
- Call title and date/time
- Duration and status
- Participant names and avatars
- Company badges

Always use this tool when you have call results to show the user.`;

export const showCallListInputSchema = z.object({
  calls: z
    .array(CallPreviewSchema)
    .describe("Array of call previews to display"),
  title: z
    .string()
    .optional()
    .describe("Optional title for the list, e.g. 'Calls from last week'"),
  hasMore: z
    .boolean()
    .optional()
    .describe("Whether there are more results available"),
});

export type ShowCallListInput = z.infer<typeof showCallListInputSchema>;

export const showCallListTool = createTool({
  id: "show-call-list",
  description: DESCRIPTION,
  inputSchema: showCallListInputSchema,
  outputSchema: z.object({
    displayed: z.boolean(),
    count: z.number(),
  }),
  execute: async (input) => {
    // The tool simply returns - the UI component handles rendering based on input
    return { displayed: true, count: input.calls.length };
  },
});

