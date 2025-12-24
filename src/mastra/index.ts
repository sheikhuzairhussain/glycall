import { Mastra } from "@mastra/core/mastra";
import { PostgresStore } from "@mastra/pg";
import { env } from "@/lib/env";
import { glyphicAgent } from "./agents/glyphic-agent";

export const mastra = new Mastra({
  agents: { glyphicAgent },
  storage: new PostgresStore({
    id: "primary-storage",
    connectionString: env.DATABASE_URL,
  }),
});
