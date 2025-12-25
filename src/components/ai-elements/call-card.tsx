"use client";

import { BuildingIcon, CalendarIcon, ClockIcon } from "lucide-react";
import { type ComponentProps, memo } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration, formatRelativeDate } from "@/lib/utils";
import type { CallStatus, Participant } from "@/types/call";
import { CallStatusBadge } from "./call-status-badge";
import {
  ParticipantAvatar,
  ParticipantListHoverCard,
} from "./participant-hover-card";

export type { CallStatus, Participant };

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

export const CallCard = memo(
  ({
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
            {formatRelativeDate(startTime)}
          </span>
          {duration != null && (
            <span className="flex items-center gap-1">
              <ClockIcon className="size-3" />
              {formatDuration(duration, "short")}
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
                  <ParticipantAvatar
                    key={participant.id}
                    participant={participant}
                  />
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
  },
);

CallCard.displayName = "CallCard";
