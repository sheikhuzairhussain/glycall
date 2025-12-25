"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CallDetail,
  CallDetailSkeleton,
} from "@/components/ai-elements/call-detail";
import {
  CallInsights,
  CallInsightsSkeleton,
} from "@/components/ai-elements/call-insights";
// Generative UI components
import { CallList, CallListSkeleton } from "@/components/ai-elements/call-list";
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
  ParticipantList,
  ParticipantListSkeleton,
} from "@/components/ai-elements/participant-list";
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
  Transcript,
  TranscriptSkeleton,
} from "@/components/ai-elements/transcript";
// Tool input types for type-safe casting
import type {
  ShowCallInfoInput,
  ShowCallInsightsInput,
  ShowCallListInput,
  ShowParticipantsInput,
  ShowTranscriptInput,
} from "@/mastra/tools/ui";
import { useTRPC } from "@/trpc/client";

const initialSuggestions = [
  "Get me a list of all calls from the last two weeks",
  "Find all calls with jordan@freetrade.io",
  "Who did adam@glyphic.ai talk to in his last call?",
  "Summarize the calls we had in September",
];

// Tool ID for suggest-follow-ups (matches the variable name, not the tool id)
const SUGGEST_TOOL_ID = "suggestFollowUpsTool";

// Display tool IDs - these render custom UI components
const DISPLAY_TOOL_IDS = [
  "showCallListTool",
  "showCallInfoTool",
  "showTranscriptTool",
  "showCallInsightsTool",
  "showParticipantsTool",
];

const RESOURCE_ID = "glyphic-chat";

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

