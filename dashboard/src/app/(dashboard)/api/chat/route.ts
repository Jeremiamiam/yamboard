import Anthropic from "@anthropic-ai/sdk";
import { buildAgencyContext, buildClientContext, buildProjectContext } from "@/lib/context-builders";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ChatRequest = {
  messages: { role: "user" | "assistant"; content: string }[];
  contextType: "agency" | "client" | "project";
  clientId?: string;
  projectId?: string;
};

const MODEL_BY_SCOPE: Record<"agency" | "client" | "project", string> = {
  agency: "claude-haiku-4-5-20251001",
  client: "claude-sonnet-4-5",
  project: "claude-sonnet-4-5",
};

export async function POST(req: Request) {
  try {
    // Auth gate — SEC-3 pattern: getUser() validates JWT server-side
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, contextType, clientId, projectId }: ChatRequest = await req.json();

    // Build the system prompt based on scope
    let systemPrompt: string;
    if (contextType === "agency") {
      systemPrompt = await buildAgencyContext();
    } else if (contextType === "client" && clientId) {
      systemPrompt = await buildClientContext(clientId);
    } else if (contextType === "project" && clientId && projectId) {
      systemPrompt = await buildProjectContext(clientId, projectId);
    } else {
      return new Response("Contexte invalide", { status: 400 });
    }

    // Per-scope model selection
    const model = MODEL_BY_SCOPE[contextType];

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[chat] ANTHROPIC_API_KEY manquante");
      return new Response(
        JSON.stringify({ error: "Configuration API manquante" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Stream the response
    const stream = anthropic.messages.stream({
      model,
      max_tokens: 4096,
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
          // Log token usage after the for-await loop completes
          const finalMsg = await stream.finalMessage();
          console.log(
            `[chat] contextType=${contextType} input_tokens=${finalMsg.usage.input_tokens} output_tokens=${finalMsg.usage.output_tokens}`
          );
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
  } catch (err) {
    console.error("[chat] Erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur serveur";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
