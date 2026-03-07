"use client"

import { useState, useCallback, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { loadMessages, persistMessage, Message } from "@/lib/supabase/messages"

export type ReconnectStatus = "idle" | "reconnecting" | "failed"

export type ChoiceItem = {
  id: string
  label: string
  description: string
}

export type FormField = {
  id: string
  label: string
  value: string
  multiline?: boolean
}

export type PendingInteraction =
  | { type: "choices"; question: string; choices: ChoiceItem[] }
  | { type: "confirm"; question: string; confirm_label: string; cancel_label: string }
  | { type: "rating"; question: string; scale: number; min_label: string; max_label: string }
  | { type: "form"; title?: string; fields: FormField[] }
  | null

const MAX_RECONNECT_ATTEMPTS = 3
const BACKOFF_DELAYS_MS = [1000, 2000, 4000] // 1s, 2s, 4s

export function useChatStream(projectId: string, workflowSlug?: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [reconnectStatus, setReconnectStatus] = useState<ReconnectStatus>("idle")
  const [pendingInteraction, setPendingInteraction] = useState<PendingInteraction>(null)

  // Supabase browser client — instantiated once via ref to avoid re-creation
  const supabaseRef = useRef(createClient())

  /**
   * Load full conversation history from DB and replace local state.
   * Called on mount and after successful reconnection.
   */
  const reloadHistory = useCallback(async () => {
    const history = await loadMessages(projectId, supabaseRef.current, workflowSlug)
    setMessages(history)
  }, [projectId, workflowSlug])

  /**
   * Perform a single stream attempt: POST to /api/chat, read SSE tokens,
   * accumulate content. Resolves with the full accumulated string on success.
   * Throws on HTTP error or stream read error.
   */
  const attemptStream = useCallback(
    async (
      userMessage: string,
      history: Message[]
    ): Promise<string> => {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, message: userMessage, history, workflowSlug }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      if (!response.body) {
        throw new Error("Response body is null — stream unavailable")
      }

      const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .getReader()

      let accumulated = ""

      while (true) {
        const { value, done } = await reader.read()
        if (done) break

        // Parse frames emitted by buildChoicesStream()
        // Handles both SSE format ("data: {...}") and raw NDJSON ("{...}")
        for (const line of value.split("\n")) {
          const trimmed = line.trim()
          if (!trimmed) continue
          const jsonStr = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed
          try {
            const event = JSON.parse(jsonStr)
            if (
              event.type === "content_block_delta" &&
              event.delta?.type === "text_delta"
            ) {
              accumulated += event.delta.text
              setStreamingContent(accumulated)
            } else if (["choices", "confirm", "rating", "form"].includes(event.type)) {
              setPendingInteraction(event as PendingInteraction)
            }
          } catch {
            // Skip non-JSON lines (ping events, "event:" lines, empty lines)
          }
        }
      }

      return accumulated
    },
    [projectId, workflowSlug, setPendingInteraction]
  )

  /**
   * Send a user message. Persists user message to DB, then streams agent response.
   * On stream failure: retries up to 3 times with exponential backoff (CHAT-05).
   * On all retries exhausted: sets reconnectStatus to 'failed'.
   */
  const sendMessage = useCallback(
    async (userMessage: string) => {
      if (isStreaming) return // prevent concurrent sends

      // Snapshot current history before optimistic update
      const historySnapshot = [...messages]

      // Optimistic: add user message to UI immediately
      const userMsg: Message = { role: "user", content: userMessage }
      setMessages((prev) => [...prev, userMsg])
      setPendingInteraction(null) // clear any pending interaction from previous turn
      setIsStreaming(true)
      setStreamingContent("")
      setReconnectStatus("idle")

      // Persist user message to DB (client-side, before stream starts)
      // This ensures reconnection can reload the full history including this message
      try {
        await persistMessage(projectId, "user", userMessage, supabaseRef.current, workflowSlug)
      } catch (err) {
        console.error("[useChatStream] failed to persist user message:", err)
        // Continue anyway — stream can proceed even if persist fails
      }

      let lastError: Error | null = null

      for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
        // Show reconnecting banner on retry attempts (not first try)
        if (attempt > 0) {
          setReconnectStatus("reconnecting")
          await new Promise((res) => setTimeout(res, BACKOFF_DELAYS_MS[attempt - 1]))
          // Reload history from DB after reconnection (CHAT-05: historique rechargé)
          await reloadHistory()
        }

        try {
          const accumulated = await attemptStream(userMessage, historySnapshot)

          // Stream succeeded — commit assistant message to UI
          // (DB persistence of assistant message is handled server-side in route.ts)
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: accumulated },
          ])
          setStreamingContent("")
          setReconnectStatus("idle")
          setIsStreaming(false)
          return // success — exit
        } catch (err) {
          lastError = err instanceof Error ? err : new Error(String(err))
          console.error(`[useChatStream] stream attempt ${attempt + 1} failed:`, lastError)
        }
      }

      // All attempts exhausted
      console.error("[useChatStream] all reconnect attempts failed:", lastError)
      setReconnectStatus("failed")
      setStreamingContent("")
      setIsStreaming(false)
    },
    [isStreaming, messages, projectId, attemptStream, reloadHistory]
  )

  const submitInteraction = useCallback(
    (label: string) => {
      if (isStreaming) return
      sendMessage(`[Angle choisi] ${label}`)
    },
    [isStreaming, sendMessage]
  )

  return {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    reconnectStatus,
    sendMessage,
    reloadHistory,
    pendingInteraction,
    submitInteraction,
  }
}
