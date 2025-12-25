import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const InsightSchema = z.object({
  name: z.string(),
  value: z.string().nullable().optional(),
});

export type Insight = z.infer<typeof InsightSchema>;

const DESCRIPTION = `Display extracted insights from a call in a visual card format.

Use this tool to highlight key insights extracted from calls.
Insights are displayed as scannable cards showing:
- Insight name/category
- Extracted value

Common insight types include:
- Pain points
- Next steps
- Objections
- Budget information
- Decision makers
- Timeline`;

export const showCallInsightsInputSchema = z.object({
  callId: z.string().describe("The ID of the call"),
  callTitle: z.string().describe("The title of the call for context"),
  insights: z.array(InsightSchema).describe("The insights to display"),
});

export type ShowCallInsightsInput = z.infer<typeof showCallInsightsInputSchema>;

export const showCallInsightsTool = createTool({
  id: "show-call-insights",
  description: DESCRIPTION,
  inputSchema: showCallInsightsInputSchema,
  outputSchema: z.object({
    displayed: z.boolean(),
    insightCount: z.number(),
  }),
  execute: async (input) => {
    return { displayed: true, insightCount: input.insights.length };
  },
});

