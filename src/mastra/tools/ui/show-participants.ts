import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { Company, Participant } from "@/types/call";

export type { Company, Participant };

const ParticipantSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  id: z.number(),
}) satisfies z.ZodType<Participant>;

const CompanySchema = z.object({
  name: z.string().nullable().optional(),
  domain: z.string(),
}) satisfies z.ZodType<Company>;

const DESCRIPTION = `Display participant information from calls.

Use this tool to show who was involved in calls.
Participants are displayed with:
- Avatar with initials
- Name and email
- Company association (if provided)

Use this when the user asks about who was on calls or wants contact information.`;

export const showParticipantsInputSchema = z.object({
  participants: z
    .array(ParticipantSchema)
    .describe("The participants to display"),
  companies: z.array(CompanySchema).optional().describe("Associated companies"),
  context: z
    .string()
    .optional()
    .describe(
      "Context about these participants, e.g. 'Participants from calls with Acme Corp'",
    ),
});

export type ShowParticipantsInput = z.infer<typeof showParticipantsInputSchema>;

export const showParticipantsTool = createTool({
  id: "show-participants",
  description: DESCRIPTION,
  inputSchema: showParticipantsInputSchema,
  outputSchema: z.object({
    displayed: z.boolean(),
    participantCount: z.number(),
  }),
  execute: async (input) => {
    return { displayed: true, participantCount: input.participants.length };
  },
});
