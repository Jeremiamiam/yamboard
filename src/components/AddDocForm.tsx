"use client";

import { useState, useTransition } from "react";
import { createNote, createSignedUploadUrl, saveDocumentRecord } from "@/app/(dashboard)/actions/documents";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { useStore } from "@/lib/store";
import { InputField, Textarea, Button } from "@/components/ui";
import { getContrastTextColor } from "@/lib/color-utils";

export function AddDocForm({
  clientId,
  projectId,
  clientColor,
  onSuccess,
}: {
  clientId: string;
  projectId?: string;
  clientColor: string;
  onSuccess?: () => void;
}) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function reset() {
    setName("");
    setContent("");
    setFile(null);
    setError(null);
  }

  function handleSubmit() {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    setError(null);

    startTransition(async () => {
      if (file) {
        const urlResult = await createSignedUploadUrl(clientId, file.name);
        if ("error" in urlResult) { setError(urlResult.error); return; }

        const supabase = createBrowserClient();
        const { error: uploadError } = await supabase.storage
          .from("documents")
          .uploadToSignedUrl(urlResult.path, urlResult.token, file, {
            contentType: file.type || "application/octet-stream",
          });
        if (uploadError) { setError(uploadError.message); return; }

        const saveResult = await saveDocumentRecord({
          clientId,
          projectId,
          name: trimmedName,
          storagePath: urlResult.path,
        });
        if (saveResult.error) { setError(saveResult.error); return; }
      } else {
        const result = await createNote({
          clientId,
          projectId,
          name: trimmedName,
          content: content.trim(),
        });
        if (result.error) { setError(result.error); return; }
      }

      reset();
      onSuccess?.();
      useStore.getState().loadData();
    });
  }

  return (
    <div className="space-y-3">
      {/* Nom + bouton */}
      <div className="flex gap-2 items-center flex-wrap">
        <InputField
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleSubmit(); }
          }}
          placeholder="Nom du document…"
          autoFocus
          className="flex-1 min-w-[160px]"
        />
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!name.trim() || isPending}
          style={name.trim() ? { background: clientColor, color: getContrastTextColor(clientColor) } : undefined}
        >
          {isPending ? "Enregistrement…" : "Ajouter"}
        </Button>
      </div>

      {/* Joindre un fichier */}
      <div className="flex items-center gap-2">
        <label className="inline-flex items-center justify-center font-medium transition-colors cursor-pointer shrink-0 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 text-xs px-3 py-1.5 rounded-lg gap-1.5">
          + Joindre un fichier
          <input
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setFile(f);
              if (f && !name.trim()) setName(f.name.replace(/\.[^.]+$/, ""));
            }}
          />
        </label>
        {file && (
          <>
            <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 text-xs shrink-0">✕</button>
          </>
        )}
      </div>

      {/* Textarea note (masquée si fichier joint) */}
      {!file && (
        <div className="relative">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Note / contenu — colle ou écris le texte du document."
            rows={5}
          />
          {content.trim() && (
            <span className="absolute bottom-2.5 right-3 text-[11px] text-zinc-400 dark:text-zinc-600 pointer-events-none">
              {content.trim().split(/\s+/).filter(Boolean).length} mots
            </span>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
