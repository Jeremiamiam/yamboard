"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { Message } from "@/lib/types";

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

export function useChat(scope: ChatScope) {
  const scopeKey = useMemo(() => getScopeKey(scope), [
    // eslint-disable-next-line react-hooks/exhaustive-deps
    scope.contextType,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    "clientId" in scope ? scope.clientId : "",
    // eslint-disable-next-line react-hooks/exhaustive-deps
    "projectId" in scope ? scope.projectId : "",
  ]);

  const [messages, setMessages] = useState<Message[]>(() => loadFromSession(scopeKey));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Persist messages to sessionStorage whenever they change (client/project only)
  useEffect(() => {
    if (scopeKey) {
      saveToSession(scopeKey, messages);
    }
  }, [scopeKey, messages]);

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

        if (!res.ok || !res.body) throw new Error(`Erreur API : ${res.status}`);

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
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Une erreur est survenue. Réessaie." }
              : m
          )
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, scope]
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
