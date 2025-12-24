import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { glyphicAgent } from "./agents/glyphic-agent";

export const mastra = new Mastra({
  agents: { glyphicAgent },
  storage: new LibSQLStore({
    id: "mastra-storage",
    url: ":memory:",
  }),
});
