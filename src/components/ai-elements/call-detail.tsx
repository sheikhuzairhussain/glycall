"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  CalendarIcon,
  ClockIcon,
  BuildingIcon,
  CheckCircleIcon,
  XCircleIcon,
  LoaderIcon,
  BanIcon,
  ExternalLinkIcon,
  ChevronDownIcon,
  FileTextIcon,
  LightbulbIcon,
  UsersIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Streamdown } from "streamdown";

export type CallStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

export type CallDetailData = {
  id: string;
  title: string;
  start_time: string;
  duration?: number | null;
  status: { code: CallStatus };
  summary?: string | null;
  url_link?: string | null;
  companies?: Array<{ name?: string | null; domain: string }>;
  participants?: Array<{
    name?: string | null;
    email?: string | null;
    id: number;
  }>;
  insights?: Array<{ name: string; value?: string | null }> | null;
};

export type CallDetailProps = ComponentProps<"div"> & {
  call: CallDetailData;
};

const statusConfig: Record<
  CallStatus,
  {
    label: string;
    icon: React.ReactNode;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircleIcon className="size-4" />,
    variant: "default",
  },
  in_progress: {
    label: "In Progress",
    icon: <LoaderIcon className="size-4 animate-spin" />,
    variant: "secondary",
  },
  queued: {
    label: "Queued",
    icon: <ClockIcon className="size-4" />,
    variant: "outline",
  },
  failed: {
    label: "Failed",
    icon: <XCircleIcon className="size-4" />,
    variant: "destructive",
  },
  cancelled: {
    label: "Cancelled",
    icon: <BanIcon className="size-4" />,
    variant: "outline",
  },
};

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  ];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const CallDetail = ({ className, call, ...props }: CallDetailProps) => {
  const statusInfo = statusConfig[call.status.code];
  const validInsights = call.insights?.filter((i) => i.value) || [];

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border bg-card overflow-hidden",
        className,
      )}
      {...props}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-semibold text-lg leading-tight">{call.title}</h2>
          <Badge variant={statusInfo.variant} className="shrink-0 gap-1.5">
            {statusInfo.icon}
            {statusInfo.label}
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <CalendarIcon className="size-4" />
            {formatDate(call.start_time)}
          </span>
          {call.duration != null && (
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-4" />
              {formatDuration(call.duration)}
            </span>
          )}
        </div>

        {/* Companies */}
        {call.companies && call.companies.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {call.companies.map((company) => (
              <Badge
                key={company.domain}
                variant="secondary"
                className="gap-1 text-xs"
              >
                <BuildingIcon className="size-3" />
                {company.name || company.domain}
              </Badge>
            ))}
          </div>
        )}

        {/* Recording link */}
        {call.url_link && (
          <Button variant="outline" size="sm" className="w-fit gap-1.5" asChild>
            <a href={call.url_link} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon className="size-4" />
              View recording
            </a>
          </Button>
        )}
      </div>

      {/* Summary */}
      {call.summary && (
        <div className="px-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left">
              <div className="flex items-center gap-2">
                <FileTextIcon className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">Summary</span>
              </div>
              <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pb-2 text-sm leading-relaxed">
                <Streamdown>{call.summary}</Streamdown>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      <Separator />

      {/* Insights */}
      {validInsights.length > 0 && (
        <div className="px-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left">
              <div className="flex items-center gap-2">
                <LightbulbIcon className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">Key Insights</span>
                <Badge variant="secondary" className="text-xs">
                  {validInsights.length}
                </Badge>
              </div>
              <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid gap-2 pb-2 sm:grid-cols-2">
                {validInsights.map((insight, index) => (
                  <div
                    key={`${insight.name}-${index}`}
                    className="rounded-md border bg-muted/30 p-2.5"
                  >
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {insight.name}
                    </p>
                    <p className="mt-1 text-sm">{insight.value}</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {validInsights.length > 0 &&
        call.participants &&
        call.participants.length > 0 && <Separator />}

      {/* Participants */}
      {call.participants && call.participants.length > 0 && (
        <div className="px-4 pb-4">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-left">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-4 text-muted-foreground" />
                <span className="font-medium text-sm">Participants</span>
                <Badge variant="secondary" className="text-xs">
                  {call.participants.length}
                </Badge>
              </div>
              <ChevronDownIcon className="size-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="flex flex-wrap gap-2 pb-2">
                {call.participants.map((participant) => {
                  const identifier =
                    participant.email ||
                    participant.name ||
                    String(participant.id);
                  return (
                    <div
                      key={participant.id}
                      className="flex items-center gap-2 rounded-full border bg-muted/30 py-1 pl-1 pr-3"
                    >
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
                      <span className="text-xs">
                        {participant.name ||
                          participant.email ||
                          `Participant ${participant.id}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
};

// Skeleton for loading state
export const CallDetailSkeleton = () => (
  <div className="flex flex-col gap-4 rounded-lg border bg-card overflow-hidden animate-pulse">
    <div className="flex flex-col gap-3 bg-muted/30 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="h-6 w-24 rounded-full bg-muted" />
      </div>
      <div className="flex gap-4">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-5 w-24 rounded-full bg-muted" />
      </div>
    </div>
    <div className="space-y-2 px-4">
      <div className="h-4 w-20 rounded bg-muted" />
      <div className="space-y-1.5">
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
      </div>
    </div>
    <Separator />
    <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-md border bg-muted/30 p-2.5">
          <div className="h-3 w-16 rounded bg-muted" />
          <div className="mt-2 h-4 w-full rounded bg-muted" />
        </div>
      ))}
    </div>
  </div>
);
