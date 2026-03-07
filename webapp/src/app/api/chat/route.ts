import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { persistMessage } from "@/lib/supabase/messages"
import { extractJsonOutput, persistOutput } from "@/lib/supabase/outputs"
import { WORKFLOW_SYSTEM_PROMPTS, GBD_GENERIC_PROMPT } from "@/lib/workflows/system-prompts"
import { buildFileContextBlock } from "@/lib/supabase/project-files-context"

// REQUIRED: Edge runtime is incompatible with Anthropic SDK — use Node.js
export const runtime = "nodejs"
// REQUIRED: Prevent Next.js from caching the streaming response
export const dynamic = "force-dynamic"
// REQUIRED: 5 minutes — matches GBD workflow duration (CHAT-03)
export const maxDuration = 300

// Instantiated once (module-level) — reads ANTHROPIC_API_KEY from env automatically
const anthropic = new Anthropic()

type MessageParam = { role: "user" | "assistant"; content: string }

// ── UI tools ───────────────────────────────────────────────────────────────
const PRESENT_CHOICES_TOOL: Anthropic.Tool = {
  name: "present_choices",
  description:
    "Present 2-4 interactive choice cards to the user. Use when offering distinct creative options, strategic directions, or key decisions. Call this tool at most once per response.",
  input_schema: {
    type: "object" as const,
    properties: {
      question: { type: "string" },
      choices: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            description: { type: "string" },
          },
          required: ["id", "label", "description"],
        },
        minItems: 2,
        maxItems: 4,
      },
    },
    required: ["question", "choices"],
  },
}

const CONFIRM_STEP_TOOL: Anthropic.Tool = {
  name: "confirm_step",
  description:
    "Ask the user to confirm or request changes before advancing. Use at the end of a step that produced content needing validation. Call at most once per response.",
  input_schema: {
    type: "object" as const,
    properties: {
      question: { type: "string" },
      confirm_label: { type: "string", description: "Default: Valider" },
      cancel_label: { type: "string", description: "Default: Modifier" },
    },
    required: ["question"],
  },
}

const RATING_SCALE_TOOL: Anthropic.Tool = {
  name: "rating_scale",
  description:
    "Ask the user to rate something on a numeric scale. Use to gauge satisfaction or alignment. Call at most once per response.",
  input_schema: {
    type: "object" as const,
    properties: {
      question: { type: "string" },
      scale: { type: "number", description: "Max value, default 5" },
      min_label: { type: "string", description: "Default: Insuffisant" },
      max_label: { type: "string", description: "Default: Excellent" },
    },
    required: ["question"],
  },
}

const FILL_FORM_TOOL: Anthropic.Tool = {
  name: "fill_form",
  description:
    "Present pre-filled editable fields for the user to review and correct. Use when proposing a structured draft (e.g. the 5 strategic zones). Call at most once per response.",
  input_schema: {
    type: "object" as const,
    properties: {
      title: { type: "string" },
      fields: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            label: { type: "string" },
            value: { type: "string" },
            multiline: { type: "boolean" },
          },
          required: ["id", "label", "value"],
        },
      },
    },
    required: ["fields"],
  },
}

const REQUEST_UPLOAD_TOOL: Anthropic.Tool = {
  name: "request_upload",
  description:
    "Show an upload widget so the user can provide project files (PDF, DOCX, TXT, MD). Use when you have no source documents for this project and cannot proceed without them. Call at most once per response.",
  input_schema: {
    type: "object" as const,
    properties: {},
    required: [],
  },
}

const ALL_TOOLS = [PRESENT_CHOICES_TOOL, CONFIRM_STEP_TOOL, RATING_SCALE_TOOL, FILL_FORM_TOOL, REQUEST_UPLOAD_TOOL]

/**
 * Builds a custom ReadableStream that runs an agentic loop with present_choices tool support.
 * Intercepts tool_use blocks, emits a custom {"type":"choices",...} NDJSON event,
 * then continues streaming Claude's follow-up response (if any).
 * Calls onComplete once with the full accumulated text for persistence.
 */
