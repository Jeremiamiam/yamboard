"use client";

import { useStore } from "@/lib/store";
import { useState, useRef } from "react";
import { toggleTodoAction, updateTodoAction, deleteTodoAction } from "@/lib/store/actions";
import type { Todo, Client } from "@/lib/types";
import { cn } from "@/lib/cn";

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findMentionToHighlight(todo: Todo, allClients: Client[]): { matched: string; idx: number } | null {
  const client = todo.clientId ? allClients.find((c) => c.id === todo.clientId) : null;
  if (!client) return null;

  const name = client.name.trim();
  const patterns = [
    new RegExp(`@\\s*${escapeRegex(name)}`, "i"),
    new RegExp(`@${escapeRegex(name)}`, "i"),
    new RegExp(escapeRegex(name), "i"),
  ];
  for (const regex of patterns) {
    const match = todo.text.match(regex);
    if (match) {
      const idx = match.index ?? todo.text.indexOf(match[0]);
      if (idx !== -1) return { matched: match[0], idx };
    }
  }
  return null;
}

function TodoTextWithHighlight({
  todo,
  allClients,
  done,
  onEdit,
}: {
  todo: Todo;
  allClients: Client[];
  done: boolean;
  onEdit?: () => void;
}) {
  const result = findMentionToHighlight(todo, allClients);
  if (!result) {
    return (
      <span
        onClick={onEdit}
        className={cn(
          "flex-1 text-sm text-zinc-700 dark:text-zinc-300 min-w-0 cursor-text",
          done && "line-through",
          onEdit && "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-0.5 -mx-0.5"
        )}
      >
        {todo.text}
      </span>
    );
  }
  const { matched, idx } = result;
  const before = todo.text.slice(0, idx);
  const after = todo.text.slice(idx + matched.length);
  return (
    <span
      onClick={onEdit}
      className={cn(
        "flex-1 text-sm text-zinc-700 dark:text-zinc-300 min-w-0 cursor-text",
        done && "line-through",
        onEdit && "hover:bg-zinc-100 dark:hover:bg-zinc-800/50 rounded px-0.5 -mx-0.5"
      )}
    >
      {before}
      <span className="text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/20 px-0.5 rounded">
        {matched}
      </span>
      {after}
    </span>
  );
}

type Props = {
  clientId: string;
  clientColor: string;
};

export function ClientTodosSection({ clientId, clientColor: _clientColor }: Props) {
  const todos = useStore((s) => s.todos);
  const clients = useStore((s) => s.clients);
  const archived = useStore((s) => s.archived);
  const allClients = [...clients, ...archived];
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingClientId, setEditingClientId] = useState<string | null | undefined>(undefined);
  const editInputRef = useRef<HTMLInputElement>(null);

  const clientTodos = todos.filter((t) => t.clientId === clientId);
  const pending = clientTodos.filter((t) => !t.done);
  const done = clientTodos.filter((t) => t.done);

  function startEdit(t: Todo) {
    setEditingTodoId(t.id);
    setEditingText(t.text);
    setEditingClientId(t.clientId);
    setTimeout(() => editInputRef.current?.focus(), 0);
  }

  function cancelEdit() {
    setEditingTodoId(null);
    setEditingText("");
    setEditingClientId(undefined);
  }

  function saveEdit() {
    const id = editingTodoId;
    if (!id) return;
    const text = editingText.trim();
    if (!text) {
      deleteTodoAction(id);
      cancelEdit();
      return;
    }
    let clientId: string | null = null;
    const withNames = allClients
      .filter((c) => c.name.trim())
      .sort((a, b) => b.name.length - a.name.length);
    for (const c of withNames) {
      if (new RegExp(escapeRegex(c.name.trim()), "i").test(text)) {
        clientId = c.id;
        break;
      }
    }
    updateTodoAction(id, { text, clientId });
    cancelEdit();
  }

  if (clientTodos.length === 0) return null;

  return (
    <section>
      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-3">
        Tâches ({pending.length})
      </h2>
      <div className="rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[...pending, ...done].map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center gap-3 px-4 py-2.5",
                t.done && "opacity-50"
              )}
            >
              <button
                onClick={() => toggleTodoAction(t.id, !t.done)}
                className={cn(
                  "shrink-0 w-4 h-4 rounded border transition-colors cursor-pointer flex items-center justify-center",
                  t.done
                    ? "bg-violet-500 border-violet-500 dark:bg-violet-600 dark:border-violet-600"
                    : "border-zinc-300 dark:border-zinc-600 hover:border-violet-400"
                )}
              >
                {t.done && (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
              {editingTodoId === t.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={saveEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="flex-1 min-w-0 text-sm text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 rounded px-2 py-1 outline-none focus:ring-1 ring-violet-500"
                />
              ) : (
                <TodoTextWithHighlight
                  todo={t}
                  allClients={allClients}
                  done={t.done}
                  onEdit={() => startEdit(t)}
                />
              )}
              <button
                onClick={() => deleteTodoAction(t.id)}
                disabled={editingTodoId === t.id}
                className={cn(
                  "shrink-0 text-zinc-400 hover:text-red-500 dark:text-zinc-600 dark:hover:text-red-400 transition-all cursor-pointer",
                  editingTodoId === t.id ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
