"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTRPC } from "@/trpc/client";

type Thread = {
  id: string;
  title?: string | null;
};

type DeleteThreadContextValue = {
  requestDelete: (thread: Thread) => void;
};

const DeleteThreadContext =
  React.createContext<DeleteThreadContextValue | null>(null);

export function useDeleteThread() {
  const context = React.useContext(DeleteThreadContext);
  if (!context) {
    throw new Error("useDeleteThread must be used within DeleteThreadProvider");
  }
  return context;
}

export function DeleteThreadProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [threadToDelete, setThreadToDelete] = React.useState<Thread | null>(
    null,
  );

  // Extract thread ID from pathname if we're on a chat page
  const activeThreadId = pathname?.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : undefined;

  const deleteMutation = useMutation(
    trpc.threads.delete.mutationOptions({
      onSuccess: () => {
        // Invalidate the threads list to refetch
        queryClient.invalidateQueries({
          queryKey: trpc.threads.list.queryKey(),
        });

        // If we deleted the currently active thread, navigate to new chat page
        if (threadToDelete && activeThreadId === threadToDelete.id) {
          router.push("/chat");
        }

        toast.error("Chat deleted");

        setDialogOpen(false);
        setThreadToDelete(null);
      },
    }),
  );

  const requestDelete = React.useCallback((thread: Thread) => {
    setThreadToDelete(thread);
    setDialogOpen(true);
  }, []);

  const confirmDelete = React.useCallback(() => {
    if (threadToDelete) {
      deleteMutation.mutate({ threadId: threadToDelete.id });
    }
  }, [threadToDelete, deleteMutation]);

  const contextValue = React.useMemo(
    () => ({ requestDelete }),
    [requestDelete],
  );

  return (
    <DeleteThreadContext.Provider value={contextValue}>
      {children}

      {/* Delete Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Delete chat?</DialogTitle>
            <DialogDescription>
              This will permanently delete &quot;
              {threadToDelete?.title || "New Chat"}&quot; and all its messages.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DeleteThreadContext.Provider>
  );
}
