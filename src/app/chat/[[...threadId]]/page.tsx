"use client";

import { useChat } from "@ai-sdk/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { Loader2, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { use, useCallback, useEffect, useRef, useState } from "react";
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
  MessageCopyButton,
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
  ClientToolUI,
  getToolId,
  ServerToolStatus,
  TypingIndicator,
  WelcomeScreen,
} from "@/components/chat";
import { MessageErrorBoundary } from "@/components/error-boundary";
import { useSuggestions } from "@/hooks/use-suggestions";
import { isReasoningPart, isTextPart, isToolPart } from "@/lib/type-guards";
import { isClientToolId, SERVER_TOOL_LABELS } from "@/mastra/constants";
import { useTRPC } from "@/trpc/client";

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
        queryClient.invalidateQueries({
          queryKey: trpc.threads.list.queryKey(),
        });
        // Pass initial message via sessionStorage
        const message = pendingMessageRef.current;
        if (message) {
          sessionStorage.setItem(`pending-message-${thread.id}`, message);
        }
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
      } catch {
        // Failed to load messages - thread may be new
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

  // Get suggestions from messages
  const currentSuggestions = useSuggestions(messages);

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
        title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
      });
    },
    [isCreatingThread, createThreadMutation],
  );

  const handleSubmit = (message: PromptInputMessage) => {
    if (!message.text?.trim()) return;

    if (threadId) {
      sendMessage({ text: message.text });
      setInputValue("");
    } else {
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

  // Message part helpers using type guards
  const getMessageText = (message: (typeof messages)[number]) => {
    if (!message.parts) return "";

    const textParts = message.parts.filter(isTextPart);
    if (textParts.length === 0) return "";

    const hasCompletedDisplayTools = message.parts.some((part) => {
      if (!isToolPart(part)) return false;
      const toolId = getToolId(part.type);
      const toolPart = part as ToolUIPart;
      return isClientToolId(toolId) && toolPart.state === "output-available";
    });

    if (hasCompletedDisplayTools && textParts.length > 1) {
      const lastTextPart = textParts[textParts.length - 1];
      return lastTextPart.text;
    }

    return textParts.map((part) => part.text).join("");
  };

  const getReasoningParts = (message: (typeof messages)[number]) => {
    return message.parts?.filter(isReasoningPart) ?? [];
  };

  const getClientToolParts = (message: (typeof messages)[number]) => {
    return (message.parts?.filter((part) => {
      if (!isToolPart(part)) return false;
      return isClientToolId(getToolId(part.type));
    }) ?? []) as ToolUIPart[];
  };

  const getServerToolParts = (message: (typeof messages)[number]) => {
    return (message.parts?.filter((part) => {
      if (!isToolPart(part)) return false;
      return getToolId(part.type) in SERVER_TOOL_LABELS;
    }) ?? []) as ToolUIPart[];
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
                    {messages.map((message, index) => {
                      const messageText = getMessageText(message);
                      const isAssistant = message.role === "assistant";
                      const isLastMessage = index === messages.length - 1;
                      const isStreaming =
                        uiStatus === "streaming" || uiStatus === "submitted";
                      const showCopyButton =
                        isAssistant &&
                        messageText &&
                        !(isLastMessage && isStreaming);

                      return (
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
                          <MessageErrorBoundary>
                            <MessageBranch defaultBranch={0}>
                              <MessageBranchContent>
                                <Message
                                  from={
                                    message.role === "user"
                                      ? "user"
                                      : "assistant"
                                  }
                                >
                                  <div className="flex flex-col gap-3">
                                    {getReasoningParts(message).map(
                                      (part, idx) => (
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
                                      ),
                                    )}

                                    {getServerToolParts(message).map(
                                      (part, idx) => (
                                        <ServerToolStatus
                                          key={`server-${message.id}-${idx}`}
                                          part={part}
                                          toolKey={`server-${message.id}-${idx}`}
                                        />
                                      ),
                                    )}

                                    {getClientToolParts(message).map(
                                      (part, idx) => (
                                        <ClientToolUI
                                          key={`client-${message.id}-${idx}`}
                                          part={part}
                                          toolKey={`client-${message.id}-${idx}`}
                                        />
                                      ),
                                    )}

                                    {messageText && (
                                      <MessageContent>
                                        <MessageResponse>
                                          {messageText}
                                        </MessageResponse>
                                      </MessageContent>
                                    )}

                                    <AnimatePresence>
                                      {showCopyButton && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -8 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -8 }}
                                          transition={{
                                            duration: 0.2,
                                            ease: "easeOut",
                                          }}
                                        >
                                          <MessageCopyButton
                                            content={messageText}
                                          />
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </Message>
                              </MessageBranchContent>
                            </MessageBranch>
                          </MessageErrorBoundary>
                        </motion.div>
                      );
                    })}

                    {(uiStatus === "submitted" || uiStatus === "streaming") && (
                      <TypingIndicator />
                    )}
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
          <div className="pointer-events-none absolute inset-x-0 bottom-0 py-4 backdrop-blur-lg bg-background/90 shadow-lg">
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
                className="**:data-[slot=input-group]:shadow-xl! **:data-[slot=input-group]:bg-secondary **:data-[slot=input-group]:overflow-visible"
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
