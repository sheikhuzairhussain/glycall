import { Mastra } from "@mastra/core/mastra";
import { PostgresStore } from "@mastra/pg";
import { env } from "@/lib/env";
import { glycallAgent } from "./agents/glycall-agent";

export const mastra = new Mastra({
  agents: { glycallAgent },
  storage: new PostgresStore({
    id: "primary-storage",
    connectionString: env.DATABASE_URL,
  }),
});
