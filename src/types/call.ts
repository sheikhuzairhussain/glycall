/**
 * Shared types for call-related data structures.
 * These types are used across UI components and Mastra tools.
 */

/**
 * Call status values as returned by the Glyphic API
 */
export type CallStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

/**
 * Participant in a call
 */
export type Participant = {
  name?: string | null;
  email?: string | null;
  id: number;
};

/**
 * Company associated with a call
 */
export type Company = {
  name?: string | null;
  domain: string;
};

/**
 * A single turn in a call transcript
 */
export type TranscriptTurn = {
  party_id: number;
  turn_text: string;
  timestamp: string;
};

/**
 * Preview data for a call (used in lists)
 */
export type CallPreview = {
  id: string;
  title: string;
  start_time: string;
  duration?: number | null;
  status: { code: CallStatus };
  companies?: Company[];
  participants?: Participant[];
};

/**
 * Detailed call data (includes summary, transcript, etc.)
 */
export type CallDetail = CallPreview & {
  summary?: string | null;
  url_link?: string | null;
  transcript_turns?: TranscriptTurn[] | null;
  insights?: Array<{
    name: string;
    value?: string | null;
  }> | null;
};
