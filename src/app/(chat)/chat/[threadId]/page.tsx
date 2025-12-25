"use client";

import { useChat } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { PhoneIcon, InfoIcon, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useMemo, use, useEffect, useRef } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

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

export default function ThreadChatPage({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = use(params);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const hasSentInitialMessage = useRef(false);

  // Get browser timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { timezone, threadId },
    }),
  });

  // Load initial messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const response = await fetch(`/api/chat?threadId=${threadId}`);
        if (response.ok) {
          const loadedMessages = await response.json();
          if (loadedMessages.length > 0) {
            setMessages(loadedMessages);
          }
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      } finally {
        setIsLoadingMessages(false);
      }
    }
    loadMessages();
  }, [threadId, setMessages]);

  // Handle initial message from sessionStorage (for new chats)
  useEffect(() => {
    if (isLoadingMessages || hasSentInitialMessage.current) return;

    const storageKey = `pending-message-${threadId}`;
    const initialMessage = sessionStorage.getItem(storageKey);

    if (initialMessage) {
      hasSentInitialMessage.current = true;
      // Clear from sessionStorage
      sessionStorage.removeItem(storageKey);
      // Send the initial message
      sendMessage({ text: initialMessage });
    }
  }, [isLoadingMessages, threadId, sendMessage]);

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
    <div className="relative flex h-full min-h-0 flex-col">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl pb-8">
          <AnimatePresence mode="wait">
            {isLoadingMessages ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="size-6 text-muted-foreground" />
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="messages"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-8"
              >
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index * 0.05, 0.3),
                      ease: "easeOut",
                    }}
                  >
                    <MessageBranch defaultBranch={0}>
                      <MessageBranchContent>
                        <Message
                          from={message.role === "user" ? "user" : "assistant"}
                        >
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
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          {error && (
            <div className="px-4 py-2 text-red-500 text-sm">
              Error: {error.message}
            </div>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>
      <div className="relative shrink-0 pb-4">
        <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-linear-to-t from-background to-transparent" />
        <div className="relative mx-auto w-full max-w-3xl space-y-3 px-4">
          {uiStatus === "ready" && !isLoadingMessages ? (
            <Suggestions key={currentSuggestions.join("|")}>
              {currentSuggestions.map((suggestion, index) => (
                <Suggestion
                  key={`${index}-${suggestion}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  suggestion={suggestion}
                />
              ))}
            </Suggestions>
          ) : (
            <Suggestions>
              <Suggestion
                suggestion=""
                className="w-32 pointer-events-none animate-pulse"
              />
              <Suggestion
                suggestion=""
                className="w-56 pointer-events-none animate-pulse"
              />
              <Suggestion
                suggestion=""
                className="w-48 pointer-events-none animate-pulse"
              />
              <Suggestion
                suggestion=""
                className="w-64 pointer-events-none animate-pulse"
              />
            </Suggestions>
          )}
          <PromptInput
            onSubmit={handleSubmit}
            className="**:data-[slot=input-group]:border-border **:data-[slot=input-group]:bg-card **:data-[slot=input-group]:shadow-lg"
          >
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
}
