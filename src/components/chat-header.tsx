"use client";

import { LinkIcon, ShareIcon } from "lucide-react";
import { useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function ChatHeader() {
  const handleCopyUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link to chat copied");
    } catch {
      toast.error("Failed to copy link");
    }
  }, []);

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-3">
        <SidebarTrigger className="-ml-1" />
      </div>
      <div className="flex items-center gap-2 px-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <ShareIcon className="size-4" />
              <span className="sr-only">Share</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleCopyUrl}>
              <LinkIcon className="size-4" />
              Copy link to chat
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
