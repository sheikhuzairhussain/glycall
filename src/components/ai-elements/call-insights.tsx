"use client";

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
  LightbulbIcon,
  CopyIcon,
  CheckIcon,
  AlertCircleIcon,
  TargetIcon,
  CalendarIcon,
  DollarSignIcon,
  UsersIcon,
  FlagIcon,
  TrendingUpIcon,
} from "lucide-react";
import { type ComponentProps, useState } from "react";

export type Insight = {
  name: string;
  value?: string | null;
};

export type CallInsightsProps = ComponentProps<"div"> & {
  callId: string;
  callTitle: string;
  insights: Insight[];
};

// Map insight names to icons
function getInsightIcon(name: string): React.ReactNode {
  const lowerName = name.toLowerCase();

  if (
    lowerName.includes("pain") ||
    lowerName.includes("challenge") ||
    lowerName.includes("problem")
  ) {
    return <AlertCircleIcon className="size-4 text-red-500" />;
  }
  if (
    lowerName.includes("next") ||
    lowerName.includes("action") ||
    lowerName.includes("step")
  ) {
    return <TargetIcon className="size-4 text-blue-500" />;
  }
  if (
    lowerName.includes("timeline") ||
    lowerName.includes("date") ||
    lowerName.includes("deadline")
  ) {
    return <CalendarIcon className="size-4 text-purple-500" />;
  }
  if (
    lowerName.includes("budget") ||
    lowerName.includes("price") ||
    lowerName.includes("cost")
  ) {
    return <DollarSignIcon className="size-4 text-green-500" />;
  }
  if (
    lowerName.includes("decision") ||
    lowerName.includes("stakeholder") ||
    lowerName.includes("contact")
  ) {
    return <UsersIcon className="size-4 text-orange-500" />;
  }
  if (
    lowerName.includes("objection") ||
    lowerName.includes("concern") ||
    lowerName.includes("risk")
  ) {
    return <FlagIcon className="size-4 text-amber-500" />;
  }
  if (
    lowerName.includes("opportunity") ||
    lowerName.includes("interest") ||
    lowerName.includes("positive")
  ) {
    return <TrendingUpIcon className="size-4 text-emerald-500" />;
  }

  return <LightbulbIcon className="size-4 text-muted-foreground" />;
}

function InsightCard({ insight }: { insight: Insight }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (insight.value) {
      await navigator.clipboard.writeText(insight.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="group relative flex flex-col gap-2 rounded-lg border bg-card p-3 transition-colors hover:border-primary/30">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {getInsightIcon(insight.name)}
          <span className="font-medium text-xs text-muted-foreground uppercase tracking-wide">
            {insight.name}
          </span>
        </div>
        {insight.value && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <CheckIcon className="size-3 text-green-500" />
                  ) : (
                    <CopyIcon className="size-3" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{copied ? "Copied!" : "Copy to clipboard"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      {insight.value ? (
        <p className="text-sm leading-relaxed">{insight.value}</p>
      ) : (
        <p className="text-sm text-muted-foreground italic">
          No value extracted
        </p>
      )}
    </div>
  );
}

export const CallInsights = ({
  className,
  callId,
  callTitle,
  insights,
  ...props
}: CallInsightsProps) => {
  // Filter out insights without values for cleaner display
  const validInsights = insights.filter((i) => i.value);
  const emptyInsights = insights.filter((i) => !i.value);

  if (insights.length === 0) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-8 text-center",
          className,
        )}
        {...props}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
          <LightbulbIcon className="size-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-sm">No insights available</p>
          <p className="text-xs text-muted-foreground">
            No insights were extracted from this call
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
          <LightbulbIcon className="size-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">Call Insights</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {validInsights.length} insight{validInsights.length !== 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Insights grid */}
      <div className="grid gap-2 sm:grid-cols-2">
        {validInsights.map((insight, index) => (
          <InsightCard key={`${insight.name}-${index}`} insight={insight} />
        ))}
      </div>

      {/* Show empty insight categories if any */}
      {emptyInsights.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-2">
          <span className="text-xs text-muted-foreground">Not found:</span>
          {emptyInsights.map((insight, index) => (
            <Badge
              key={`empty-${insight.name}-${index}`}
              variant="outline"
              className="text-xs font-normal text-muted-foreground"
            >
              {insight.name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

// Skeleton for loading state
export const CallInsightsSkeleton = ({ count = 4 }: { count?: number }) => {
  const items = Array.from(
    { length: count },
    (_, i) => `skeleton-insight-${i}`,
  );
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {items.map((id) => (
        <div
          key={id}
          className="flex flex-col gap-2 rounded-lg border bg-card p-3 animate-pulse"
        >
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-muted" />
            <div className="h-3 w-20 rounded bg-muted" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-full rounded bg-muted" />
            <div className="h-3 w-3/4 rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
};
