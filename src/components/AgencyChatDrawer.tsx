"use client";

import { useRef, useEffect, useState, useTransition } from "react";
import { useChat } from "@/hooks/useChat";
import type { Client, Message, Project } from "@/lib/types";
import { MarkdownContent } from "@/components/MarkdownContent";
import { ClientAvatar } from "@/components/ClientAvatar";
import { getContrastTextColor, getContrastForTintedBg } from "@/lib/color-utils";
import {
  getConversations,
  createConversation,
  deleteConversation,
} from "@/app/(dashboard)/actions/conversations";
import { createDocFromConversation } from "@/app/(dashboard)/actions/documents";
import { DeleteMenu } from "@/components/DeleteMenu";
import { Button, SectionHeader } from "@/components/ui";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function AgencyChatDrawer({
  open,
  onClose,
  client,
  project,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client | null;
  project?: Project | null;
}) {
  const scope = project
    ? { contextType: "project" as const, clientId: client!.id, projectId: project.id }
    : client
      ? { contextType: "client" as const, clientId: client.id }
      : { contextType: "agency" as const };

  const hasConversations = !!client; // client ou projet = scope avec conversations
  const [showHistory, setShowHistory] = useState(false);
  const [conversations, setConversations] = useState<{ id: string; title: string; date: string; messageCount: number }[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConverting, startConvertTransition] = useTransition();

  const { messages, input, setInput, isLoading, sendMessage, handleKeyDown } = useChat(scope, {
    conversationId: hasConversations ? activeConvId : null,
    useConversations: hasConversations,
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const autoCreatedRef = useRef<string | null>(null);
  const prevScopeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasConversations || !client) return;
    const scopeKey = project ? `${client.id}:${project.id}` : client.id;
    if (prevScopeRef.current !== scopeKey) {
      prevScopeRef.current = scopeKey;
      autoCreatedRef.current = null;
    }
    getConversations({
      clientId: client.id,
      projectId: project?.id,
    }).then((list) => {
      setConversations(list);
      if (list.length === 0 && autoCreatedRef.current !== scopeKey) {
        autoCreatedRef.current = scopeKey;
        createConversation({ clientId: client.id, projectId: project?.id }).then((res) => {
          if (!("error" in res)) {
            setActiveConvId(res.id);
            setConversations([
              {
                id: res.id,
                title: "Nouvelle conversation",
                date: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
                messageCount: 0,
              },
            ]);
          } else {
            autoCreatedRef.current = null;
          }
        });
      }
    });
  }, [hasConversations, client?.id, project?.id]);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Escape key closes drawer
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const accentColor = client?.color;
  const topBarStyle = accentColor
    ? { background: `${accentColor}12`, borderBottomColor: `${accentColor}25` }
    : undefined;
  const closeBtnStyle = accentColor
    ? { background: `${accentColor}20`, color: getContrastForTintedBg(accentColor, "20") }
    : undefined;
  const sendBtnEnabled = input.trim() && !isLoading;
  const sendBtnStyle = accentColor
    ? {
        background: sendBtnEnabled ? accentColor : `${accentColor}40`,
        color: sendBtnEnabled ? getContrastTextColor(accentColor) : getContrastForTintedBg(accentColor, "40"),
      }
    : undefined;

  const contextLabel = project
    ? `${client?.name} · ${project.name}`
    : client
      ? client.name
      : "agence globale";

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[9999]"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={`fixed bottom-[100px] right-6 z-[10000] h-[520px] flex flex-col bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden transition-[width] duration-200 ${
        showHistory ? "w-[580px]" : "w-[380px]"
      } max-w-[calc(100vw-2rem)]`}
      style={{ boxShadow: "0 25px 50px -12px rgb(0 0 0 / 0.25), 0 0 0 1px rgb(0 0 0 / 0.05)" }}
    >
      <div className="flex flex-1 min-h-0">
        {/* Zone principale : messages + input */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header compact — logo client + teinte couleur si contexte client */}
          <div
            className={`shrink-0 flex items-center justify-between px-4 py-3 border-b transition-colors ${!accentColor ? "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950" : ""}`}
            style={topBarStyle}
          >
            <div className="flex items-center gap-2 min-w-0">
              {client ? (
                <ClientAvatar client={client} size="sm" rounded="lg" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-white">✦</span>
                </div>
              )}
              <div className="min-w-0">
                <SectionHeader level="h3" as="h2" className="truncate">
                  Brandon
                </SectionHeader>
                <p className={`text-[11px] truncate ${!accentColor ? "text-zinc-500 dark:text-zinc-600" : ""}`} style={accentColor ? { color: accentColor } : undefined}>
                  Contexte : {contextLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {hasConversations && messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon_sm"
                  className="rounded-full"
                  onClick={() =>
                    startConvertTransition(async () => {
                      if (!client) return;
                      const err = await createDocFromConversation({
                        clientId: client.id,
                        projectId: project?.id,
                        messages: messages.map((m) => ({ role: m.role, content: m.content })),
                        contextLabel: contextLabel,
                      });
                      if (err.error) {
                        toast.error(err.error);
                      } else {
                        useStore.getState().loadData();
                        toast.success("Document créé dans les docs");
                      }
                    })
                  }
                  disabled={isConverting}
                  title="Convertir en doc"
                  aria-label="Convertir en doc"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </Button>
              )}
              {hasConversations && (
                <Button
                  variant={showHistory ? "secondary" : "ghost"}
                  size="icon_sm"
                  className="rounded-full"
                  onClick={() => setShowHistory((v) => !v)}
                  title="Historique des conversations"
                  aria-label="Historique"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon_sm"
                className={`rounded-full ${accentColor ? "hover:opacity-80" : ""}`}
                onClick={onClose}
                style={closeBtnStyle}
                aria-label="Fermer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
          </div>

              {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-zinc-50/50 dark:bg-zinc-900/50 min-h-0">
          {messages.length === 0 && !activeConvId && hasConversations && conversations.length > 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Sélectionne une conversation dans l&apos;historique ou crée-en une nouvelle
              </p>
            </div>
          )}
          {messages.length === 0 && (!hasConversations || activeConvId) && <AgencyEmptyState client={client} project={project} />}
          {messages
            .filter((msg) => {
              const isLastEmptyAssistant =
                isLoading &&
                msg.role === "assistant" &&
                msg.content === "" &&
                msg.id === messages[messages.length - 1]?.id;
              return !isLastEmptyAssistant;
            })
            .map((msg) => (
              <AgencyChatMessage key={msg.id} msg={msg} />
            ))}
          {isLoading &&
            messages[messages.length - 1]?.role === "assistant" &&
            messages[messages.length - 1]?.content === "" && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

      {/* Input compact */}
      <div className="shrink-0 px-3 pt-2 pb-3 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <div
          className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 transition-colors"
          style={accentColor ? { borderColor: `${accentColor}40`, boxShadow: `0 0 0 1px ${accentColor}30` } : undefined}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={hasConversations && !activeConvId ? "Sélectionne ou crée une conversation" : "Écris ton message…"}
            rows={1}
            disabled={isLoading || (hasConversations && !activeConvId)}
            className="flex-1 min-h-0 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none resize-none leading-normal py-0 disabled:opacity-50"
            style={{ minHeight: "20px", maxHeight: "120px" }}
            onInput={(e) => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = t.scrollHeight + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || (hasConversations && !activeConvId)}
            className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
              accentColor
                ? "hover:opacity-90"
                : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-zinc-300 disabled:text-zinc-500 dark:disabled:bg-zinc-700 dark:disabled:text-zinc-600"
            }`}
            style={sendBtnStyle}
          >
            {isLoading ? (
              <span className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
        </div>

        {/* Sidebar Historique — visible quand showHistory */}
        {hasConversations && showHistory && client && (
          <aside className="shrink-0 w-[200px] border-l border-zinc-200 dark:border-zinc-800 flex flex-col bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800">
              <SectionHeader level="sublabel">
                Historique
              </SectionHeader>
            </div>
            <div className="flex-1 overflow-y-auto py-2 min-h-0">
              {conversations.length === 0 ? (
                <p className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-600">Aucune conversation</p>
              ) : (
                [...new Map(conversations.map((c) => [c.id, c])).values()].map((conv) => (
                  <div
                    key={conv.id}
                    className={`group flex items-center gap-1 mx-2 mb-0.5 rounded-lg ${
                      activeConvId === conv.id ? "bg-zinc-200 dark:bg-zinc-800" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                    }`}
                  >
                    <button
                      onClick={() => setActiveConvId(conv.id)}
                      className="flex-1 min-w-0 text-left px-2.5 py-2 cursor-pointer"
                    >
                      <div className="text-xs font-medium truncate text-zinc-800 dark:text-zinc-200">{conv.title}</div>
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-600 mt-0.5">{conv.date} · {conv.messageCount} msg</div>
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <DeleteMenu
                        onDelete={async () => {
                          const err = await deleteConversation(conv.id);
                          if (err.error) {
                            toast.error(err.error);
                          } else {
                            if (activeConvId === conv.id) setActiveConvId(null);
                            const fresh = await getConversations({ clientId: client.id, projectId: project?.id });
                            setConversations(fresh);
                            toast.success("Conversation supprimée");
                          }
                        }}
                        confirmLabel="Supprimer cette conversation ?"
                        disabled={isPending}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
              <Button
                variant="dashed"
                size="xs"
                className="w-full"
                onClick={() =>
                  startTransition(async () => {
                    const res = await createConversation({ clientId: client.id, projectId: project?.id });
                    if ("error" in res) {
                      toast.error(res.error);
                    } else {
                      setActiveConvId(res.id);
                      const fresh = await getConversations({ clientId: client.id, projectId: project?.id });
                      setConversations(fresh);
                      toast.success("Nouvelle conversation créée");
                    }
                  })
                }
                disabled={isPending}
              >
                + Nouvelle conversation
              </Button>
            </div>
          </aside>
        )}
      </div>
    </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function AgencyEmptyState({ client, project }: { client?: Client | null; project?: Project | null }) {
  const contextLabel = project
    ? `${client?.name} · ${project.name} — docs projet`
    : client
      ? `${client.name} — docs de marque + projets`
      : "tous les clients et projets";
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2 text-xs font-bold text-emerald-600 border border-emerald-200 dark:border-emerald-800">
        ✦
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Brandon</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5">
        Contexte : {contextLabel}
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2 justify-start">
      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[9px] font-bold text-emerald-600">✦</span>
      </div>
      <div className="flex items-center gap-1 px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl rounded-bl-sm">
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

function AgencyChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[9px] font-bold text-emerald-600">✦</span>
        </div>
      )}
      <div
        className={`max-w-[88%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${
          isUser
            ? "bg-emerald-600 text-white rounded-br-sm"
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
        <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
          Y
        </div>
      )}
    </div>
  );
}