function buildChoicesStream(
  systemPrompt: string,
  initialMessages: Anthropic.MessageParam[],
  onComplete: (fullText: string) => void
): ReadableStream {
  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      const enqueue = (obj: unknown) =>
        controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"))

      let allText = ""
      const convMessages = [...initialMessages]

      for (let iter = 0; iter < 5; iter++) {
        const sdkStream = anthropic.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: systemPrompt,
          tools: ALL_TOOLS,
          messages: convMessages,
        })

        let iterText = ""
        let toolIds: string[] = []
        let currentToolId: string | null = null
        let currentToolName: string | null = null
        let toolInputJson = ""
        let insideToolUse = false

        for await (const event of sdkStream) {
          if (event.type === "content_block_start") {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((event.content_block as any).type === "tool_use") {
              insideToolUse = true
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              currentToolId = (event.content_block as any).id
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              currentToolName = (event.content_block as any).name
              toolInputJson = ""
            } else {
              enqueue(event)
            }
          } else if (event.type === "content_block_delta") {
            if (insideToolUse) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((event.delta as any).type === "input_json_delta") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                toolInputJson += (event.delta as any).partial_json ?? ""
              }
            } else {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if ((event.delta as any).type === "text_delta") {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                iterText += (event.delta as any).text ?? ""
              }
              enqueue(event)
            }
          } else if (event.type === "content_block_stop") {
            if (insideToolUse) {
              insideToolUse = false
              try {
                const parsed = JSON.parse(toolInputJson)
                if (currentToolName === "present_choices") {
                  if (
                    parsed.question &&
                    Array.isArray(parsed.choices) &&
                    parsed.choices.length >= 2
                  ) {
                    enqueue({
                      type: "choices",
                      question: parsed.question,
                      choices: parsed.choices.slice(0, 4),
                    })
                  } else {
                    throw new Error("invalid shape")
                  }
                } else if (currentToolName === "confirm_step") {
                  enqueue({
                    type: "confirm",
                    question: parsed.question,
                    confirm_label: parsed.confirm_label ?? "Valider",
                    cancel_label: parsed.cancel_label ?? "Modifier",
                  })
                } else if (currentToolName === "rating_scale") {
                  enqueue({
                    type: "rating",
                    question: parsed.question,
                    scale: parsed.scale ?? 5,
                    min_label: parsed.min_label ?? "Insuffisant",
                    max_label: parsed.max_label ?? "Excellent",
                  })
                } else if (currentToolName === "fill_form") {
                  if (Array.isArray(parsed.fields) && parsed.fields.length > 0) {
                    enqueue({ type: "form", title: parsed.title, fields: parsed.fields })
                  } else {
                    throw new Error("invalid fields")
                  }
                }
              } catch {
                const fallback =
                  "\n\n*(Interaction indisponible — veuillez répondre en texte libre.)*"
                enqueue({
                  type: "content_block_delta",
                  index: 0,
                  delta: { type: "text_delta", text: fallback },
                })
                iterText += fallback
              }
              if (currentToolId) toolIds.push(currentToolId)
              currentToolId = null
              currentToolName = null
            } else {
              enqueue(event)
            }
          } else {
            // message_start, message_delta, message_stop, ping — forward as-is
            enqueue(event)
          }
        }

        allText += iterText

        const finalMsg = await sdkStream.finalMessage()
        if (finalMsg.stop_reason !== "tool_use" || toolIds.length === 0) break

        // Agentic loop: add assistant turn + tool_results, continue streaming
        convMessages.push({ role: "assistant", content: finalMsg.content })
        convMessages.push({
          role: "user",
          content: toolIds.map((id) => ({
            type: "tool_result" as const,
            tool_use_id: id,
            content: "displayed",
          })),
        })
        toolIds = []
      }

      controller.close()
      onComplete(allText)
    },
  })
}

/**
 * Resolves web search tool_use calls before streaming the final response.
 * Makes a non-streaming call with the web_search tool; if Claude decides to search,
 * relays tool results and continues until end_turn (max 5 iterations).
 * Returns the enriched message array ready for final streaming.
 */
