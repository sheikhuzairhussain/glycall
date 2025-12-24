import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { listCalls } from "@/lib/glyphic";

const DESCRIPTION = `Retrieve list of calls for your organization.

Returns public calls sorted by start time (newest first).

Filters:
- participant_email: Filter by participant email (case insensitive)
- start_time_from/to: Filter by date range (UTC ISO 8601)
- title_filter: Filter by call title

Pagination:
- Use cursor and direction for paginated results
- limit controls items per page`;

export const listCallsTool = createTool({
  id: "list-calls",
  description: DESCRIPTION,
  inputSchema: z.object({
    participant_email: z
      .string()
      .optional()
      .describe("Filter by participant email (case insensitive)"),
    start_time_from: z
      .string()
      .optional()
      .describe("Filter calls starting from this time (UTC ISO 8601)"),
    start_time_to: z
      .string()
      .optional()
      .describe("Filter calls starting up to this time (UTC ISO 8601)"),
    title_filter: z.string().optional().describe("Filter calls by title"),
    cursor: z.string().optional().describe("Cursor for pagination"),
    limit: z.number().optional().describe("Number of items per page"),
    direction: z
      .enum(["next", "prev"])
      .optional()
      .describe("Pagination direction"),
  }),
  outputSchema: z.object({
    data: z.array(
      z.object({
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
    ),
    pagination: z.object({
      next_cursor: z.string().nullable().optional(),
      previous_cursor: z.string().nullable().optional(),
    }),
  }),
  execute: async (input) => {
    const response = await listCalls({
      query: {
        participant_email: input.participant_email,
        start_time_from: input.start_time_from,
        start_time_to: input.start_time_to,
        title_filter: input.title_filter,
        cursor: input.cursor,
        limit: input.limit,
        direction: input.direction,
      },
    });
    if (!response.data) {
      throw new Error("Failed to list calls");
    }
    return response.data;
  },
});
