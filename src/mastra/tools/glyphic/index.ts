import { env } from "@/lib/env";
import { client } from "@/lib/glyphic/client.gen";

client.setConfig({
  baseUrl: env.GLYPHIC_BASE_URL,
  headers: {
    "X-API-Key": env.GLYPHIC_API_KEY,
  },
});

export { getCallInfoTool } from "./get-call-info";
export { listCallsTool } from "./list-calls";
