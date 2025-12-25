import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import type { Participant, TranscriptTurn } from "@/types/call";

export type { TranscriptTurn };
export type TranscriptParticipant = Participant;

const TranscriptTurnSchema = z.object({
  party_id: z.number(),
  turn_text: z.string(),
  timestamp: z.string(),
}) satisfies z.ZodType<TranscriptTurn>;

const ParticipantSchema = z.object({
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  id: z.number(),
}) satisfies z.ZodType<Participant>;

const DESCRIPTION = `Display a portion of a call transcript in a conversation format.

Use this tool to show relevant parts of a transcript to the user.
The transcript will be displayed as a chat-like conversation with:
- Speaker identification with colored avatars
- Message bubbles for each turn
- Timestamps

You can show the full transcript or just relevant portions.
Map party_id from transcript turns to participant id to identify speakers.`;

export const showTranscriptInputSchema = z.object({
  callId: z.string().describe("The ID of the call"),
  callTitle: z.string().describe("The title of the call for context"),
  turns: z
    .array(TranscriptTurnSchema)
    .describe("The transcript turns to display"),
  participants: z
    .array(ParticipantSchema)
    .describe("Participants to map party_id to names"),
  context: z
    .string()
    .optional()
    .describe(
      "Optional context about what part of the transcript this is, e.g. 'Discussion about pricing'",
    ),
});

export type ShowTranscriptInput = z.infer<typeof showTranscriptInputSchema>;

export const showTranscriptTool = createTool({
  id: "show-transcript",
  description: DESCRIPTION,
  inputSchema: showTranscriptInputSchema,
  outputSchema: z.object({
    displayed: z.boolean(),
    turnCount: z.number(),
  }),
  execute: async (input) => {
    return { displayed: true, turnCount: input.turns.length };
  },
});
