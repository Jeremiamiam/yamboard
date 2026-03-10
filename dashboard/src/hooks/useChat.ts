"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { Message } from "@/lib/types";
import { getMessages, saveMessages } from "@/app/(dashboard)/actions/conversations";

type ChatScope =
  | { contextType: "agency" }
  | { contextType: "client"; clientId: string }
  | { contextType: "project"; clientId: string; projectId: string };

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nowTime() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/**
 * Derive a stable sessionStorage key from the scope.
 * Agency scope returns null — agency chat is intentionally not persisted (resets on drawer close).
 */
function getScopeKey(scope: ChatScope): string | null {
  if (scope.contextType === "agency") return null;
  if (scope.contextType === "client") return `chat:client:${scope.clientId}`;
  if (scope.contextType === "project")
    return `chat:project:${scope.clientId}:${scope.projectId}`;
  return null;
}

function loadFromSession(key: string | null): Message[] {
  if (!key || typeof window === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as Message[];
  } catch {
    return [];
  }
}

function saveToSession(key: string | null, messages: Message[]): void {
  if (!key || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(messages));
  } catch {
    // sessionStorage quota exceeded or unavailable — silently ignore
  }
}

export function useChat(
  scope: ChatScope,
  options?: { conversationId: string | null; useConversations?: boolean }
) {
  const conversationId = options?.conversationId ?? null;
  const useConversations = options?.useConversations ?? false;
  const scopeKey = getScopeKey(scope);

  // Source: DB si conversationId, sinon sessionStorage (agency = vide)
  const [messages, setMessages] = useState<Message[]>(() =>
    conversationId ? [] : (scopeKey && !useConversations ? loadFromSession(scopeKey) : [])
  );
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(!conversationId);
  const abortRef = useRef<AbortController | null>(null);

  // Charger les messages depuis la DB quand conversationId change
  // useConversations + pas de conv = vide (attendre création/sélection)
  useEffect(() => {
    if (!conversationId) {
      setLoaded(true);
      setMessages(useConversations ? [] : (scopeKey ? loadFromSession(scopeKey) : []));
      return;
    }
    setLoaded(false);
    getMessages(conversationId).then((msgs) => {
      setMessages(msgs);
      setLoaded(true);
    });
  }, [conversationId, scopeKey, useConversations]);

  // Persister : DB si conversationId, sinon sessionStorage
  useEffect(() => {
    if (!loaded) return;
    if (conversationId) {
      // Debounce save — on sauvegarde après chaque échange, pas à chaque keystroke
      // On ne sauvegarde pas ici en continu pour éviter trop d'appels
    } else if (scopeKey) {
      saveToSession(scopeKey, messages);
    }
  }, [conversationId, scopeKey, messages, loaded]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      if (!content || isLoading) return;

      // Add user message
      const userMsg: Message = {
        id: makeId(),
        role: "user",
        content,
        timestamp: nowTime(),
      };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setInput("");
      setIsLoading(true);

      // Placeholder assistant message (streams into it)
      const assistantId = makeId();
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: nowTime() },
      ]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: abortRef.current.signal,
          body: JSON.stringify({
            messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            ...scope,
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          let errMsg = `Erreur API : ${res.status}`;
          try {
            const parsed = JSON.parse(errBody);
            if (parsed?.error) errMsg = parsed.error;
          } catch {
            if (errBody) errMsg = errBody.slice(0, 200);
          }
          throw new Error(errMsg);
        }
        if (!res.body) throw new Error("Réponse vide");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullContent += decoder.decode(value, { stream: true });
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: fullContent } : m
            )
          );
        }

        // Persister en DB si conversation liée
        if (conversationId) {
          const finalMessages = [
            ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "assistant" as const, content: fullContent },
          ];
          await saveMessages(conversationId, finalMessages);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        const errorContent =
          err instanceof Error && err.message
            ? err.message
            : "Une erreur est survenue. Réessaie.";
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: errorContent } : m
          )
        );
        if (conversationId) {
          const finalMessages = [
            ...updatedMessages.map((m) => ({ role: m.role, content: m.content })),
            { role: "assistant" as const, content: errorContent },
          ];
          await saveMessages(conversationId, finalMessages);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, scope, conversationId]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return { messages, input, setInput, isLoading, sendMessage, handleKeyDown };
}
