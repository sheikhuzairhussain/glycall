"use client";

import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ClockIcon,
  BuildingIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  AlertCircleIcon,
  BanIcon,
} from "lucide-react";
import type { ComponentProps } from "react";

export type CallStatus = "queued" | "in_progress" | "completed" | "failed" | "cancelled";

export type CallCardProps = ComponentProps<"div"> & {
  id: string;
  title: string;
  startTime: string;
  duration?: number | null;
  status: CallStatus;
  companies?: Array<{ name?: string | null; domain: string }>;
  participants?: Array<{ name?: string | null; email?: string | null; id: number }>;
  onClick?: () => void;
};

const statusConfig: Record<
  CallStatus,
  { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircleIcon className="size-3" />,
    variant: "default",
  },
  in_progress: {
    label: "In Progress",
    icon: <LoaderIcon className="size-3 animate-spin" />,
    variant: "secondary",
  },
  queued: {
    label: "Queued",
    icon: <ClockIcon className="size-3" />,
    variant: "outline",
  },
  failed: {
    label: "Failed",
    icon: <XCircleIcon className="size-3" />,
    variant: "destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: <BanIcon className="size-3" />,
    variant: "outline",
  },
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
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays === 1) {
    return `Yesterday at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: "long", hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

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

// Generate consistent color from string
function getAvatarColor(identifier: string): string {
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
  const statusInfo = statusConfig[status];
  const displayParticipants = participants?.slice(0, 4) || [];
  const remainingCount = (participants?.length || 0) - 4;

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-all",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md",
        className,
      )}
      onClick={onClick}
      {...props}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium text-sm leading-tight line-clamp-2">{title}</h3>
        <Badge variant={statusInfo.variant} className="shrink-0 gap-1 text-xs">
          {statusInfo.icon}
          {statusInfo.label}
        </Badge>
      </div>

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

      {/* Participants */}
      {displayParticipants.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {displayParticipants.map((participant) => (
              <Avatar
                key={participant.id}
                className={cn(
                  "size-6 border-2 border-background text-[10px]",
                  getAvatarColor(participant.email || participant.name || String(participant.id)),
                )}
              >
                <AvatarFallback className="bg-transparent text-white">
                  {getInitials(participant.name, participant.email)}
                </AvatarFallback>
              </Avatar>
            ))}
            {remainingCount > 0 && (
              <Avatar className="size-6 border-2 border-background bg-muted text-[10px]">
                <AvatarFallback>+{remainingCount}</AvatarFallback>
              </Avatar>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {participants?.length === 1
              ? displayParticipants[0].name || displayParticipants[0].email || "1 participant"
              : `${participants?.length} participants`}
          </span>
        </div>
      )}

      {/* Companies */}
      {companies && companies.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {companies.map((company) => (
            <Badge key={company.domain} variant="outline" className="gap-1 text-xs font-normal">
              <BuildingIcon className="size-3" />
              {company.name || company.domain}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

