"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useChatStream } from "@/hooks/use-chat-stream"
import { MessageBubble } from "@/components/message-bubble"
import { ChoiceCards } from "@/components/choice-cards"
import { ConfirmStep } from "@/components/confirm-step"
import { RatingScale } from "@/components/rating-scale"
import { FillForm } from "@/components/fill-form"
import { TypingIndicator } from "@/components/typing-indicator"
import { ReconnectionBanner } from "@/components/reconnection-banner"
import { FileUploader } from "@/components/file-uploader"
import { Message } from "@/lib/supabase/messages"
import { markWorkflowComplete, resetWorkflow } from "@/actions/workflows"
import { WORKFLOW_LABELS } from "@/lib/workflows/system-prompts"

interface ChatInterfaceProps {
  projectId: string
  projectName: string
  workflowSlug?: string
  workflowCompleted?: boolean
}

export function ChatInterface({ projectId, projectName, workflowSlug, workflowCompleted }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    messages,
    setMessages,
    isStreaming,
    streamingContent,
    reconnectStatus,
    sendMessage,
    reloadHistory,
    pendingInteraction,
    submitInteraction,
  } = useChatStream(projectId, workflowSlug)

  // Load conversation history from DB on mount (CHAT-06)
  useEffect(() => {
    reloadHistory()
  }, [reloadHistory])

  // Auto-start workflow on first open — send trigger message if history is empty
  const autoStarted = useRef(false)
  useEffect(() => {
    if (!workflowSlug || workflowCompleted || autoStarted.current) return
    if (isStreaming) return
    // Wait until history is loaded, then check if it's truly empty
    const timer = setTimeout(() => {
      if (messages.length === 0 && !autoStarted.current) {
        autoStarted.current = true
        sendMessage(`Démarrer ${workflowSlug}`)
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [messages, workflowSlug, workflowCompleted, isStreaming, sendMessage])

  // Auto-scroll to bottom on new content (CHAT-01 decision: auto-scroll during generation)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = inputValue.trim()
    if (!trimmed || isStreaming || !!pendingInteraction) return
    setInputValue("")
    await sendMessage(trimmed)
  }

  // Retry: reload history and allow user to re-send
  const handleRetry = async () => {
    await reloadHistory()
  }

  // Build display messages: committed messages + in-progress streaming bubble
  const displayMessages: (Message & { isStreaming?: boolean })[] = [
    ...messages,
    ...(streamingContent
      ? [{ role: "assistant" as const, content: streamingContent, isStreaming: true }]
      : []),
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Reconnection overlay banner */}
      <ReconnectionBanner status={reconnectStatus} onRetry={handleRetry} />

      {/* Chat header */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-6 py-3 flex items-center gap-3">
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-gray-400 hover:text-gray-700 transition-colors shrink-0"
        >
          ← Retour
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{projectName}</p>
          <p className="text-xs text-gray-400 truncate">
            {workflowSlug
              ? workflowCompleted
                ? `${WORKFLOW_LABELS[workflowSlug] ?? workflowSlug} — complété`
                : WORKFLOW_LABELS[workflowSlug] ?? workflowSlug
              : "Conversation GBD"}
          </p>
        </div>
        {workflowSlug && (
          <form action={resetWorkflow.bind(null, projectId, workflowSlug)}>
            <button
              type="submit"
              disabled={isStreaming}
              className="text-xs px-3 py-1.5 text-gray-400 border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              ↺ Recommencer
            </button>
          </form>
        )}
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6">
        <div className="max-w-[700px] mx-auto flex flex-col gap-4">
          {displayMessages.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-12">
              {workflowSlug
                ? `Envoyez un message pour démarrer le workflow ${workflowSlug}.`
                : `Envoyez un message pour démarrer. Essayez `}
              {!workflowSlug && <code className="bg-gray-100 px-1 rounded">/start</code>}
              <div className="mt-8 max-w-sm mx-auto text-left">
                <p className="text-xs text-gray-400 mb-2 text-center">Ou déposez un dossier client</p>
                <FileUploader projectId={projectId} onUploadComplete={reloadHistory} />
              </div>
            </div>
          )}

          {displayMessages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {/* Typing indicator: shows when streaming has started but no tokens yet */}
          {isStreaming && !streamingContent && <TypingIndicator />}

          {/* Interactive components: inline options/forms emitted by the agent */}
          {pendingInteraction && (
            <>
              {pendingInteraction.type === "choices" && (
                <ChoiceCards
                  question={pendingInteraction.question}
                  choices={pendingInteraction.choices}
                  disabled={isStreaming}
                  onSelect={submitInteraction}
                />
              )}
              {pendingInteraction.type === "confirm" && (
                <ConfirmStep
                  question={pendingInteraction.question}
                  confirmLabel={pendingInteraction.confirm_label}
                  cancelLabel={pendingInteraction.cancel_label}
                  disabled={isStreaming}
                  onSelect={submitInteraction}
                />
              )}
              {pendingInteraction.type === "rating" && (
                <RatingScale
                  question={pendingInteraction.question}
                  scale={pendingInteraction.scale}
                  minLabel={pendingInteraction.min_label}
                  maxLabel={pendingInteraction.max_label}
                  disabled={isStreaming}
                  onSelect={submitInteraction}
                />
              )}
              {pendingInteraction.type === "form" && (
                <FillForm
                  title={pendingInteraction.title}
                  fields={pendingInteraction.fields}
                  disabled={isStreaming}
                  onSubmit={submitInteraction}
                />
              )}
            </>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 px-4 py-4">
        {workflowSlug && !workflowCompleted && messages.length > 0 && (
          <div className="max-w-[700px] mx-auto mb-3">
            <form action={markWorkflowComplete.bind(null, projectId, workflowSlug)}>
              <button
                type="submit"
                disabled={isStreaming}
                className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ✓ Marquer comme terminé
              </button>
            </form>
          </div>
        )}
        <form onSubmit={handleSubmit} className="max-w-[700px] mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={
              isStreaming
                ? "Agent en train de répondre..."
                : pendingInteraction
                ? "Interagissez avec l'option ci-dessus..."
                : "Envoyez un message..."
            }
            disabled={isStreaming || !!pendingInteraction}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          />
          <button
            type="submit"
            disabled={isStreaming || !!pendingInteraction || !inputValue.trim()}
            className="px-5 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Envoyer
          </button>
        </form>
      </div>
    </div>
  )
}
