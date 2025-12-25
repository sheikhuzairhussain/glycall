"use client";

import { BuildingIcon, CalendarIcon, ClockIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CallStatusBadge, type CallStatus } from "./call-status-badge";
import {
  ParticipantAvatar,
  ParticipantListHoverCard,
  type Participant,
} from "./participant-hover-card";

export type { CallStatus };

export type CallCardProps = ComponentProps<"button"> & {
  id: string;
  title: string;
  startTime: string;
  duration?: number | null;
  status: CallStatus;
  companies?: Array<{ name?: string | null; domain: string }>;
  participants?: Participant[];
  onClick?: () => void;
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export const CallCard = ({
  className,
  id,
  title,
  startTime,
  duration,
  status,
  companies,
  participants,
  onClick,
  ...props
}: CallCardProps) => {
  const displayParticipants = participants?.slice(0, 4) || [];
  const remainingCount = (participants?.length || 0) - 4;

  return (
    <button
      type="button"
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {/* Title */}
      <h3 className="font-medium text-sm leading-tight line-clamp-2 text-left">
        {title}
      </h3>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarIcon className="size-3" />
          {formatDate(startTime)}
        </span>
        {duration != null && (
          <span className="flex items-center gap-1">
            <ClockIcon className="size-3" />
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Companies */}
      {companies && companies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {companies.map((company) => (
            <Badge
              key={company.domain}
              variant="outline"
              className="gap-1 text-xs font-normal"
            >
              <BuildingIcon className="size-3" />
              {company.name || company.domain}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer: Participants + Status Badge */}
      <div className="flex items-center justify-between gap-2">
        {displayParticipants.length > 0 ? (
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {displayParticipants.map((participant) => (
                <ParticipantAvatar key={participant.id} participant={participant} />
              ))}
              {remainingCount > 0 && (
                <ParticipantListHoverCard
                  participants={participants?.slice(4) || []}
                  title={`+${remainingCount} more participants`}
                >
                  <Avatar className="size-6 border-2 border-background bg-muted text-[10px] cursor-pointer">
                    <AvatarFallback>+{remainingCount}</AvatarFallback>
                  </Avatar>
                </ParticipantListHoverCard>
              )}
            </div>
            <ParticipantListHoverCard participants={participants || []}>
              <span className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                {participants?.length === 1
                  ? displayParticipants[0].name ||
                    displayParticipants[0].email ||
                    "1 participant"
                  : `${participants?.length} participants`}
              </span>
            </ParticipantListHoverCard>
          </div>
        ) : (
          <div />
        )}
        <CallStatusBadge status={status} />
      </div>
    </button>
  );
};
