"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useChat } from "@/hooks/useChat";
import { useClientChatDrawer } from "@/context/ClientChatDrawer";
import type { Message } from "@/lib/types";

export function ClientChatDrawer() {
  const pathname = usePathname();
  const { isOpen, close } = useClientChatDrawer();
  const clientId = pathname?.split("/")[1];
  const hasClient = !!clientId && clientId !== "compta";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [close]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={close}
      />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[70vw] min-w-[320px] flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {hasClient ? (
          <ClientChatPanel clientId={clientId} onClose={close} />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-500">Sélectionne un client pour accéder au chat.</p>
          </div>
        )}
      </div>
    </>
  );
}

function ClientChatPanel({ clientId, onClose }: { clientId: string; onClose: () => void }) {
  const scope = { contextType: "client" as const, clientId };
  const { messages, input, setInput, isLoading, sendMessage, handleKeyDown } = useChat(scope);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
      <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Chat client</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
        >
          ✕
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-zinc-50 dark:bg-zinc-900">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center mb-3 text-sm font-bold text-zinc-500">
              ✦
            </div>
            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Brandon — Client</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1">
              Contexte chargé : compte client global
            </p>
          </div>
        )}
        {messages.map((msg) => (
          <DrawerChatMessage key={msg.id} msg={msg} />
        ))}
        {isLoading &&
          messages[messages.length - 1]?.role === "assistant" &&
          messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">✦</span>
              </div>
              <div className="flex items-center gap-1 px-4 py-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl rounded-bl-sm">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-400 dark:bg-zinc-600 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                ))}
              </div>
            </div>
          )}
        <div ref={bottomRef} />
      </div>
      <div className="shrink-0 px-6 pb-6 pt-2 bg-white dark:bg-zinc-950">
        <div className="flex items-end gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message — client global…"
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
            className="shrink-0 w-8 h-8 rounded-lg bg-zinc-800 dark:bg-zinc-200 disabled:bg-zinc-200 disabled:text-zinc-400 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600 flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <span className="w-3 h-3 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4 text-white dark:text-zinc-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            )}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-700 text-center">
          Contexte : docs de marque + toutes les missions · Shift+Entrée pour sauter une ligne
        </p>
      </div>
    </>
  );
}

function DrawerChatMessage({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5">
          <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400">✦</span>
        </div>
      )}
      <div
        className={`max-w-[72%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-zinc-200 text-zinc-800 rounded-br-sm dark:bg-zinc-800 dark:text-zinc-200"
            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-bl-sm"
        }`}
        style={{ whiteSpace: "pre-wrap" }}
      >
        {msg.content}
        {!isUser && msg.content === "" && (
          <span className="inline-block w-1 h-4 bg-zinc-400 dark:bg-zinc-500 animate-pulse ml-0.5" />
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
          Y
        </div>
      )}
    </div>
  );
}
