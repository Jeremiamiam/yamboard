"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { addTodoAction, updateTodoAction, toggleTodoAction, deleteTodoAction } from "@/lib/store/actions";
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

function TodoInputWithHighlight({
  newTodo,
  selectedClientId,
  allClients,
  inputRef,
  handleInputChange,
  handleKeyDown,
}: {
  newTodo: string;
  selectedClientId: string | null;
  allClients: Client[];
  inputRef: React.RefObject<HTMLInputElement | null>;
  handleInputChange: (value: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
}) {
  const client = selectedClientId ? allClients.find((c) => c.id === selectedClientId) : null;
  const name = client?.name.trim();
  const patterns = name
    ? [
        new RegExp(`@\\s*${escapeRegex(name)}`, "i"),
        new RegExp(`@${escapeRegex(name)}`, "i"),
        new RegExp(escapeRegex(name), "i"),
      ]
    : [];
  let match: RegExpMatchArray | null = null;
  for (const regex of patterns) {
    match = newTodo.match(regex);
    if (match) break;
  }
  const idx = match ? (match.index ?? newTodo.indexOf(match[0])) : -1;
  const showHighlight = !!match && idx !== -1;
  const before = showHighlight ? newTodo.slice(0, idx) : "";
  const after = showHighlight ? newTodo.slice(idx + match![0].length) : "";
  const matched = match ? match[0] : "";

  return (
    <div className="flex-1 min-w-0 relative">
      {showHighlight && (
        <div
          className="absolute inset-0 flex items-center pointer-events-none overflow-hidden text-xs text-zinc-600 dark:text-zinc-400"
          aria-hidden
        >
          <span className="truncate">
            {before}
            <span className="text-violet-600 dark:text-violet-400 bg-violet-500/10 dark:bg-violet-500/20 px-0.5 rounded">
              {matched}
            </span>
            {after}
          </span>
        </div>
      )}
      <input
        ref={inputRef}
        type="text"
        value={newTodo}
        onChange={(e) => handleInputChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Nouvelle tâche… (tape @ pour un client)"
        className={cn(
          "w-full bg-transparent text-xs outline-none placeholder-zinc-400 dark:placeholder-zinc-600 caret-zinc-700 dark:caret-zinc-300",
          showHighlight ? "text-transparent" : "text-zinc-600 dark:text-zinc-400"
        )}
      />
    </div>
  );
}

export function TodoWidget() {
  const todos = useStore((s) => s.todos);
  const clients = useStore((s) => s.clients);
  const archived = useStore((s) => s.archived);
  const allClients = [...clients, ...archived];
  const [newTodo, setNewTodo] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [showMention, setShowMention] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingClientId, setEditingClientId] = useState<string | null | undefined>(undefined);
  const editInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const pending = todos.filter((t) => !t.done);
  const done = todos.filter((t) => t.done);

  const q = mentionQuery.trim().toLowerCase();
  const mentionCandidates = q
    ? allClients.filter((c) => c.name.toLowerCase().includes(q))
    : allClients;
  const selected = mentionCandidates[Math.min(mentionIndex, mentionCandidates.length - 1)];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowMention(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleInputChange(value: string) {
    setNewTodo(value);
    const atIdx = value.lastIndexOf("@");
    if (atIdx !== -1) {
      const afterAt = value.slice(atIdx + 1);
      if (!afterAt.includes(" ")) {
        setShowMention(true);
        setMentionQuery(afterAt);
        setMentionIndex(0);
        setSelectedClientId(null);
        return;
      }
    }
    setShowMention(false);
  }

  function selectClient(client: Client) {
    const atIdx = newTodo.lastIndexOf("@");
    const before = newTodo.slice(0, atIdx);
    const after = newTodo.slice(atIdx).replace(/@[^\s]*/, client.name.trim());
    setNewTodo(before + after);
    setSelectedClientId(client.id);
    setShowMention(false);
    setMentionQuery("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (showMention && mentionCandidates.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((i) => Math.min(i + 1, mentionCandidates.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && selected) {
        e.preventDefault();
        selectClient(selected);
        return;
      }
      if (e.key === "Escape") {
        setShowMention(false);
        return;
      }
    }
    if (e.key === "Enter" && !showMention) {
      handleAdd();
    }
  }

  function handleAdd() {
    const text = newTodo.trim();
    if (!text) return;
    setNewTodo("");
    addTodoAction(text, selectedClientId);
    setSelectedClientId(null);
  }

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

  return (
    <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      <div className="px-5 pt-4 pb-2 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-0">
          Todos
        </h2>
        {pending.length > 0 && (
          <span className="text-xs font-medium text-violet-500 dark:text-violet-400 tabular-nums">
            {pending.length}
          </span>
        )}
      </div>
      <div className="px-4 pb-3 relative">
        <div className="flex gap-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2">
          <TodoInputWithHighlight
            newTodo={newTodo}
            selectedClientId={selectedClientId}
            allClients={allClients}
            inputRef={inputRef}
            handleInputChange={handleInputChange}
            handleKeyDown={handleKeyDown}
          />
          <button
            onClick={handleAdd}
            disabled={!newTodo.trim()}
            className="text-zinc-400 hover:text-zinc-600 dark:text-zinc-600 dark:hover:text-zinc-300 disabled:opacity-30 cursor-pointer disabled:cursor-default transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        {showMention && (
          <div
            ref={dropdownRef}
            className="absolute left-4 right-4 mt-1 max-h-40 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-10 py-1"
          >
            {mentionCandidates.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-500">Aucun client</p>
            ) : (
              mentionCandidates.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectClient(c)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-xs flex items-center gap-2",
                    i === mentionIndex
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                      : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: c.color || "#6366f1" }}
                  />
                  {c.name}
                </button>
              ))
            )}
          </div>
        )}
      </div>
      {pending.length === 0 && done.length === 0 ? (
        <p className="text-xs text-zinc-400 dark:text-zinc-600 px-5 pb-4">Aucune tâche</p>
      ) : (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {[...pending, ...done].map((t) => (
            <div
              key={t.id}
              className={cn(
                "group flex items-center gap-3 px-5 py-2.5",
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
      )}
    </section>
  );
}
