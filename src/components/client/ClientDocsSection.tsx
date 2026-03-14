"use client";

import { useState } from "react";
import type { Document } from "@/lib/types";
import { AddDocForm } from "@/components/AddDocForm";
import { DeleteMenu } from "@/components/DeleteMenu";
import { SectionHeader } from "@/components/ui/SectionHeader";

type NavDocChipProps = {
  doc: Document;
  onClick: () => void;
  onDelete: () => void;
  isPending: boolean;
};

function NavDocChip({ doc, onClick, onDelete, isPending }: NavDocChipProps) {
  const seed = doc.id.slice(0, 8).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const tiltDeg = ((seed % 9) - 4) * 0.6;

  return (
    <div
      className="group shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all hover:shadow-md relative z-10"
      style={{ transform: `rotate(${tiltDeg}deg)` }}
    >
      {doc.isPinned && (
        <span className="text-amber-500 shrink-0" title="Épinglé au contexte client">
          📌
        </span>
      )}
      <button onClick={onClick} className="flex items-center min-w-0 text-left cursor-pointer flex-1">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300 truncate max-w-[140px] block">
          {doc.name}
        </span>
      </button>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={(e) => e.stopPropagation()}>
        <DeleteMenu onDelete={onDelete} confirmLabel="Supprimer ce document ?" disabled={isPending} />
      </div>
    </div>
  );
}

type Props = {
  clientId: string;
  clientColor: string;
  globalDocs: Document[];
  onDocClick: (doc: Document) => void;
  onDeleteDoc: (docId: string) => void;
  isPendingDoc: boolean;
};

export function ClientDocsSection({
  clientId,
  clientColor,
  globalDocs,
  onDocClick,
  onDeleteDoc,
  isPendingDoc,
}: Props) {
  const [showAddDoc, setShowAddDoc] = useState(false);

  return (
    <section>
      <SectionHeader level="sublabel" className="flex items-center gap-1.5 mb-2">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Documents ({globalDocs.length})
      </SectionHeader>
      <div className="flex items-center gap-2 overflow-visible">
        <div className="flex-1 min-w-0 overflow-x-auto py-3">
          <div className="flex items-center gap-2 flex-nowrap py-1">
            {globalDocs.map((doc) => (
              <NavDocChip
                key={doc.id}
                doc={doc}
                onClick={() => onDocClick(doc)}
                onDelete={() => onDeleteDoc(doc.id)}
                isPending={isPendingDoc}
              />
            ))}
            <button
              onClick={() => setShowAddDoc((v) => !v)}
              className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border transition-colors cursor-pointer ${
                showAddDoc
                  ? "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                  : "border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:hover:text-zinc-400 dark:hover:border-zinc-700"
              }`}
              title="Ajouter un document"
            >
              <span className="text-lg leading-none">+</span>
            </button>
          </div>
        </div>
      </div>
      {showAddDoc && (
        <div className="mt-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed">
          <AddDocForm
            clientId={clientId}
            clientColor={clientColor}
            onSuccess={() => setShowAddDoc(false)}
          />
        </div>
      )}
    </section>
  );
}
