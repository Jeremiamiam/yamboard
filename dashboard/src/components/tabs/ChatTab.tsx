"use client";

import { useState } from "react";
import { MOCK_MESSAGES, getConversations, type Project, type Message } from "@/lib/mock";

export function ChatTab({
  project,
  clientColor,
}: {
  project: Project;
  clientColor: string;
}) {
  const conversations = getConversations(project.id);
  const [messages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState("");
  const [activeConvId, setActiveConvId] = useState(
    conversations[conversations.length - 1]?.id ?? null
  );

  return (
    <div className="flex h-full">
      {/* ── Chat area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} clientColor={clientColor} />
          ))}
        </div>

        {/* Input */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus-within:border-zinc-600 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Message — ${project.name}…`}
              rows={1}
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none resize-none leading-relaxed"
              style={{ minHeight: "24px", maxHeight: "160px" }}
              onInput={(e) => {
                const t = e.currentTarget;
                t.style.height = "auto";
                t.style.height = t.scrollHeight + "px";
              }}
            />
            <button
              disabled={!input.trim()}
              className="shrink-0 w-8 h-8 rounded-lg disabled:bg-zinc-800 disabled:text-zinc-600 flex items-center justify-center transition-colors"
              style={{ background: input.trim() ? clientColor : undefined }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-700 text-center">
            GBD — contexte chargé : {project.name}
          </p>
        </div>
      </div>

      {/* ── Conversation history ── */}
      <aside
        className="shrink-0 border-l border-zinc-800 overflow-y-auto flex flex-col"
        style={{ width: "var(--history-w)" }}
      >
        <div className="p-4 border-b border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            Conversations
          </h3>
        </div>
        <div className="p-2 flex-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-zinc-600 p-3">Aucune conversation.</p>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg mb-0.5 transition-colors ${
                  activeConvId === conv.id
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
                }`}
              >
                <div className="text-xs font-medium leading-snug truncate">{conv.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] text-zinc-600">{conv.date}</span>
                  <span className="text-[11px] text-zinc-700">·</span>
                  <span className="text-[11px] text-zinc-600">{conv.messageCount} msg</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* New conversation */}
        <div className="p-3 border-t border-zinc-800">
          <button className="w-full px-3 py-2 rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-600 hover:border-zinc-700 hover:text-zinc-400 transition-colors">
            + Nouvelle conversation
          </button>
        </div>
      </aside>
    </div>
  );
}

function ChatMessage({
  msg,
  clientColor,
}: {
  msg: Message;
  clientColor: string;
}) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-zinc-400">✦</span>
        </div>
      )}
      <div
        className={`max-w-[68%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-800 text-zinc-200 rounded-br-sm"
            : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-bl-sm"
        }`}
        style={{ whiteSpace: "pre-wrap" }}
      >
        {msg.content}
      </div>
      {isUser && (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
          style={{
            background: clientColor + "30",
            color: clientColor,
            border: `1px solid ${clientColor}40`,
          }}
        >
          Y
        </div>
      )}
    </div>
  );
}
