"use client";

import { useChat } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { PhoneIcon, InfoIcon } from "lucide-react";
import { useState, useMemo } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageBranch,
  MessageBranchContent,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  PromptInputFooter,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "@/components/ai-elements/reasoning";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";

// Friendly descriptions for tools
const toolDescriptions: Record<
  string,
  {
    title: string;
    runningMessage: string;
    icon: React.ReactNode;
  }
> = {
  "list-calls": {
    title: "Call Search",
    runningMessage: "Searching calls in Glyphic...",
    icon: <PhoneIcon className="size-4 text-emerald-500" />,
  },
  "get-call-info": {
    title: "Call Details",
    runningMessage: "Fetching call details...",
    icon: <InfoIcon className="size-4 text-blue-500" />,
  },
};

const initialSuggestions = [
  "Get me a list of all calls from the last two weeks",
  "Find all calls with jordan@freetrade.io",
  "Who did adam@glyphic.ai talk to in his last call?",
  "Summarize the calls we had in September",
];

// Tool ID for suggest-follow-ups (matches the variable name, not the tool id)
const SUGGEST_TOOL_ID = "suggestFollowUpsTool";

const GlyphicChat = () => {
  const [inputValue, setInputValue] = useState<string>("");

  // Get browser timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { timezone },
    }),
  });

  // Get suggestions from the last suggest-follow-ups tool output
  const currentSuggestions = useMemo(() => {
    if (messages.length === 0) {
      return initialSuggestions;
    }

    // Find the last assistant message with suggest-follow-ups tool output
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role === "assistant" && message.parts) {
        // Find the suggest-follow-ups tool part
        for (const part of message.parts) {
          if (!part.type.startsWith("tool-")) continue;

          const toolPart = part as ToolUIPart;
          const toolId = toolPart.type.replace("tool-", "");

          if (toolId === SUGGEST_TOOL_ID && toolPart.output) {
            // Handle both object and string (JSON) output
            let output: { suggestions?: string[] };
            if (typeof toolPart.output === "string") {
              try {
                output = JSON.parse(toolPart.output);
              } catch {
                continue;
              }
            } else {
              output = toolPart.output as { suggestions?: string[] };
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
      }
    }

    return initialSuggestions;
  }, [messages]);

  // Map status to UI status
  const uiStatus =
    status === "submitted"
      ? "submitted"
      : status === "streaming"
        ? "streaming"
        : status === "error"
          ? "error"
          : "ready";

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) {
      return;
    }

    sendMessage({ text: message.text });
    setInputValue("");
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  // Helper to extract text from message parts
  const getMessageText = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts
        .filter((part) => part.type === "text")
        .map((part) => (part.type === "text" ? part.text : ""))
        .join("");
    }
    return "";
  };

  // Helper to get reasoning parts
  const getReasoningParts = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts.filter((part) => part.type === "reasoning");
    }
    return [];
  };

  // Helper to get tool parts (tool parts have type starting with "tool-")
  // Exclude the suggest-follow-ups tool from display
  const getToolParts = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts.filter((part) => {
        if (!part.type.startsWith("tool-")) return false;
        const toolId = part.type.replace("tool-", "");
        return toolId !== SUGGEST_TOOL_ID;
      }) as ToolUIPart[];
    }
    return [];
  };

  // Get user-friendly tool info
  const getToolInfo = (toolType: string) => {
    // toolType is like "tool-list-calls", extract "list-calls"
    const toolId = toolType.replace("tool-", "");
    return (
      toolDescriptions[toolId] || {
        title: toolId,
        runningMessage: `Running ${toolId}`,
        icon: null,
      }
    );
  };

  return (
    <div className="relative flex size-full flex-col divide-y overflow-hidden">
      <Conversation>
        <ConversationContent>
          {messages.map((message) => (
            <MessageBranch defaultBranch={0} key={message.id}>
              <MessageBranchContent>
                <Message from={message.role === "user" ? "user" : "assistant"}>
                  <div className="space-y-3">
                    {/* Tool calls */}
                    {getToolParts(message).map((part, idx) => {
                      const toolInfo = getToolInfo(part.type);
                      const isRunning =
                        part.state === "input-available" ||
                        part.state === "input-streaming";

                      return (
                        <Tool
                          key={`tool-${message.id}-${idx}`}
                          defaultOpen={false}
                        >
                          <ToolHeader
                            title={
                              isRunning
                                ? toolInfo.runningMessage
                                : toolInfo.title
                            }
                            type={part.type}
                            state={part.state}
                          />
                          <ToolContent>
                            <ToolInput input={part.input} />
                            <ToolOutput
                              output={part.output}
                              errorText={part.errorText}
                            />
                          </ToolContent>
                        </Tool>
                      );
                    })}

                    {/* Reasoning */}
                    {getReasoningParts(message).map((part, idx) => (
                      <Reasoning
                        key={`reasoning-${message.id}-${idx}`}
                        duration={0}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>
                          {part.type === "reasoning" ? part.text : ""}
                        </ReasoningContent>
                      </Reasoning>
                    ))}

                    {/* Text response */}
                    {getMessageText(message) && (
                      <MessageContent>
                        <MessageResponse>
                          {getMessageText(message)}
                        </MessageResponse>
                      </MessageContent>
                    )}
                  </div>
                </Message>
              </MessageBranchContent>
            </MessageBranch>
          ))}
          {error && (
            <div className="px-4 py-2 text-red-500 text-sm">
              Error: {error.message}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="grid shrink-0 gap-4 pt-4">
        {uiStatus === "ready" && (
          <Suggestions className="px-4" key={currentSuggestions.join("|")}>
            {currentSuggestions.map((suggestion, index) => (
              <Suggestion
                key={`${index}-${suggestion}`}
                onClick={() => handleSuggestionClick(suggestion)}
                suggestion={suggestion}
              />
            ))}
          </Suggestions>
        )}
        <div className="w-full px-4 pb-4">
          <PromptInput onSubmit={handleSubmit}>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(event) => setInputValue(event.target.value)}
                placeholder="Ask about your sales calls..."
                value={inputValue}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputSubmit
                disabled={!inputValue.trim() || uiStatus === "streaming"}
                status={uiStatus}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  );
};

export default GlyphicChat;
