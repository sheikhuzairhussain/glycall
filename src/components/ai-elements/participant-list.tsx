"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  UsersIcon,
  MailIcon,
  BuildingIcon,
  CopyIcon,
  CheckIcon,
} from "lucide-react";
import { type ComponentProps, useState } from "react";

export type Participant = {
  name?: string | null;
  email?: string | null;
  id: number;
};

export type Company = {
  name?: string | null;
  domain: string;
};

export type ParticipantListProps = ComponentProps<"div"> & {
  participants: Participant[];
  companies?: Company[];
  context?: string;
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

function getAvatarColor(identifier: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-amber-500",
    "bg-indigo-500",
    "bg-rose-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function ParticipantCard({ participant }: { participant: Participant }) {
  const [copied, setCopied] = useState(false);
  const identifier =
    participant.email || participant.name || String(participant.id);

  const handleCopyEmail = async () => {
    if (participant.email) {
      await navigator.clipboard.writeText(participant.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group flex items-center gap-3 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30">
      <Avatar className={cn("size-10 text-sm", getAvatarColor(identifier))}>
        <AvatarFallback className="bg-transparent text-white">
          {getInitials(participant.name, participant.email)}
        </AvatarFallback>
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium text-sm">
          {participant.name || "Unknown"}
        </span>
        {participant.email && (
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MailIcon className="size-3 shrink-0" />
            {participant.email}
          </span>
        )}
      </div>

      {participant.email && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handleCopyEmail}
              >
                {copied ? (
                  <CheckIcon className="size-4 text-green-500" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{copied ? "Copied!" : "Copy email"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export const ParticipantList = ({
  className,
  participants,
  companies,
  context,
  ...props
}: ParticipantListProps) => {
  if (participants.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center",
          className,
        )}
        {...props}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <UsersIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">No participants</p>
          <p className="text-xs text-muted-foreground">
            No participant information available
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
          <UsersIcon className="size-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{context || "Participants"}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {participants.length} participant
          {participants.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Companies if provided */}
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

      {/* Participants grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {participants.map((participant) => (
          <ParticipantCard key={participant.id} participant={participant} />
        ))}
      </div>
    </div>
  );
};
