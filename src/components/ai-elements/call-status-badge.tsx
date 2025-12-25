"use client";

import {
  BanIcon,
  CheckCircleIcon,
  ClockIcon,
  LoaderIcon,
  XCircleIcon,
} from "lucide-react";
import type { ComponentProps } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { CallStatus } from "@/types/call";

export type { CallStatus };

const statusConfig: Record<
  CallStatus,
  {
    label: string;
    icon: React.ReactNode;
    className: string;
  }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircleIcon className="size-3" />,
    className:
      "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400",
  },
  in_progress: {
    label: "In Progress",
    icon: <LoaderIcon className="size-3 animate-spin" />,
    className:
      "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  queued: {
    label: "Queued",
    icon: <ClockIcon className="size-3" />,
    className:
      "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  },
  failed: {
    label: "Failed",
    icon: <XCircleIcon className="size-3" />,
    className: "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400",
  },
  cancelled: {
    label: "Cancelled",
    icon: <BanIcon className="size-3" />,
    className: "border-muted-foreground/30 bg-muted text-muted-foreground",
  },
};

export type CallStatusBadgeProps = Omit<
  ComponentProps<typeof Badge>,
  "variant"
> & {
  status: CallStatus;
};

export const CallStatusBadge = ({
  status,
  className,
  ...props
}: CallStatusBadgeProps) => {
  const statusInfo = statusConfig[status];

  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 gap-1 text-xs", statusInfo.className, className)}
      {...props}
    >
      {statusInfo.icon}
      {statusInfo.label}
    </Badge>
  );
};
