"use client";

import { notFound } from "next/navigation";
import { use, useState } from "react";
import Link from "next/link";
import { GlobalNav } from "@/components/GlobalNav";
import { ClientSidebar } from "@/components/ClientSidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import {
  getClient,
  getClientProjects,
  getClientDocs,
  PROJECT_TYPE_LABEL,
  PROJECT_STATUS_CONFIG,
  DOC_TYPE_LABEL,
  DOC_TYPE_COLOR,
  type Project,
  type Document,
} from "@/lib/mock";
import { useLocalProjects } from "@/context/LocalProjects";
import { useClientChatDrawer } from "@/context/ClientChatDrawer";

export default function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const client = getClient(clientId);
  if (!client) notFound();

  const { addProject, getProjectsForClient } = useLocalProjects();
  const { open: openChat } = useClientChatDrawer();
  const mockProjects = getClientProjects(clientId);
  const localProjects = getProjectsForClient(clientId);
  const projects = [...mockProjects, ...localProjects];
  const globalDocs = getClientDocs(clientId);
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [showAddMission, setShowAddMission] = useState(false);
  const [newMissionName, setNewMissionName] = useState("");

  // Local docs (mock — ajout client-side)
  const [localDocs, setLocalDocs] = useState<Document[]>([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState("");
  const [newDocType, setNewDocType] = useState<"brief" | "platform" | "campaign" | "site" | "other">("brief");
  const [newDocContent, setNewDocContent] = useState("");

  const allClientDocs = [...globalDocs, ...localDocs];

  function handleAddDoc() {
    const name = newDocName.trim();
    if (!name) return;
    const content = newDocContent.trim();
    const wordCount = content ? content.split(/\s+/).filter(Boolean).length : 0;
    const doc: Document = {
      id: `local-doc-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      clientId,
      name,
      type: newDocType,
      updatedAt: new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }),
      size: content ? `~${wordCount} mots` : "—",
      content: content || undefined,
    };
    setLocalDocs((prev) => [...prev, doc]);
    setShowAddDoc(false);
    setNewDocName("");
    setNewDocType("brief");
    setNewDocContent("");
  }

  function handleAddMission() {
    const name = newMissionName.trim();
    if (!name) return;
    const id = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const project: Project = {
      id,
      clientId,
      name,
      type: "other",
      status: "draft",
      description: "Mission créée — à compléter.",
      progress: 0,
      totalPhases: 3,
      lastActivity: "—",
      startDate: "À planifier",
    };
    addProject(project);
    setShowAddMission(false);
    setNewMissionName("");
  }

  const statusColor = {
    active: "bg-emerald-500",
    draft: "bg-zinc-600",
    paused: "bg-yellow-500",
  }[client.status];

  return (
    <>
      <GlobalNav />
      <ClientSidebar />
      <DocumentViewer doc={viewerDoc} onClose={() => setViewerDoc(null)} />

      <div
        className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
        style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
      >
        {/* ── Client header ── */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
              style={{
                background: client.color + "25",
                color: client.color,
                border: `1px solid ${client.color}35`,
              }}
            >
              {client.name[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-zinc-900 dark:text-white leading-none">
                  {client.name}
                </h1>
                <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{client.industry}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={openChat}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-colors"
              title="Chat client"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-500 dark:text-zinc-600">Contact</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{client.contact.name}</p>
            </div>
            {client.since && (
              <div className="text-right">
                <p className="text-xs text-zinc-500 dark:text-zinc-600">Client depuis</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">{client.since}</p>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* ── Docs de marque (niveau client) ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
                Documents de marque
              </h2>
              <button
                onClick={() => setShowAddDoc((v) => !v)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] transition-colors ${
                  showAddDoc
                    ? "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {showAddDoc ? "✕ Annuler" : "+ Ajouter"}
              </button>
            </div>

            {showAddDoc && (
              <div className="mb-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed space-y-3">
                {/* Ligne 1 : nom + type + bouton */}
                <div className="flex gap-2 items-center flex-wrap">
                  <input
                    type="text"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    placeholder="Nom du document…"
                    autoFocus
                    className="flex-1 min-w-[160px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  />
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value as typeof newDocType)}
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                  >
                    <option value="platform">Plateforme de marque</option>
                    <option value="brief">Brief</option>
                    <option value="campaign">Campagne</option>
                    <option value="site">Site</option>
                    <option value="other">Autre</option>
                  </select>
                  <button
                    onClick={handleAddDoc}
                    disabled={!newDocName.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800 shrink-0"
                    style={{ background: newDocName.trim() ? client.color : undefined }}
                  >
                    Ajouter
                  </button>
                </div>

                {/* Ligne 2 : note libre (contexte agent) */}
                <div className="relative">
                  <textarea
                    value={newDocContent}
                    onChange={(e) => setNewDocContent(e.target.value)}
                    placeholder="Note / contenu — colle ou écris le texte du document. Ce contenu sera injecté directement dans le contexte de l'agent."
                    rows={6}
                    className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-y leading-relaxed"
                  />
                  {newDocContent.trim() && (
                    <span className="absolute bottom-2.5 right-3 text-[11px] text-zinc-400 dark:text-zinc-600 pointer-events-none">
                      {newDocContent.trim().split(/\s+/).filter(Boolean).length} mots
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-600">
                  La note est facultative — un doc sans contenu apparaît quand même dans la liste.
                </p>
              </div>
            )}

            {allClientDocs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allClientDocs.map((doc) => (
                  <GlobalDocChip
                    key={doc.id}
                    doc={doc}
                    onClick={() => setViewerDoc(doc)}
                  />
                ))}
              </div>
            ) : (
              !showAddDoc && (
                <p className="text-xs text-zinc-500 dark:text-zinc-600 py-2">
                  Aucun document de marque. Ajoute la plateforme de marque, le brandbook…
                </p>
              )
            )}
          </section>

          {/* ── Missions ── */}
          <section>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mb-3">
              Pour ajouter des produits/prestations à une mission, ouvre-la puis va dans l&apos;onglet <strong className="text-zinc-500">Produits</strong>.
            </p>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
                Missions · {projects.length}
              </h2>
              <button
                onClick={() => setShowAddMission((v) => !v)}
                className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                  showAddMission
                    ? "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                    : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                {showAddMission ? "✕ Annuler" : "+ Nouvelle mission"}
              </button>
            </div>

            {/* Form ajout mission */}
            {showAddMission && (
              <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                  Nouvelle mission
                </p>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[11px] text-zinc-500 dark:text-zinc-600 mb-1">Nom</label>
                    <input
                      type="text"
                      value={newMissionName}
                      onChange={(e) => setNewMissionName(e.target.value)}
                      placeholder="Ex. Identité de marque"
                      className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                      autoFocus
                    />
                  </div>
                    <button
                    onClick={handleAddMission}
                    disabled={!newMissionName.trim()}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
                    style={{
                      background: newMissionName.trim() ? client.color : undefined,
                    }}
                  >
                    Créer
                  </button>
                </div>
              </div>
            )}

            {projects.length === 0 && !showAddMission ? (
              <EmptyProjects onAdd={() => setShowAddMission(true)} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    clientId={clientId}
                    clientColor={client.color}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function GlobalDocChip({
  doc,
  onClick,
}: {
  doc: Document;
  onClick: () => void;
}) {
  const icons: Record<string, string> = {
    brief: "📋",
    platform: "🏗",
    campaign: "📣",
    site: "🌐",
    other: "📄",
  };

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group text-left"
    >
      <span className="text-sm">{icons[doc.type] ?? "📄"}</span>
      <div>
        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
          {doc.name}
        </p>
        <p className={`text-[10px] ${DOC_TYPE_COLOR[doc.type]}`}>
          {DOC_TYPE_LABEL[doc.type]} · {doc.updatedAt}
        </p>
      </div>
    </button>
  );
}

function ProjectCard({
  project,
  clientId,
  clientColor,
}: {
  project: Project;
  clientId: string;
  clientColor: string;
}) {
  const statusCfg = PROJECT_STATUS_CONFIG[project.status];
  const pct =
    project.totalPhases > 0
      ? Math.round((project.progress / project.totalPhases) * 100)
      : 0;

  const barColor =
    project.status === "done"
      ? "#10b981"
      : project.status === "active"
      ? clientColor
      : null;

  return (
    <Link
      href={`/${clientId}/${project.id}#produits`}
      className="group flex flex-col p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors leading-tight">
            {project.name}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-0.5">
            {PROJECT_TYPE_LABEL[project.type]}
          </p>
        </div>
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${statusCfg.dot}`} />
      </div>

      <p className="text-xs text-zinc-600 dark:text-zinc-500 leading-relaxed mb-4 line-clamp-2">
        {project.description}
      </p>

      <div className="mb-4">
            <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all bg-zinc-300 dark:bg-zinc-700"
          style={{ width: `${pct}%`, ...(barColor && { background: barColor }) }}
        />
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-700 mt-1.5">
          {project.progress}/{project.totalPhases} phases
        </p>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-700">{project.startDate}</p>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-600">{project.lastActivity}</p>
      </div>
    </Link>
  );
}

function EmptyProjects({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4">
        <span className="text-xl">📁</span>
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aucune mission</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-4">
        Crée la première mission pour commencer.
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          + Nouvelle mission
        </button>
      )}
    </div>
  );
}
