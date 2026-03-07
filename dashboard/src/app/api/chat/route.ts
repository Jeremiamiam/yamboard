import Anthropic from "@anthropic-ai/sdk";
import { buildAgencyContext, buildClientContext, buildProjectContext } from "@/lib/context-builders";

export const runtime = "nodejs";

type ChatRequest = {
  messages: { role: "user" | "assistant"; content: string }[];
  contextType: "agency" | "client" | "project";
  clientId?: string;
  projectId?: string;
};

export async function POST(req: Request) {
  const { messages, contextType, clientId, projectId }: ChatRequest = await req.json();

  // Build the system prompt based on scope
  let systemPrompt: string;
  if (contextType === "agency") {
    systemPrompt = buildAgencyContext();
  } else if (contextType === "client" && clientId) {
    systemPrompt = buildClientContext(clientId);
  } else if (contextType === "project" && clientId && projectId) {
    systemPrompt = buildProjectContext(clientId, projectId);
  } else {
    return new Response("Contexte invalide", { status: 400 });
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Stream the response
  const stream = client.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(new TextEncoder().encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.error(err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
