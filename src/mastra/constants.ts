/**
 * Tool ID constants for Mastra agent tools.
 * These IDs must match the tool definitions in the agent and are used
 * in the UI to identify tool outputs.
 *
 * Note: Tool IDs use the variable name format (e.g., "listCallsTool")
 * not the tool definition id (e.g., "list-calls").
 */

// Data fetching tools (server-side)
export const TOOL_IDS = {
  /** List calls from the Glyphic API */
  LIST_CALLS: "listCallsTool",
  /** Get detailed call info from the Glyphic API */
  GET_CALL_INFO: "getCallInfoTool",
  /** Get current time for date calculations */
  GET_CURRENT_TIME: "getCurrentTimeTool",
} as const;

// UI display tools (client-side, render custom components)
export const CLIENT_TOOL_IDS = {
  /** Display a list of calls as cards */
  SHOW_CALL_LIST: "showCallListTool",
  /** Display detailed call info */
  SHOW_CALL_INFO: "showCallInfoTool",
  /** Display call transcript */
  SHOW_TRANSCRIPT: "showTranscriptTool",
  /** Display participant list */
  SHOW_PARTICIPANTS: "showParticipantsTool",
} as const;

// Follow-up suggestion tool
export const SUGGEST_TOOL_ID = "suggestFollowUpsTool" as const;

// Server tool labels for loading/done states
export const SERVER_TOOL_LABELS: Record<
  string,
  { loading: string; done: string }
> = {
  [TOOL_IDS.LIST_CALLS]: { loading: "Searching calls", done: "Searched calls" },
  [TOOL_IDS.GET_CALL_INFO]: {
    loading: "Retrieving call information",
    done: "Retrieved call information",
  },
} as const;

// Array of all client tool IDs for filtering
export const CLIENT_TOOL_ID_LIST = Object.values(
  CLIENT_TOOL_IDS,
) as readonly string[];

// Type guard to check if a tool ID is a client tool
export function isClientToolId(toolId: string): toolId is ClientToolId {
  return CLIENT_TOOL_ID_LIST.includes(toolId);
}

// Type helpers
export type ToolId = (typeof TOOL_IDS)[keyof typeof TOOL_IDS];
export type ClientToolId =
  (typeof CLIENT_TOOL_IDS)[keyof typeof CLIENT_TOOL_IDS];
