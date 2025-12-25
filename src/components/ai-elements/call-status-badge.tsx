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

export type CallStatus =
  | "queued"
  | "in_progress"
  | "completed"
  | "failed"
  | "cancelled";

const statusConfig: Record<
  CallStatus,
  {
    label: string;
    icon: React.ReactNode;
  }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircleIcon className="size-3" />,
  },
  in_progress: {
    label: "In Progress",
    icon: <LoaderIcon className="size-3 animate-spin" />,
  },
  queued: {
    label: "Queued",
    icon: <ClockIcon className="size-3" />,
  },
  failed: {
    label: "Failed",
    icon: <XCircleIcon className="size-3" />,
  },
  cancelled: {
    label: "Cancelled",
    icon: <BanIcon className="size-3" />,
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
      className={cn("shrink-0 gap-1 text-xs", className)}
      {...props}
    >
      {statusInfo.icon}
      {statusInfo.label}
    </Badge>
  );
};
