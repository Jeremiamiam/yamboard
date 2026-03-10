"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useChat } from "@/hooks/useChat";
import { type Project, type Message, type Document } from "@/lib/types";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ConfirmButton } from "@/components/ConfirmButton";
import {
  getConversations,
  createConversation,
  deleteConversation,
} from "@/app/(dashboard)/actions/conversations";

export function ChatTab({
  project,
  clientId,
  clientColor,
  clientDocs,
  projectDocs,
}: {
  project: Project;
  clientId: string;
  clientColor: string;
  clientDocs: Document[];
  projectDocs: Document[];
}) {
  const scope = { contextType: "project" as const, clientId, projectId: project.id };
  const [conversations, setConversations] = useState<{ id: string; title: string; date: string; messageCount: number }[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { messages, input, setInput, isLoading, sendMessage, handleKeyDown } = useChat(scope, {
    conversationId: activeConvId,
    useConversations: true,
  });
  const bottomRef = useRef<HTMLDivElement>(null);

  // Éviter les doublons : un doc épinglé apparaît dans clientDocs ET projectDocs
  const allDocs = (() => {
    const seen = new Set<string>();
    return [...clientDocs, ...projectDocs].filter((d) => {
      if (seen.has(d.id)) return false;
      seen.add(d.id);
      return true;
    });
  })();

  // Charger les conversations
  useEffect(() => {
    getConversations({ clientId, projectId: project.id }).then(setConversations);
  }, [clientId, project.id, activeConvId]); // refresh quand on change de conv (après create/delete)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-1 h-full bg-zinc-50 dark:bg-zinc-950">
      {/* ── Chat area ── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {messages.length === 0 && !activeConvId && (
            <EmptyState projectName={project.name} clientColor={clientColor} noConversation />
          )}
          {messages.length === 0 && activeConvId && (
            <EmptyState projectName={project.name} clientColor={clientColor} />
          )}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} clientColor={clientColor} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="shrink-0 px-6 pb-6 pt-2">
          <div className="flex items-end gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeConvId ? `Message — ${project.name}…` : "Crée ou sélectionne une conversation"}
              rows={1}
              disabled={isLoading || !activeConvId}
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
              disabled={!input.trim() || isLoading || !activeConvId}
              className="shrink-0 w-8 h-8 rounded-lg disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 flex items-center justify-center transition-colors"
              style={{ background: input.trim() && !isLoading ? clientColor : undefined }}
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
            Contexte : {project.name} · docs de marque + docs du projet · Shift+Entrée pour sauter une ligne
          </p>
        </div>
      </div>

      {/* ── Sidebar ── */}
      <aside
        className="shrink-0 border-l border-zinc-200 dark:border-zinc-800 overflow-y-auto flex flex-col bg-white dark:bg-zinc-950"
        style={{ width: "var(--history-w)" }}
      >
        {/* Documents in context */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
            Contexte chargé
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {allDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded border border-dotted border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50"
                title={doc.projectId ? `Projet : ${project.name}` : "Document de marque client"}
              >
                <span className="text-xs">{docIcons[doc.type] ?? "📄"}</span>
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[100px]">
                  {doc.name}
                </span>
                {!doc.projectId && (
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-600 shrink-0">marque</span>
                )}
              </div>
            ))}
            {allDocs.length === 0 && (
              <p className="text-xs text-zinc-500 dark:text-zinc-600">Aucun document.</p>
            )}
          </div>
        </div>

        {/* Conversations history */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex-1 min-h-0 flex flex-col">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2">
            Historique
          </h3>
          <div className="flex-1 overflow-y-auto min-h-0">
            {conversations.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-600 p-3">Aucune conversation.</p>
            ) : (
              [...new Map(conversations.map((c) => [c.id, c])).values()].map((conv) => (
                <div
                  key={conv.id}
                  className={`group flex items-center gap-1 rounded-lg mb-0.5 ${
                    activeConvId === conv.id
                      ? "bg-zinc-200 dark:bg-zinc-800"
                      : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
                  }`}
                >
                  <button
                    onClick={() => setActiveConvId(conv.id)}
                    className={`flex-1 min-w-0 text-left px-3 py-2.5 transition-colors ${
                      activeConvId === conv.id
                        ? "text-zinc-900 dark:text-white"
                        : "text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-xs font-medium leading-snug truncate">{conv.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-600">{conv.date}</span>
                      <span className="text-[11px] text-zinc-400 dark:text-zinc-700">·</span>
                      <span className="text-[11px] text-zinc-500 dark:text-zinc-600">{conv.messageCount} msg</span>
                    </div>
                  </button>
                  <ConfirmButton
                    onConfirm={() => startTransition(async () => {
                      const err = await deleteConversation(conv.id);
                      if (!err.error) {
                        if (activeConvId === conv.id) setActiveConvId(null);
                        const fresh = await getConversations({ clientId, projectId: project.id });
                        setConversations(fresh);
                      }
                    })}
                    confirmLabel="Supprimer ?"
                    className="p-1.5 rounded opacity-0 group-hover:opacity-100 hover:opacity-100 text-zinc-500 hover:text-red-600 dark:hover:text-red-400 shrink-0 transition-opacity"
                    disabled={isPending}
                  >
                    🗑
                  </ConfirmButton>
                </div>
              ))
            )}
          </div>
        </div>

        {/* New conversation — bas de la sidebar */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <button
            onClick={() =>
              startTransition(async () => {
                const res = await createConversation({ clientId, projectId: project.id });
                if (!("error" in res)) {
                  setActiveConvId(res.id);
                  const fresh = await getConversations({ clientId, projectId: project.id });
                  setConversations(fresh);
                }
              })
            }
            disabled={isPending}
            className="w-full px-3 py-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-600 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors disabled:opacity-50"
          >
            + Nouvelle conversation
          </button>
        </div>
      </aside>
    </div>
  );
}

// ─── Constants ────────────────────────────────────────────────

const docIcons: Record<string, string> = {
  brief: "📋",
  platform: "🏗",
  campaign: "📣",
  site: "🌐",
  other: "📄",
};

// ─── Sub-components ───────────────────────────────────────────

function EmptyState({
  projectName,
  clientColor,
  noConversation,
}: {
  projectName: string;
  clientColor: string;
  noConversation?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center mb-3 text-sm font-bold"
        style={{ background: clientColor + "20", color: clientColor, border: `1px solid ${clientColor}30` }}
      >
        ✦
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Brandon — {projectName}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
        {noConversation
          ? "Clique sur « + Nouvelle conversation » en bas de la sidebar pour commencer"
          : "Contexte isolé · docs de marque + ce projet uniquement"}
      </p>
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
        className={`max-w-[68%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
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
