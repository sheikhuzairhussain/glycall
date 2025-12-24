"use client";

import { useChat } from "@ai-sdk/react";
import type { ToolUIPart } from "ai";
import { DefaultChatTransport } from "ai";
import { CheckIcon, CloudIcon, GlobeIcon, MicIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
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
  "get-weather": {
    title: "Weather Info",
    runningMessage: "Pulling weather info from Open-Meteo",
    icon: <CloudIcon className="size-4 text-blue-500" />,
  },
};

const models = [
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude 4 Sonnet",
    chef: "Anthropic",
    chefSlug: "anthropic",
    providers: ["anthropic", "azure", "google", "amazon-bedrock"],
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash",
    chef: "Google",
    chefSlug: "google",
    providers: ["google"],
  },
];

const suggestions = [
  "What's the weather in San Francisco?",
  "How's the weather in New York today?",
  "Tell me the temperature in London",
  "What's it like outside in Tokyo?",
];

const Example = () => {
  const [model, setModel] = useState<string>(models[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [useWebSearch, setUseWebSearch] = useState<boolean>(false);
  const [useMicrophone, setUseMicrophone] = useState<boolean>(false);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  const selectedModelData = models.find((m) => m.id === model);

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
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    if (message.files?.length) {
      toast.success("Files attached", {
        description: `${message.files.length} file(s) attached to message`,
      });
    }

    sendMessage({ text: message.text || "" });
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
  const getToolParts = (message: (typeof messages)[number]) => {
    if (message.parts) {
      return message.parts.filter((part) =>
        part.type.startsWith("tool-"),
      ) as ToolUIPart[];
    }
    return [];
  };

  // Get user-friendly tool info
  const getToolInfo = (toolType: string) => {
    // toolType is like "tool-get-weather", extract "get-weather"
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
        <Suggestions className="px-4">
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
        <div className="w-full px-4 pb-4">
          <PromptInput globalDrop multiple onSubmit={handleSubmit}>
            <PromptInputHeader>
              <PromptInputAttachments>
                {(attachment) => <PromptInputAttachment data={attachment} />}
              </PromptInputAttachments>
            </PromptInputHeader>
            <PromptInputBody>
              <PromptInputTextarea
                onChange={(event) => setInputValue(event.target.value)}
                value={inputValue}
              />
            </PromptInputBody>
            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
                <PromptInputButton
                  onClick={() => setUseMicrophone(!useMicrophone)}
                  variant={useMicrophone ? "default" : "ghost"}
                >
                  <MicIcon size={16} />
                  <span className="sr-only">Microphone</span>
                </PromptInputButton>
                <PromptInputButton
                  onClick={() => setUseWebSearch(!useWebSearch)}
                  variant={useWebSearch ? "default" : "ghost"}
                >
                  <GlobeIcon size={16} />
                  <span>Search</span>
                </PromptInputButton>
                <ModelSelector
                  onOpenChange={setModelSelectorOpen}
                  open={modelSelectorOpen}
                >
                  <ModelSelectorTrigger asChild>
                    <PromptInputButton>
                      {selectedModelData?.chefSlug && (
                        <ModelSelectorLogo
                          provider={selectedModelData.chefSlug}
                        />
                      )}
                      {selectedModelData?.name && (
                        <ModelSelectorName>
                          {selectedModelData.name}
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>
                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />
                    <ModelSelectorList>
                      <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                      {["OpenAI", "Anthropic", "Google"].map((chef) => (
                        <ModelSelectorGroup key={chef} heading={chef}>
                          {models
                            .filter((m) => m.chef === chef)
                            .map((m) => (
                              <ModelSelectorItem
                                key={m.id}
                                onSelect={() => {
                                  setModel(m.id);
                                  setModelSelectorOpen(false);
                                }}
                                value={m.id}
                              >
                                <ModelSelectorLogo provider={m.chefSlug} />
                                <ModelSelectorName>{m.name}</ModelSelectorName>
                                <ModelSelectorLogoGroup>
                                  {m.providers.map((provider) => (
                                    <ModelSelectorLogo
                                      key={provider}
                                      provider={provider}
                                    />
                                  ))}
                                </ModelSelectorLogoGroup>
                                {model === m.id ? (
                                  <CheckIcon className="ml-auto size-4" />
                                ) : (
                                  <div className="ml-auto size-4" />
                                )}
                              </ModelSelectorItem>
                            ))}
                        </ModelSelectorGroup>
                      ))}
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>
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

export default Example;
