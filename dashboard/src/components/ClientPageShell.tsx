"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GlobalNav } from "@/components/GlobalNav";
import { ClientSidebar } from "@/components/ClientSidebar";
import { DocumentViewer } from "@/components/DocumentViewer";
import {
  DOC_TYPE_LABEL,
  DOC_TYPE_COLOR,
  type Client,
  type Project,
  type Document,
  type BudgetProduct,
} from "@/lib/types";
import { useClientChatDrawer } from "@/context/ClientChatDrawer";
import { createProject } from "@/app/(dashboard)/actions/projects";
import { updateClient, archiveClient, deleteClient } from "@/app/(dashboard)/actions/clients";
import { AddDocForm } from "@/components/AddDocForm";

type Props = {
  client: Client
  projects: Project[]
  budgetByProject: Record<string, BudgetProduct[]>
  globalDocs: Document[]
  clientId: string
  clients: Client[]
  prospects: Client[]
  archived: Client[]
}

export function ClientPageShell({
  client,
  projects,
  budgetByProject,
  globalDocs,
  clientId,
  clients,
  prospects,
  archived,
}: Props) {
  const router = useRouter();
  const { open: openChat } = useClientChatDrawer();
  const [viewerDoc, setViewerDoc] = useState<Document | null>(null);
  const [showAddMission, setShowAddMission] = useState(false);
  const [newMissionName, setNewMissionName] = useState("");
  const [missionError, setMissionError] = useState<string | null>(null);
  const [isPendingMission, startMissionTransition] = useTransition();

  const [showAddDoc, setShowAddDoc] = useState(false);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(client.name);
  const [isPendingClient, startClientTransition] = useTransition();
  const headerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!headerMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) setHeaderMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [headerMenuOpen]);

  function handleAddMission() {
    const name = newMissionName.trim();
    if (!name) return;

    startMissionTransition(async () => {
      setMissionError(null);
      const result = await createProject({ clientId, name });
      if (result.error) {
        setMissionError(result.error);
      } else {
        setShowAddMission(false);
        setNewMissionName("");
      }
    });
  }

  const statusColor = {
    active: "bg-emerald-500",
    draft: "bg-zinc-600",
    paused: "bg-yellow-500",
  }[client.status];

  function handleSaveEdit() {
    const name = editName.trim();
    if (!name || name === client.name) {
      setIsEditing(false);
      return;
    }
    startClientTransition(async () => {
      const result = await updateClient(clientId, { name });
      if (!result.error) setIsEditing(false);
    });
  }

  function handleArchive() {
    setHeaderMenuOpen(false);
    startClientTransition(async () => {
      await archiveClient(clientId);
      router.push("/");
    });
  }

  function handleDelete() {
    if (!confirm("Supprimer définitivement ce client ?")) return;
    setHeaderMenuOpen(false);
    startClientTransition(async () => {
      await deleteClient(clientId);
      router.push("/");
    });
  }

  return (
    <>
      <GlobalNav />
      <ClientSidebar clients={clients} prospects={prospects} archived={archived} />
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
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveEdit();
                      if (e.key === "Escape") { setIsEditing(false); setEditName(client.name); }
                    }}
                    autoFocus
                    className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm font-semibold"
                  />
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editName.trim() || isPendingClient}
                    className="px-2 py-1 rounded text-xs font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 disabled:opacity-40"
                  >
                    {isPendingClient ? "…" : "OK"}
                  </button>
                  <button
                    onClick={() => { setIsEditing(false); setEditName(client.name); }}
                    className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-zinc-700"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-zinc-900 dark:text-white leading-none">
                    {client.name}
                  </h1>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                </div>
              )}
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
            <div className="relative" ref={headerMenuRef}>
              <button
                onClick={() => setHeaderMenuOpen((v) => !v)}
                className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-colors"
                title="Menu client"
              >
                <span className="text-sm">⋯</span>
              </button>
              {headerMenuOpen && (
                <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg z-50">
                  <button
                    onClick={() => { setHeaderMenuOpen(false); setIsEditing(true); }}
                    className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Éditer
                  </button>
                  {client.category === "archived" ? (
                    <button
                      onClick={handleDelete}
                      disabled={isPendingClient}
                      className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Supprimer définitivement
                    </button>
                  ) : (
                    <button
                      onClick={handleArchive}
                      disabled={isPendingClient}
                      className="w-full px-3 py-2 text-left text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-50"
                    >
                      Archiver
                    </button>
                  )}
                </div>
              )}
            </div>
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
              <div className="mb-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed">
                <AddDocForm
                  clientId={clientId}
                  clientColor={client.color}
                  onSuccess={() => setShowAddDoc(false)}
                />
              </div>
            )}

            {globalDocs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {globalDocs.map((doc) => (
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
                    disabled={!newMissionName.trim() || isPendingMission}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
                    style={{
                      background: newMissionName.trim() ? client.color : undefined,
                    }}
                  >
                    {isPendingMission ? "…" : "Créer"}
                  </button>
                </div>
                {missionError && (
                  <p className="text-[11px] text-red-500 mt-2">{missionError}</p>
                )}
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
                    products={budgetByProject[project.id] ?? []}
                    clientId={clientId}
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
  products,
  clientId,
}: {
  project: Project;
  products: BudgetProduct[];
  clientId: string;
}) {
  return (
    <Link
      href={`/${clientId}/${project.id}#produits`}
      className="group flex flex-col p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
    >
      <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors leading-tight mb-3">
        {project.name}
      </p>
      {products.length > 0 ? (
        <ul className="space-y-1 text-xs text-zinc-600 dark:text-zinc-500">
          {products.map((p) => (
            <li key={p.id} className="truncate">
              {p.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-zinc-600">Aucun produit</p>
      )}
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
