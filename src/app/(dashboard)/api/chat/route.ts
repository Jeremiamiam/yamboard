import Anthropic from "@anthropic-ai/sdk";
import type { ContentBlock, ToolUseBlock } from "@anthropic-ai/sdk/resources/messages/messages";
import { buildAgencyContext, buildClientContext, buildProjectContext } from "@/lib/context-builders";
import { createClient as createSupabaseClient } from "@/lib/supabase/server";
import { executeCreateContact, getToolResultMessage } from "@/lib/chat-tools";
import { insertClientActivity } from "@/lib/activity-log";

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

const AGENCY_TOOLS = [
  {
    name: "create_contact",
    description:
      "Ajoute un contact (nom, prénom, email) à un client. Utilise l'ID du client depuis le contexte.",
    input_schema: {
      type: "object" as const,
      properties: {
        clientId: { type: "string", description: "UUID du client" },
        name: { type: "string", description: "Nom complet ou prénom nom du contact" },
        email: { type: "string", description: "Email (optionnel)" },
        role: { type: "string", description: "Rôle/fonction (optionnel)" },
        isPrimary: {
          type: "boolean",
          description: "Contact principal (optionnel, défaut false)",
        },
      },
      required: ["clientId", "name"],
    },
  },
];

function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === "tool_use";
}

function getToolLabel(block: ToolUseBlock, input: Record<string, unknown>): string {
  if (block.name === "create_contact") return `contact « ${String(input.name ?? "?")} »`;
  return block.name;
}

async function* runAgencyChatWithTools(
  anthropic: Anthropic,
  model: string,
  systemPrompt: string,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  supabase: Awaited<ReturnType<typeof createSupabaseClient>>,
  userId: string
): AsyncGenerator<{ type: "status" | "text"; content: string }, void, unknown> {
  let toolCallsCount = 0;
  type ApiMessage =
    | { role: "user"; content: string }
    | { role: "user"; content: Array<{ type: "tool_result"; tool_use_id: string; content: string }> }
    | { role: "assistant"; content: string | Array<{ type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }> };
  const apiMessages: ApiMessage[] = messages.map((m) =>
    m.role === "user"
      ? { role: "user" as const, content: m.content }
      : { role: "assistant" as const, content: m.content }
  );

  let lastMessage: Awaited<ReturnType<typeof anthropic.messages.create>>;

  while (true) {
    lastMessage = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
      tools: AGENCY_TOOLS,
      stream: false,
    });

    if (lastMessage.stop_reason !== "tool_use") {
      const text = lastMessage.content
        .filter((b) => b.type === "text")
        .map((b) => ("text" in b ? b.text : ""))
        .join("");
      yield { type: "text" as const, content: text };
      return;
    }

    const toolUses = lastMessage.content.filter(isToolUseBlock);
    const toolResults: Array<{ type: "tool_result"; tool_use_id: string; content: string }> = [];

    for (const block of toolUses) {
      const input = block.input as Record<string, unknown>;
      const label = getToolLabel(block, input);

      yield { type: "status" as const, content: `→ Création du ${label}…\n` };

      let result: string;
      try {
        if (block.name === "create_contact") {
          const clientId = String(input.clientId ?? "");
          const r = await executeCreateContact(supabase, userId, {
            clientId,
            name: String(input.name ?? ""),
            email: input.email ? String(input.email) : undefined,
            role: input.role ? String(input.role) : undefined,
            isPrimary: input.isPrimary === true,
          });
          result = getToolResultMessage(r);
          if (r.ok && r.type === "create_contact") {
            await insertClientActivity(supabase, {
              clientId,
              actionType: "contact_added",
              source: "chat",
              summary: `Contact ajouté : ${r.name}`,
              metadata: { name: r.name },
              ownerId: userId,
            });
          }
        } else {
          result = `Outil inconnu : ${block.name}`;
        }
      } catch (err) {
        result = `Erreur : ${err instanceof Error ? err.message : "Erreur inconnue"}`;
      }

      toolCallsCount++;
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: result,
      });

      yield { type: "status" as const, content: `✓ ${result}\n\n` };
    }

    const assistantContent = lastMessage.content
      .filter((b) => b.type === "text" || b.type === "tool_use")
      .map((b) => {
        if (b.type === "text") return { type: "text" as const, text: "text" in b ? b.text : "" };
        if (b.type === "tool_use")
          return { type: "tool_use" as const, id: b.id, name: b.name, input: b.input };
        return null;
      })
      .filter(Boolean) as Array<{ type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: unknown }>;

    apiMessages.push({
      role: "assistant",
      content: assistantContent,
    });
    apiMessages.push({
      role: "user",
      content: toolResults,
    });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { messages, contextType, clientId, projectId }: ChatRequest = await req.json();

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

    // Agency: tool use + boucle multi-tours, stream des actions en cours
    if (contextType === "agency") {
      const gen = runAgencyChatWithTools(
        anthropic,
        model,
        systemPrompt,
        messages,
        supabase,
        user.id
      );

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of gen) {
              if (chunk.type === "status" || chunk.type === "text") {
                controller.enqueue(new TextEncoder().encode(chunk.content));
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

    // Client / Project: streaming classique sans outils
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
