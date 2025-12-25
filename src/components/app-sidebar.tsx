"use client";

import * as React from "react";
import {
  MessageSquare,
  MoreHorizontal,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useDeleteThread } from "@/components/delete-thread-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

// TODO: Replace with actual user ID from auth
const RESOURCE_ID = "glyphic-chat";

type Thread = {
  id: string;
  title?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function groupThreadsByDate(threads: Thread[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000);
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000);

  const groups: {
    today: Thread[];
    yesterday: Thread[];
    previous7Days: Thread[];
    previous30Days: Thread[];
    older: Thread[];
  } = {
    today: [],
    yesterday: [],
    previous7Days: [],
    previous30Days: [],
    older: [],
  };

  for (const thread of threads) {
    const threadDate = new Date(thread.updatedAt);
    if (threadDate >= today) {
      groups.today.push(thread);
    } else if (threadDate >= yesterday) {
      groups.yesterday.push(thread);
    } else if (threadDate >= sevenDaysAgo) {
      groups.previous7Days.push(thread);
    } else if (threadDate >= thirtyDaysAgo) {
      groups.previous30Days.push(thread);
    } else {
      groups.older.push(thread);
    }
  }

  return groups;
}

function ChatHistorySection({
  label,
  threads,
  activeThreadId,
  onDeleteThread,
}: {
  label: string;
  threads: Thread[];
  activeThreadId?: string;
  onDeleteThread: (thread: Thread) => void;
}) {
  if (threads.length === 0) return null;

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {threads.map((thread) => {
            const title = thread.title || "New Chat";
            const isActive = activeThreadId === thread.id;
            return (
              <SidebarMenuItem key={thread.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "group/menu-item flex w-full items-center rounded-md transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive &&
                          "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                      )}
                    >
                      <Link
                        href={`/chat/${thread.id}`}
                        className="flex flex-1 items-center gap-2 overflow-hidden p-2 text-sm"
                      >
                        <MessageSquare className="size-4 shrink-0 opacity-60" />
                        <span className="truncate">{title}</span>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="mr-1 hidden size-7 shrink-0 items-center justify-center rounded-md hover:bg-black/10 group-hover/menu-item:flex group-focus-within/menu-item:flex data-[state=open]:flex"
                          >
                            <MoreHorizontal className="size-4" />
                            <span className="sr-only">More options</span>
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="center">
                          <DropdownMenuItem
                            onClick={() => onDeleteThread(thread)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4 text-2xl" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="start"
                    className="max-w-xs"
                  >
                    {title}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function ChatHistorySkeleton() {
  return (
    <div className="space-y-4 p-2">
      {["group-1", "group-2", "group-3"].map((groupId) => (
        <div key={groupId} className="space-y-2">
          <Skeleton className="h-4 w-16" />
          {["item-1", "item-2", "item-3"].map((itemId) => (
            <Skeleton key={`${groupId}-${itemId}`} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const trpc = useTRPC();
  const { requestDelete } = useDeleteThread();

  // Extract thread ID from pathname if we're on a chat page
  const activeThreadId = pathname?.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : undefined;

  const { data, isLoading } = useQuery(
    trpc.threads.list.queryOptions({
      resourceId: RESOURCE_ID,
      page: 0,
      perPage: 50,
    }),
  );

  const handleDeleteThread = React.useCallback(
    (thread: Thread) => {
      requestDelete({ id: thread.id, title: thread.title });
    },
    [requestDelete],
  );

  const groupedThreads = React.useMemo(() => {
    if (!data?.threads) return null;
    return groupThreadsByDate(data.threads as Thread[]);
  }, [data?.threads]);

  return (
    <Sidebar variant="sidebar" {...props}>
      <SidebarHeader className="h-12 border-b border-sidebar-border">
        <div className="flex h-full items-center justify-between px-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex size-6 items-center justify-center rounded-md bg-gray-500">
              <Sparkles className="size-3.5 text-white" />
            </div>
            <span className="font-semibold tracking-tight">Glycall</span>
          </Link>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8" asChild>
                <Link href="/">
                  <Plus className="size-4" />
                  <span className="sr-only">New chat</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">New chat</TooltipContent>
          </Tooltip>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="h-full">
          {isLoading ? (
            <ChatHistorySkeleton />
          ) : groupedThreads ? (
            <>
              <ChatHistorySection
                label="Today"
                threads={groupedThreads.today}
                activeThreadId={activeThreadId}
                onDeleteThread={handleDeleteThread}
              />
              <ChatHistorySection
                label="Yesterday"
                threads={groupedThreads.yesterday}
                activeThreadId={activeThreadId}
                onDeleteThread={handleDeleteThread}
              />
              <ChatHistorySection
                label="Previous 7 Days"
                threads={groupedThreads.previous7Days}
                activeThreadId={activeThreadId}
                onDeleteThread={handleDeleteThread}
              />
              <ChatHistorySection
                label="Previous 30 Days"
                threads={groupedThreads.previous30Days}
                activeThreadId={activeThreadId}
                onDeleteThread={handleDeleteThread}
              />
              <ChatHistorySection
                label="Older"
                threads={groupedThreads.older}
                activeThreadId={activeThreadId}
                onDeleteThread={handleDeleteThread}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <p className="text-sm text-muted-foreground">
                No conversations yet
              </p>
              <p className="text-xs text-muted-foreground/70">
                Start a new chat to begin
              </p>
            </div>
          )}
        </ScrollArea>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-3 py-2 text-center">
          <p className="text-xs text-muted-foreground/60">
            © 2025{" "}
            <a
              href="https://linkedin.com/in/sheikhuzairhussain"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground transition-colors underline underline-offset-2"
            >
              Sheikh Uzair Hussain
            </a>
          </p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
