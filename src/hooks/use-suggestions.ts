import type { UIMessage } from "ai";
import { useMemo } from "react";
import { isToolPart } from "@/lib/type-guards";
import { SUGGEST_TOOL_ID } from "@/mastra/constants";

/** Extracts tool ID from a tool part type (e.g., "tool-myTool" -> "myTool") */
const getToolId = (partType: string) => partType.replace("tool-", "");

const DEFAULT_SUGGESTIONS = [
  "Get me a list of all calls from the last two weeks",
  "Find all calls with jordan@freetrade.io",
  "Who did adam@glyphic.ai talk to in his last call?",
  "Summarize the calls we had in September",
] as const;

export type SuggestionsOutput = { suggestions?: string[] };

/**
 * Hook to extract suggestions from the last suggest-follow-ups tool output.
 * Falls back to default suggestions if none are found.
 */
export function useSuggestions(messages: UIMessage[]): string[] {
  return useMemo(() => {
    if (messages.length === 0) {
      return [...DEFAULT_SUGGESTIONS];
    }

    // Find the last assistant message with suggest-follow-ups tool output
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role !== "assistant" || !message.parts) continue;

      for (const part of message.parts) {
        if (!isToolPart(part)) continue;

        const toolId = getToolId(part.type);
        if (toolId !== SUGGEST_TOOL_ID) continue;

        // Access output from the part (type narrowing)
        const toolPart = part as { output?: unknown };
        if (!toolPart.output) continue;

        let output: SuggestionsOutput;
        if (typeof toolPart.output === "string") {
          try {
            output = JSON.parse(toolPart.output);
          } catch {
            continue;
          }
        } else {
          output = toolPart.output as SuggestionsOutput;
        }

        if (
          output.suggestions &&
          Array.isArray(output.suggestions) &&
          output.suggestions.length > 0
        ) {
          return output.suggestions;
        }
      }
    }

    return [...DEFAULT_SUGGESTIONS];
  }, [messages]);
}

export { DEFAULT_SUGGESTIONS };
