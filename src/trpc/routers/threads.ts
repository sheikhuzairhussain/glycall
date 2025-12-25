import { v4 as uuid } from "uuid";
import { z } from "zod";
import { RESOURCE_ID } from "@/lib/constants";
import { mastra } from "@/mastra";
import { baseProcedure, createTRPCRouter } from "../init";

export const threadsRouter = createTRPCRouter({
  list: baseProcedure
    .input(
      z
        .object({
          page: z.number().default(0),
          perPage: z.number().default(50),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const storage = mastra.getStorage();

      if (!storage) {
        return {
          threads: [],
          total: 0,
          hasMore: false,
        };
      }

      // Get the memory store from storage
      const memoryStore = await storage.getStore("memory");

      if (!memoryStore) {
        return {
          threads: [],
          total: 0,
          hasMore: false,
        };
      }

      const result = await memoryStore.listThreadsByResourceId({
        resourceId: RESOURCE_ID,
        page: input?.page ?? 0,
        perPage: input?.perPage ?? 50,
        orderBy: { field: "updatedAt", direction: "DESC" },
      });

      return result;
    }),

  getById: baseProcedure
    .input(
      z.object({
        threadId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const storage = mastra.getStorage();

      if (!storage) {
        return null;
      }

      const memoryStore = await storage.getStore("memory");

      if (!memoryStore) {
        return null;
      }

      const thread = await memoryStore.getThreadById({
        threadId: input.threadId,
      });

      return thread;
    }),

  create: baseProcedure
    .input(
      z.object({
        title: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const storage = mastra.getStorage();

      if (!storage) {
        throw new Error("Storage not configured");
      }

      const memoryStore = await storage.getStore("memory");

      if (!memoryStore) {
        throw new Error("Memory store not available");
      }

      const now = new Date();
      const thread = await memoryStore.saveThread({
        thread: {
          id: uuid(),
          resourceId: RESOURCE_ID,
          title: input.title,
          createdAt: now,
          updatedAt: now,
        },
      });

      return thread;
    }),

  delete: baseProcedure
    .input(
      z.object({
        threadId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const storage = mastra.getStorage();

      if (!storage) {
        throw new Error("Storage not configured");
      }

      const memoryStore = await storage.getStore("memory");

      if (!memoryStore) {
        throw new Error("Memory store not available");
      }

      await memoryStore.deleteThread({ threadId: input.threadId });

      return { success: true };
    }),
});