async function resolveWebSearch(
  systemPrompt: string,
  messages: Anthropic.MessageParam[]
): Promise<Anthropic.MessageParam[]> {
  const allMessages = [...messages]

  for (let i = 0; i < 5; i++) {
    // Non-streaming call with web_search tool declared
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (anthropic.messages.create as any)(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: systemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: allMessages,
      },
      { headers: { "anthropic-beta": "web-search-2025-03-05" } }
    )

    if (response.stop_reason !== "tool_use") break

    // Add assistant turn (tool_use block)
    allMessages.push({ role: "assistant", content: response.content })

    // Build tool_result for each web_search call — Anthropic populates content server-side
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const toolResults = response.content
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((b: any) => b.type === "tool_use")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((b: any) => ({
        type: "tool_result" as const,
        tool_use_id: b.id,
        content: b.content ?? "",
      }))

    if (toolResults.length === 0) break
    allMessages.push({ role: "user", content: toolResults })
  }

  return allMessages
}

export async function POST(request: Request) {
  // Auth validation — uses getClaims() internally (no network call, Phase 1 pattern)
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  let projectId: string
  let message: string
  let history: MessageParam[]
  let workflowSlug: string | undefined

  try {
    const body = await request.json()
    projectId = body.projectId
    message = body.message
    history = body.history ?? []
    workflowSlug = body.workflowSlug
  } catch {
    return new Response("Invalid JSON body", { status: 400 })
  }

  if (!projectId || !message) {
    return new Response("Missing projectId or message", { status: 400 })
  }

  // Select system prompt: per-workflow if slug is known, otherwise generic GBD prompt
  const basePrompt =
    workflowSlug && WORKFLOW_SYSTEM_PROMPTS[workflowSlug]
      ? WORKFLOW_SYSTEM_PROMPTS[workflowSlug]
      : GBD_GENERIC_PROMPT

  // Inject uploaded project files into context (UPLD-05)
  const fileContext = await buildFileContextBlock(projectId, user.id, supabase).catch(() => null)

  // Universal style rule — concise, no markdown headers in chat
  const styleRule = `--- Règle de style ---
Tu communiques dans un chat professionnel. Règles absolues :
- Messages courts : 1 à 3 phrases maximum par réponse. Va droit au but.
- Jamais de titres markdown (# ## ###) dans tes messages — c'est un chat, pas un document.
- Pas d'émojis sauf si l'utilisateur en utilise.
- Pas d'introduction ni de présentation — commence directement par l'action ou la question.
- Le gras (**texte**) est autorisé pour mettre en valeur un mot ou une notion clé, pas des titres.`

  // Universal citation rule — appended after file context so it's always the last instruction
  const citationRule = `--- Règle de citation ---
Tu dois TOUJOURS citer tes sources quand tu utilises des informations externes :
- Fichier PDF : (${fileContext ? "nom_fichier.pdf, p.N" : "nom_fichier.pdf, p.N"}) — utilise les marqueurs [Page N] présents dans le texte
- Fichier texte/markdown : (nom_fichier.md)
- Source web : indique l'URL complète en bas de ta réponse sous "Sources :"
Ne jamais affirmer un fait provenant d'un fichier ou du web sans sa source.`

  const systemPrompt = [basePrompt, fileContext, styleRule, citationRule].filter(Boolean).join("\n\n")

  // Build initial messages: full history + new user message
  const baseMessages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: message },
  ]

  // Phase 1: resolve web search tool_use (non-streaming, ~1-2s)
  // If Claude decides to search, results are folded into messagesForStream
  const messagesForStream = await resolveWebSearch(systemPrompt, baseMessages).catch(() => baseMessages)

  // Phase 2: stream with present_choices tool support (agentique loop)
  const customStream = buildChoicesStream(
    systemPrompt,
    messagesForStream,
    (fullText) => {
      if (!fullText) return
      persistMessage(projectId, "assistant", fullText, supabase, workflowSlug).catch((err) =>
        console.error("[chat/route] failed to persist assistant message:", err)
      )
      if (workflowSlug) {
        const jsonOutput = extractJsonOutput(fullText)
        if (jsonOutput) {
          persistOutput(projectId, workflowSlug, jsonOutput, supabase).catch((err) =>
            console.error("[chat/route] failed to persist workflow output:", err)
          )
        }
      }
    }
  )

  return new Response(customStream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
