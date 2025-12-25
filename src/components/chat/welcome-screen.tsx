"use client";

import { Sparkles } from "lucide-react";
import {
  SuggestionCard,
  SuggestionsGrid,
} from "@/components/ai-elements/suggestion";
import { DEFAULT_SUGGESTIONS } from "@/hooks/use-suggestions";

export type WelcomeScreenProps = {
  onSuggestionClick: (suggestion: string) => void;
};

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
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
          {DEFAULT_SUGGESTIONS.map((suggestion) => (
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
