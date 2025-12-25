"use client";

import type { ToolUIPart } from "ai";
import { CallDetail } from "@/components/ai-elements/call-detail";
import { CallList } from "@/components/ai-elements/call-list";
import { ParticipantList } from "@/components/ai-elements/participant-list";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Transcript } from "@/components/ai-elements/transcript";
import { CLIENT_TOOL_IDS, SERVER_TOOL_LABELS } from "@/mastra/constants";
import type {
  ShowCallInfoInput,
  ShowCallListInput,
  ShowParticipantsInput,
  ShowTranscriptInput,
} from "@/mastra/tools/ui";

/** Extracts tool ID from a tool part type (e.g., "tool-myTool" -> "myTool") */
export const getToolId = (partType: string) => partType.replace("tool-", "");

/**
 * Renders a server tool's loading/done status.
 */
export function ServerToolStatus({
  part,
  toolKey,
}: {
  part: ToolUIPart;
  toolKey: string;
}) {
  const toolId = getToolId(part.type);
  const labels = SERVER_TOOL_LABELS[toolId];
  if (!labels) return null;

  const isLoading =
    part.state !== "output-available" && part.state !== "output-error";

  return (
    <div key={toolKey} className="text-sm text-muted-foreground">
      {isLoading ? (
        <Shimmer className="text-muted-foreground">{`${labels.loading}...`}</Shimmer>
      ) : (
        <span>{labels.done}</span>
      )}
    </div>
  );
}

/**
 * Renders a client tool's custom UI component.
 */
export function ClientToolUI({
  part,
  toolKey,
}: {
  part: ToolUIPart;
  toolKey: string;
}) {
  const toolId = getToolId(part.type);

  if (part.state === "output-error") {
    return (
      <div
        key={toolKey}
        className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
      >
        Error: {part.errorText || "Failed to display content"}
      </div>
    );
  }

  // Don't render until output is available
  if (part.state !== "output-available") return null;

  switch (toolId) {
    case CLIENT_TOOL_IDS.SHOW_CALL_LIST: {
      const input = part.input as ShowCallListInput;
      return (
        <CallList
          key={toolKey}
          calls={input.calls}
          title={input.title}
          hasMore={input.hasMore}
        />
      );
    }

    case CLIENT_TOOL_IDS.SHOW_CALL_INFO: {
      const input = part.input as ShowCallInfoInput;
      return <CallDetail key={toolKey} call={input.call} />;
    }

    case CLIENT_TOOL_IDS.SHOW_TRANSCRIPT: {
      const input = part.input as ShowTranscriptInput;
      return (
        <Transcript
          key={toolKey}
          callId={input.callId}
          callTitle={input.callTitle}
          turns={input.turns}
          participants={input.participants}
          context={input.context}
        />
      );
    }

    case CLIENT_TOOL_IDS.SHOW_PARTICIPANTS: {
      const input = part.input as ShowParticipantsInput;
      return (
        <ParticipantList
          key={toolKey}
          participants={input.participants}
          companies={input.companies}
          context={input.context}
        />
      );
    }

    default:
      return null;
  }
}
