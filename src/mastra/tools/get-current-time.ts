import { createTool } from "@mastra/core/tools";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import { z } from "zod";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(advancedFormat);

const DESCRIPTION = `Get the current date and time information in the user's timezone.

Use this tool when you need to:
- Calculate relative dates (e.g., "last two weeks", "yesterday")
- Determine the current year for date ranges
- Know what day of the week it is

Returns the current date/time in multiple formats for convenience.`;

export const getCurrentTimeTool = createTool({
  id: "get-current-time",
  description: DESCRIPTION,
  inputSchema: z.object({}),
  outputSchema: z.object({
    iso: z
      .string()
      .describe("ISO 8601 format (e.g., 2025-12-24T16:30:00.000Z)"),
    date: z.string().describe("Date only (YYYY-MM-DD)"),
    time: z.string().describe("Time only (HH:MM:SS)"),
    year: z.number().describe("Current year"),
    month: z.number().describe("Current month (1-12)"),
    day: z.number().describe("Day of month (1-31)"),
    dayOfWeek: z.string().describe("Day of week (e.g., Wednesday)"),
    timezone: z.string().describe("User's timezone (e.g., Europe/London)"),
    formatted: z
      .string()
      .describe(
        "Human-readable format (e.g., Wednesday, 24th December 2025 4:30 pm)",
      ),
  }),
  execute: async (_input, context) => {
    const tz =
      (context?.requestContext?.get("timezone") as string | undefined) || "UTC";
    const now = dayjs().tz(tz);

    return {
      iso: now.toISOString(),
      date: now.format("YYYY-MM-DD"),
      time: now.format("HH:mm:ss"),
      year: now.year(),
      month: now.month() + 1,
      day: now.date(),
      dayOfWeek: now.format("dddd"),
      timezone: tz,
      formatted: now.format("dddd, Do MMMM YYYY h:mm a"),
    };
  },
});