export default function ChatPage({
  params,
}: {
  params: Promise<{ threadId?: string[] }>;
}) {
  const { threadId: threadIdParam } = use(params);
  const threadId = threadIdParam?.[0];

  const [inputValue, setInputValue] = useState<string>("");
  const [isCreatingThread, setIsCreatingThread] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(!!threadId);
  const pendingMessageRef = useRef<string | null>(null);
  const hasSentInitialMessage = useRef(false);
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
      onError: () => {
        setIsCreatingThread(false);
      },
    }),
  );

  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: threadId,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: { timezone, threadId },
    }),
  });

  // Load initial messages when threadId exists
  useEffect(() => {
    if (!threadId) {
      setIsLoadingMessages(false);
      return;
    }

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
    if (!threadId || isLoadingMessages || hasSentInitialMessage.current) return;

    const storageKey = `pending-message-${threadId}`;
    const initialMessage = sessionStorage.getItem(storageKey);

    if (initialMessage) {
      hasSentInitialMessage.current = true;
      sessionStorage.removeItem(storageKey);
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
        for (const part of message.parts) {
          if (!part.type.startsWith("tool-")) continue;

          const toolPart = part as ToolUIPart;
          const toolId = toolPart.type.replace("tool-", "");

          if (toolId === SUGGEST_TOOL_ID && toolPart.output) {
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
    if (!message.text?.trim()) return;

    if (threadId) {
      // Existing thread - send message directly
      sendMessage({ text: message.text });
      setInputValue("");
    } else {
      // New chat - create thread first
      handleNewChat(message.text);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (threadId) {
      sendMessage({ text: suggestion });
    } else {
      handleNewChat(suggestion);
    }
  };

  // Helper to extract text from message parts
  const getMessageText = (message: (typeof messages)[number]) => {
    if (!message.parts) return "";

    const textParts = message.parts.filter((part) => part.type === "text");
    if (textParts.length === 0) return "";

    const hasCompletedDisplayTools = message.parts.some((part) => {
      if (!part.type.startsWith("tool-")) return false;
      const toolId = part.type.replace("tool-", "");
      const toolPart = part as ToolUIPart;
      return (
        DISPLAY_TOOL_IDS.includes(toolId) &&
        toolPart.state === "output-available"
      );
    });

    if (hasCompletedDisplayTools && textParts.length > 1) {
      const lastTextPart = textParts[textParts.length - 1];
      return lastTextPart.type === "text" ? lastTextPart.text : "";
    }

    return textParts
      .map((part) => (part.type === "text" ? part.text : ""))
      .join("");
  };

  // Helper to get reasoning parts
  const getReasoningParts = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts.filter((part) => part.type === "reasoning");
    }
    return [];
  };

  // Helper to get display tool parts for generative UI
  const getDisplayToolParts = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts.filter((part) => {
        if (!part.type.startsWith("tool-")) return false;
        const toolId = part.type.replace("tool-", "");
        return DISPLAY_TOOL_IDS.includes(toolId);
      }) as ToolUIPart[];
    }
    return [];
  };

  // Render display tool as custom UI component
  const renderDisplayTool = (part: ToolUIPart, key: string) => {
    const toolId = part.type.replace("tool-", "");
    const isLoading =
      part.state === "input-available" || part.state === "input-streaming";
    const hasError = part.state === "output-error";

    if (hasError) {
      return (
        <div
          key={key}
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Error: {part.errorText || "Failed to display content"}
        </div>
      );
    }

    switch (toolId) {
      case "showCallListTool": {
        if (isLoading) return <CallListSkeleton key={key} />;
        const input = part.input as ShowCallListInput;
        return (
          <CallList
            key={key}
            calls={input.calls}
            title={input.title}
            hasMore={input.hasMore}
          />
        );
      }

      case "showCallInfoTool": {
        if (isLoading) return <CallDetailSkeleton key={key} />;
        const input = part.input as ShowCallInfoInput;
        return <CallDetail key={key} call={input.call} />;
      }

      case "showTranscriptTool": {
        if (isLoading) return <TranscriptSkeleton key={key} />;
        const input = part.input as ShowTranscriptInput;
        return (
          <Transcript
            key={key}
            callId={input.callId}
            callTitle={input.callTitle}
            turns={input.turns}
            participants={input.participants}
            context={input.context}
          />
        );
      }

      case "showCallInsightsTool": {
        if (isLoading) return <CallInsightsSkeleton key={key} />;
        const input = part.input as ShowCallInsightsInput;
        return (
          <CallInsights
            key={key}
            callId={input.callId}
            callTitle={input.callTitle}
            insights={input.insights}
          />
        );
      }

      case "showParticipantsTool": {
        if (isLoading) return <ParticipantListSkeleton key={key} />;
        const input = part.input as ShowParticipantsInput;
        return (
          <ParticipantList
            key={key}
            participants={input.participants}
            companies={input.companies}
            context={input.context}
          />
        );
      }

      default:
        return null;
    }
  };

  const hasMessages = messages.length > 0;
  const showWelcome = !threadId && !hasMessages;

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      {showWelcome ? (
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
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
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
                              from={
                                message.role === "user" ? "user" : "assistant"
                              }
                            >
                              <div className="space-y-3">
                                {getReasoningParts(message).map((part, idx) => (
                                  <Reasoning
                                    key={`reasoning-${message.id}-${idx}`}
                                    duration={0}
                                  >
                                    <ReasoningTrigger />
                                    <ReasoningContent>
                                      {part.type === "reasoning"
                                        ? part.text
                                        : ""}
                                    </ReasoningContent>
                                  </Reasoning>
                                ))}

                                {getMessageText(message) && (
                                  <MessageContent>
                                    <MessageResponse>
                                      {getMessageText(message)}
                                    </MessageResponse>
                                  </MessageContent>
                                )}

                                {getDisplayToolParts(message).map((part, idx) =>
                                  renderDisplayTool(
                                    part,
                                    `display-${message.id}-${idx}`,
                                  ),
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
            <div className="pointer-events-none absolute inset-x-0 -top-8 h-8" />
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
                  <Suggestion suggestion="" className="opacity-0 w-0" />
                </Suggestions>
              )}
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
        </>
      )}
    </div>
  );
}
