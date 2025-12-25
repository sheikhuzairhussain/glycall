"use client";

import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";

export type Participant = {
  name?: string | null;
  email?: string | null;
  id: number;
};

export function getInitials(
  name?: string | null,
  email?: string | null,
): string {
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

export function getAvatarColor(identifier: string): string {
  const colors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-amber-500",
    "bg-yellow-500",
    "bg-lime-500",
    "bg-green-500",
    "bg-emerald-500",
    "bg-teal-500",
    "bg-cyan-500",
    "bg-sky-500",
    "bg-blue-500",
    "bg-indigo-500",
    "bg-violet-500",
    "bg-purple-500",
    "bg-fuchsia-500",
    "bg-pink-500",
    "bg-rose-500",
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function getParticipantIdentifier(participant: Participant): string {
  return participant.email || participant.name || String(participant.id);
}

export type ParticipantHoverCardProps = {
  participant: Participant;
  children: ReactNode;
  side?: "top" | "bottom" | "left" | "right";
};

export const ParticipantHoverCard = ({
  participant,
  children,
  side = "top",
}: ParticipantHoverCardProps) => {
  const identifier = getParticipantIdentifier(participant);

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-auto min-w-48 p-3" side={side}>
        <div className="flex items-center gap-3">
          <Avatar className={cn("size-10 text-sm", getAvatarColor(identifier))}>
            <AvatarFallback className="bg-transparent text-white">
              {getInitials(participant.name, participant.email)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-0.5">
            {participant.name && (
              <span className="font-medium text-sm">{participant.name}</span>
            )}
            {participant.email && (
              <span className="text-xs text-muted-foreground">
                {participant.email}
              </span>
            )}
            {!participant.name && !participant.email && (
              <span className="text-sm text-muted-foreground">
                Participant {participant.id}
              </span>
            )}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export type ParticipantListHoverCardProps = {
  participants: Participant[];
  children: ReactNode;
  title?: string;
  side?: "top" | "bottom" | "left" | "right";
};

export const ParticipantListHoverCard = ({
  participants,
  children,
  title = "All participants",
  side = "top",
}: ParticipantListHoverCardProps) => {
  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent className="w-auto min-w-56 p-3" side={side}>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground mb-1">
            {title}
          </span>
          {participants.map((participant) => {
            const identifier = getParticipantIdentifier(participant);
            return (
              <div key={participant.id} className="flex items-center gap-2">
                <Avatar
                  className={cn(
                    "size-6 text-[10px]",
                    getAvatarColor(identifier),
                  )}
                >
                  <AvatarFallback className="bg-transparent text-white">
                    {getInitials(participant.name, participant.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {participant.name || participant.email || "Unknown"}
                  </span>
                  {participant.name && participant.email && (
                    <span className="text-xs text-muted-foreground">
                      {participant.email}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export type ParticipantAvatarProps = {
  participant: Participant;
  className?: string;
  showHoverCard?: boolean;
  side?: "top" | "bottom" | "left" | "right";
};

export const ParticipantAvatar = ({
  participant,
  className,
  showHoverCard = true,
  side = "top",
}: ParticipantAvatarProps) => {
  const identifier = getParticipantIdentifier(participant);

  const avatar = (
    <Avatar
      className={cn(
        "size-6 border-2 border-background text-[10px]",
        showHoverCard && "cursor-pointer",
        getAvatarColor(identifier),
        className,
      )}
    >
      <AvatarFallback className="bg-transparent text-white">
        {getInitials(participant.name, participant.email)}
      </AvatarFallback>
    </Avatar>
  );

  if (!showHoverCard) {
    return avatar;
  }

  return (
    <ParticipantHoverCard participant={participant} side={side}>
      {avatar}
    </ParticipantHoverCard>
  );
};
