"use client";

import { getDocuments, DOC_TYPE_LABEL, DOC_TYPE_COLOR, type Project } from "@/lib/mock";

export function DocumentsTab({
  project,
  clientColor: _clientColor,
}: {
  project: Project;
  clientColor: string;
}) {
  const docs = getDocuments(project.id);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-semibold text-white">Documents</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{docs.length} livrable{docs.length !== 1 ? "s" : ""} · {project.name}</p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors">
          + Générer un livrable
        </button>
      </div>

      {docs.length === 0 ? (
        <EmptyState projectName={project.name} />
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer group"
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0">
                <DocIcon type={doc.type} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200 truncate">{doc.name}</span>
                  <span className={`text-[10px] font-semibold uppercase tracking-wide shrink-0 ${DOC_TYPE_COLOR[doc.type]}`}>
                    {DOC_TYPE_LABEL[doc.type]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-600">Mis à jour le {doc.updatedAt}</span>
                  <span className="text-zinc-700">·</span>
                  <span className="text-xs text-zinc-600">{doc.size}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <ActionBtn label="Voir" />
                <ActionBtn label="↓" title="Télécharger" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DocIcon({ type }: { type: string }) {
  const icons: Record<string, string> = {
    brief: "📋",
    platform: "🏗",
    campaign: "📣",
    site: "🌐",
    wiki: "📖",
    other: "📄",
  };
  return <span className="text-base">{icons[type] ?? "📄"}</span>;
}

function ActionBtn({ label, title }: { label: string; title?: string }) {
  return (
    <button
      title={title}
      className="px-2.5 py-1 rounded-md text-xs text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
    >
      {label}
    </button>
  );
}

function EmptyState({ projectName }: { projectName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <span className="text-xl">📂</span>
      </div>
      <p className="text-sm font-medium text-zinc-400">Aucun document pour {projectName}</p>
      <p className="text-xs text-zinc-600 mt-1">Génère ton premier livrable pour commencer.</p>
    </div>
  );
}
