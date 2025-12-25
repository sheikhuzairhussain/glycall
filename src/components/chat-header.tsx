"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";

export function ChatHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background/80 backdrop-blur-sm">
      <div className="flex items-center gap-2 px-3">
        <SidebarTrigger className="-ml-1" />
      </div>
    </header>
  );
}
