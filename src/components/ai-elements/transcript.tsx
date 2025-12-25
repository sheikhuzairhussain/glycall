"use client";

import {
  ChevronDownIcon,
  ChevronUpIcon,
  MessageSquareIcon,
} from "lucide-react";
import { type ComponentProps, useMemo, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TranscriptTurn = {
  party_id: number;
  turn_text: string;
  timestamp: string;
};

export type Participant = {
  name?: string | null;
  email?: string | null;
  id: number;
};

export type TranscriptProps = ComponentProps<"div"> & {
  callId: string;
  callTitle: string;
  turns: TranscriptTurn[];
  participants: Participant[];
  context?: string;
  maxVisibleTurns?: number;
};

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return "?";
}

function getParticipantColor(participantId: number): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-indigo-500",
  ];
  return colors[participantId % colors.length];
}

function formatDuration(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  const parts: string[] = [];
  if (hrs > 0) {
    parts.push(`${hrs} ${hrs === 1 ? "hour" : "hours"}`);
  }
  if (mins > 0) {
    parts.push(`${mins} ${mins === 1 ? "minute" : "minutes"}`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs} ${secs === 1 ? "second" : "seconds"}`);
  }

  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return `${parts[0]}, ${parts[1]} and ${parts[2]}`;
}

function formatTimestamp(timestamp: string): string {
  // Parse MM:SS or HH:MM:SS format
  const timeMatch = timestamp.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch) {
    const [, first, second, third] = timeMatch;
    let totalSeconds: number;
    if (third !== undefined) {
      // HH:MM:SS format
      totalSeconds = Number(first) * 3600 + Number(second) * 60 + Number(third);
    } else {
      // MM:SS format
      totalSeconds = Number(first) * 60 + Number(second);
    }
    return formatDuration(totalSeconds);
  }

  return timestamp;
}

export const Transcript = ({
  className,
  callId,
  callTitle,
  turns,
  participants,
  context,
  maxVisibleTurns = 10,
  ...props
}: TranscriptProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Create a map from party_id to participant for quick lookup
  const participantMap = useMemo(() => {
    const map = new Map<number, Participant>();
    for (const p of participants) {
      map.set(p.id, p);
    }
    return map;
  }, [participants]);

  const visibleTurns = isExpanded ? turns : turns.slice(0, maxVisibleTurns);
  const hasMoreTurns = turns.length > maxVisibleTurns;

  if (turns.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center",
          className,
        )}
        {...props}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <MessageSquareIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">No transcript available</p>
          <p className="text-xs text-muted-foreground">
            This call doesn't have a transcript yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquareIcon className="size-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{context || "Transcript"}</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          {turns.length} turn{turns.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Transcript turns */}
      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        {visibleTurns.map((turn, index) => {
          const participant = participantMap.get(turn.party_id);
          const isLeft = turn.party_id % 2 === 0;

          return (
            <div
              key={`${turn.party_id}-${index}`}
              className={cn(
                "flex gap-3",
                isLeft ? "flex-row" : "flex-row-reverse",
              )}
            >
              <Avatar
                className={cn(
                  "size-8 shrink-0 text-xs",
                  getParticipantColor(turn.party_id),
                )}
              >
                <AvatarFallback className="bg-transparent text-white">
                  {getInitials(participant?.name, participant?.email)}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "flex max-w-[80%] flex-col gap-1",
                  isLeft ? "items-start" : "items-end",
                )}
              >
                <span className="text-xs text-muted-foreground">
                  <span className="font-medium">
                    {participant?.name ||
                      participant?.email ||
                      `Speaker ${turn.party_id}`}
                  </span>{" "}
                  @ {formatTimestamp(turn.timestamp)}
                </span>
                <div
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    isLeft
                      ? "bg-muted text-foreground rounded-tl-none"
                      : "bg-primary text-primary-foreground rounded-tr-none",
                  )}
                >
                  {turn.turn_text}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Expand/Collapse button */}
      {hasMoreTurns && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="size-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDownIcon className="size-4" />
              Show {turns.length - maxVisibleTurns} more turns
            </>
          )}
        </Button>
      )}
    </div>
  );
};
