"use client";

import { useChat } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { PhoneIcon, InfoIcon, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useMemo, useRef, useCallback } from "react";
import { useTRPC } from "@/trpc/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

// Welcome screen component
function WelcomeScreen({
  onSuggestionClick,
}: {
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto px-4 py-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-gray-500 shadow-md">
            <Sparkles className="size-6 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome to Glycall
            </h1>
            <p className="text-muted-foreground text-sm">
              Your AI-powered sales call assistant. Ask me anything about your
              calls.
            </p>
          </div>
        </div>

        {/* Suggestions */}
        <div className="grid gap-2 sm:grid-cols-2">
          {initialSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              type="button"
              className="cursor-pointer rounded-lg border bg-card px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 flex items-start justify-start"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const RESOURCE_ID = "glyphic-chat";

const GlyphicChat = () => {
  const [inputValue, setInputValue] = useState<string>("");
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const pendingMessageRef = useRef<string | null>(null);
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Get browser timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const createThreadMutation = useMutation(
    trpc.threads.create.mutationOptions({
      onSuccess: (thread) => {
        // Invalidate threads list to refresh sidebar
        queryClient.invalidateQueries({
          queryKey: trpc.threads.list.queryKey(),
        });
        // Store the pending message in sessionStorage for the thread page to pick up
        const message = pendingMessageRef.current;
        if (message) {
          sessionStorage.setItem(`pending-message-${thread.id}`, message);
        }
        // Navigate to the new thread
        router.push(`/chat/${thread.id}`);
      },
    }),
  );

  const { messages, status, error } = useChat({
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

  const handleNewChat = useCallback(
    (text: string) => {
      if (!text.trim() || isCreatingThread) return;

      setIsCreatingThread(true);
      pendingMessageRef.current = text;
      setInputValue("");

      createThreadMutation.mutate({
        resourceId: RESOURCE_ID,
        title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
      });
    },
    [isCreatingThread, createThreadMutation],
  );

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) {
      return;
    }
    handleNewChat(message.text);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleNewChat(suggestion);
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

  const hasMessages = messages.length > 0;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {!hasMessages ? (
        <>
          <WelcomeScreen onSuggestionClick={handleSuggestionClick} />
          <div className="relative shrink-0 pb-4">
            <div className="pointer-events-none absolute inset-x-0 -top-8 h-8 bg-linear-to-t from-background to-transparent" />
            <div className="relative mx-auto w-full max-w-3xl px-4">
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
                    disabled={
                      !inputValue.trim() ||
                      uiStatus === "streaming" ||
                      isCreatingThread
                    }
                    status={isCreatingThread ? "submitted" : uiStatus}
                  />
                </PromptInputFooter>
              </PromptInput>
            </div>
          </div>
        </>
      ) : (
        <>
          <Conversation className="min-h-0 flex-1">
            <ConversationContent className="mx-auto w-full max-w-3xl pb-8">
              {messages.map((message) => (
                <MessageBranch defaultBranch={0} key={message.id}>
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
              ))}
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
              {uiStatus === "ready" ? (
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
                <div className="flex flex-wrap gap-2">
                  {["skel-1", "skel-2", "skel-3", "skel-4"].map((id) => (
                    <Skeleton key={id} className="h-8 w-32 rounded-full" />
                  ))}
                </div>
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
        </>
      )}
    </div>
  );
};

export default GlyphicChat;
