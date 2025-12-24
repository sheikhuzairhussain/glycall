import { handleChatStream } from "@mastra/ai-sdk";
import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { RequestContext } from "@mastra/core/request-context";
import { createUIMessageStreamResponse } from "ai";
import { NextResponse } from "next/server";
import { mastra } from "@/mastra";

const THREAD_ID = "example-user-id";
const RESOURCE_ID = "glyphic-chat";

export async function POST(req: Request) {
  const params = await req.json();

  const timezone = params.timezone || "UTC";

  const requestContext = new RequestContext();
  requestContext.set("timezone", timezone);

  const stream = await handleChatStream({
    mastra,
    agentId: "glyphic-agent",
    params: {
      ...params,
      memory: {
        ...params.memory,
        thread: THREAD_ID,
        resource: RESOURCE_ID,
      },
      requestContext,
    },
  });

  return createUIMessageStreamResponse({ stream });
}

export async function GET() {
  const memory = await mastra.getAgentById("glyphic-agent").getMemory();
  let response = null;

  try {
    response = await memory?.recall({
      threadId: THREAD_ID,
      resourceId: RESOURCE_ID,
    });
  } catch {
    console.log("No previous messages found.");
  }

  const uiMessages = toAISdkV5Messages(response?.messages || []);

  return NextResponse.json(uiMessages);
}
