import { AppSidebar } from "@/components/app-sidebar";
import { ChatHeader } from "@/components/chat-header";
import { DeleteThreadProvider } from "@/components/delete-thread-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DeleteThreadProvider>
        <AppSidebar />
        <SidebarInset className="flex h-screen flex-col">
          <ChatHeader />
          <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        </SidebarInset>
      </DeleteThreadProvider>
    </SidebarProvider>
  );
}
