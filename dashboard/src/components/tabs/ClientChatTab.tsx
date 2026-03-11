"use client";

import { useRef, useEffect } from "react";
import { useChat } from "@/hooks/useChat";
import type { Client, Message } from "@/lib/types";
import { MarkdownContent } from "@/components/MarkdownContent";

export function ClientChatTab({ client }: { client: Client }) {
  const scope = { contextType: "client" as const, clientId: client.id };
  const { messages, input, setInput, isLoading, sendMessage, handleKeyDown } = useChat(scope);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-900">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.length === 0 && (
          <EmptyState name={client.name} color={client.color} contextLabel="compte client global" />
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} clientColor={client.color} />
        ))}
        {isLoading && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
          <TypingIndicator />
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 sm:px-6 pb-4 sm:pb-6 pt-2">
        <div className="flex items-end gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message — ${client.name} (global)…`}
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none leading-relaxed disabled:opacity-50"
            style={{ minHeight: "24px", maxHeight: "160px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = t.scrollHeight + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="shrink-0 w-8 h-8 rounded-lg disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 flex items-center justify-center transition-colors"
            style={{ background: input.trim() && !isLoading ? client.color : undefined }}
          >
            {isLoading ? (
              <span className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-700 text-center">
          Contexte : {client.name} — docs de marque + toutes les missions · Shift+Entrée pour sauter une ligne
        </p>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function EmptyState({ name, color, contextLabel }: { name: string; color: string; contextLabel: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-3 text-sm font-bold"
        style={{ background: color + "20", color, border: `1px solid ${color}30` }}
      >
        ✦
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Brandon — {name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
        Contexte chargé : {contextLabel}
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 justify-start">
      <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">✦</span>
      </div>
      <div className="flex items-center gap-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl rounded-bl-sm">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce"
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ msg, clientColor }: { msg: Message; clientColor: string }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">✦</span>
        </div>
      )}
      <div
        className={`max-w-[85%] sm:max-w-[72%] rounded-xl px-3 sm:px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-200 text-zinc-800 rounded-br-sm dark:bg-zinc-800 dark:text-zinc-200"
            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-bl-sm"
        }`}
        style={isUser ? { whiteSpace: "pre-wrap" } : undefined}
      >
        {isUser ? (
          msg.content
        ) : msg.content === "" ? (
          <span className="inline-block w-1 h-4 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5" />
        ) : (
          <MarkdownContent content={msg.content} />
        )}
      </div>
      {isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
          style={{ background: clientColor + "30", color: clientColor, border: `1px solid ${clientColor}40` }}
        >
          Y
        </div>
      )}
    </div>
  );
}
