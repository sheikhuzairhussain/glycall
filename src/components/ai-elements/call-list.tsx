"use client";

import { ChevronRightIcon, PhoneIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { CallCard, type CallStatus } from "./call-card";

export type CallPreview = {
  id: string;
  title: string;
  start_time: string;
  duration?: number | null;
  status: { code: CallStatus };
  companies?: Array<{ name?: string | null; domain: string }>;
  participants?: Array<{
    name?: string | null;
    email?: string | null;
    id: number;
  }>;
};

export type CallListProps = ComponentProps<"div"> & {
  calls: CallPreview[];
  title?: string;
  hasMore?: boolean;
  onCallClick?: (callId: string) => void;
  onLoadMore?: () => void;
};

export const CallList = ({
  className,
  calls,
  title,
  hasMore,
  onCallClick,
  onLoadMore,
  ...props
}: CallListProps) => {
  if (calls.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center",
          className,
        )}
        {...props}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <PhoneIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">No calls found</p>
          <p className="text-xs text-muted-foreground">
            Try adjusting your search criteria
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)} {...props}>
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium text-sm">
            <PhoneIcon className="size-4 text-muted-foreground" />
            {title}
          </h3>
          <span className="text-xs text-muted-foreground">
            {calls.length} call{calls.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Call Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {calls.map((call) => (
          <CallCard
            key={call.id}
            id={call.id}
            title={call.title}
            startTime={call.start_time}
            duration={call.duration}
            status={call.status.code}
            companies={call.companies}
            participants={call.participants}
            onClick={onCallClick ? () => onCallClick(call.id) : undefined}
          />
        ))}
      </div>

      {/* Load More */}
      {hasMore && onLoadMore && (
        <button
          type="button"
          onClick={onLoadMore}
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-dashed py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
        >
          Load more calls
          <ChevronRightIcon className="size-4" />
        </button>
      )}
    </div>
  );
};
