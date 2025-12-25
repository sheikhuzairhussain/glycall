import { createTRPCRouter } from "../init";
import { threadsRouter } from "./threads";

export const appRouter = createTRPCRouter({
  threads: threadsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
