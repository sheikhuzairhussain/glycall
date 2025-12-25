"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CallDetail } from "@/components/ai-elements/call-detail";
// Generative UI components
import { CallList } from "@/components/ai-elements/call-list";
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
import { ParticipantList } from "@/components/ai-elements/participant-list";
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
import { Shimmer } from "@/components/ai-elements/shimmer";
import {
  Suggestion,
  SuggestionCard,
  Suggestions,
  SuggestionsGrid,
} from "@/components/ai-elements/suggestion";
import { Transcript } from "@/components/ai-elements/transcript";
// Tool input types for type-safe casting
import type {
  ShowCallInfoInput,
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

// Client tool IDs - these render custom UI components
const CLIENT_TOOL_IDS = [
  "showCallListTool",
  "showCallInfoTool",
  "showTranscriptTool",
  "showParticipantsTool",
];

// Server tool IDs - these call the API and show status
const SERVER_TOOL_IDS: Record<string, { loading: string; done: string }> = {
  listCallsTool: { loading: "Searching calls", done: "Searched calls" },
  getCallInfoTool: {
    loading: "Retrieving call information",
    done: "Retrieved call information",
  },
};

const RESOURCE_ID = "glyphic-chat";

// Welcome screen component
function WelcomeScreen({
  onSuggestionClick,
}: {
  onSuggestionClick: (suggestion: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto px-4 py-8">
      <div className="flex w-full max-w-xl flex-col gap-6">
        {/* Logo and Title */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-gray-500 shadow-md">
            <Sparkles className="size-6 text-white" />
          </div>
          <div className="flex flex-col gap-1">
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
        <SuggestionsGrid>
          {initialSuggestions.map((suggestion) => (
            <SuggestionCard
              key={suggestion}
              suggestion={suggestion}
              onClick={onSuggestionClick}
            />
          ))}
        </SuggestionsGrid>
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
        CLIENT_TOOL_IDS.includes(toolId) &&
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

  // Helper to get client tool parts for generative UI
  const getClientToolParts = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts.filter((part) => {
        if (!part.type.startsWith("tool-")) return false;
        const toolId = part.type.replace("tool-", "");
        return CLIENT_TOOL_IDS.includes(toolId);
      }) as ToolUIPart[];
    }
    return [];
  };

  // Helper to get server tool parts
  const getServerToolParts = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts.filter((part) => {
        if (!part.type.startsWith("tool-")) return false;
        const toolId = part.type.replace("tool-", "");
        return toolId in SERVER_TOOL_IDS;
      }) as ToolUIPart[];
    }
    return [];
  };

  // Render server tool status
  const renderServerTool = (part: ToolUIPart, key: string) => {
    const toolId = part.type.replace("tool-", "");
    const labels = SERVER_TOOL_IDS[toolId];
    if (!labels) return null;

    const isLoading =
      part.state !== "output-available" && part.state !== "output-error";

    return (
      <div key={key} className="text-sm text-muted-foreground">
        {isLoading ? (
          <Shimmer className="text-muted-foreground">{`${labels.loading}...`}</Shimmer>
        ) : (
          <span>{labels.done}</span>
        )}
      </div>
    );
  };

  // Render client tool as custom UI component
  const renderClientTool = (part: ToolUIPart, key: string) => {
    const toolId = part.type.replace("tool-", "");

    if (part.state === "output-error") {
      return (
        <div
          key={key}
          className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
        >
          Error: {part.errorText || "Failed to display content"}
        </div>
      );
    }

    // Don't render until output is available
    if (part.state !== "output-available") return null;

    switch (toolId) {
      case "showCallListTool": {
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
        const input = part.input as ShowCallInfoInput;
        return <CallDetail key={key} call={input.call} />;
      }

      case "showTranscriptTool": {
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

      case "showParticipantsTool": {
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
            <ConversationContent className="mx-auto w-full max-w-3xl pb-48">
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
                              <div className="flex flex-col gap-3">
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

                                {getServerToolParts(message).map((part, idx) =>
                                  renderServerTool(
                                    part,
                                    `server-${message.id}-${idx}`,
                                  ),
                                )}

                                {getClientToolParts(message).map((part, idx) =>
                                  renderClientTool(
                                    part,
                                    `client-${message.id}-${idx}`,
                                  ),
                                )}

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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 pb-4">
            <div className="pointer-events-none absolute inset-x-0 -top-12 h-12" />
            <div className="pointer-events-auto relative mx-auto flex w-full max-w-3xl flex-col gap-3 px-4">
              {uiStatus === "ready" && !isLoadingMessages ? (
                <Suggestions key={currentSuggestions.join("|")}>
                  <Sparkles className="size-4 text-muted-foreground fill-primary stroke-none" />
                  {currentSuggestions.map((suggestion, index) => (
                    <Suggestion
                      key={`${index}-${suggestion}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      suggestion={suggestion}
                      className="bg-background!"
                    />
                  ))}
                </Suggestions>
              ) : (
                <Suggestions>
                  <Suggestion suggestion="" className="opacity-0 w-0" />
                </Suggestions>
              )}
              <PromptInput
                onSubmit={handleSubmit}
                className="[&_[data-slot=input-group]]:shadow-xl! [&_[data-slot=input-group]]:bg-secondary [&_[data-slot=input-group]]:overflow-visible"
              >
                <PromptInputBody>
                  <PromptInputTextarea
                    onChange={(event) => setInputValue(event.target.value)}
                    placeholder="Ask Glycall about your sales calls..."
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
