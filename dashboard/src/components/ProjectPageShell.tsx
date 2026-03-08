"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { GlobalNav } from "@/components/GlobalNav";
import { ClientSidebar } from "@/components/ClientSidebar";
import { ChatTab } from "@/components/tabs/ChatTab";
import { DocumentsTab } from "@/components/tabs/DocumentsTab";
import { BudgetsTab } from "@/components/tabs/BudgetsTab";
import {
  PROJECT_TYPE_LABEL,
  PROJECT_STATUS_CONFIG,
  type Client,
  type Project,
  type Document,
  type BudgetProduct,
} from "@/lib/mock";
import { useClientChatDrawer } from "@/context/ClientChatDrawer";

type Tab = "produits" | "chat" | "documents";

const TABS: { id: Tab; label: string }[] = [
  { id: "produits", label: "Produits" },
  { id: "chat", label: "Chat" },
  { id: "documents", label: "Documents" },
];

type Props = {
  client: Client
  project: Project | null
  projectDocs: Document[]
  clientDocs: Document[]
  budgetProducts: BudgetProduct[]
  clientId: string
  projectId: string
  clients: Client[]
  prospects: Client[]
  archived: Client[]
}

export function ProjectPageShell({
  client,
  project: propProject,
  projectDocs,
  clientDocs,
  budgetProducts,
  clientId,
  projectId,
  clients,
  prospects,
  archived,
}: Props) {
  const { open: openChat } = useClientChatDrawer();

  // If project is null (invalid UUID in URL) → redirect to client page
  if (!propProject) {
    redirect(`/${clientId}`)
  }

  const project = propProject

  const [tab, setTab] = useState<Tab>("produits");

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash === "produits" || hash === "budgets") setTab("produits");
  }, []);

  const statusCfg = PROJECT_STATUS_CONFIG[project.status];

  return (
    <>
      <GlobalNav />
      <ClientSidebar clients={clients} prospects={prospects} archived={archived} />

      <div
        className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950"
        style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
      >
        {/* ── Header ── */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <Link
              href={`/${clientId}`}
              className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                style={{
                  background: client.color + "25",
                  color: client.color,
                  border: `1px solid ${client.color}35`,
                }}
              >
                {client.name[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-zinc-500 hidden sm:inline">
                {client.name}
              </span>
            </Link>
            <span className="text-zinc-400 dark:text-zinc-700 shrink-0">/</span>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white truncate min-w-0">
              {project.name}
            </h1>
          </div>

          {/* Right info */}
          <div className="flex items-center gap-5 shrink-0">
            <button
              onClick={openChat}
              className="p-2 rounded-lg text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 transition-colors"
              title="Chat client"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
              <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{statusCfg.label}</span>
            </div>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-500 dark:text-zinc-600">Type</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {PROJECT_TYPE_LABEL[project.type]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500 dark:text-zinc-600">Avancement</p>
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {project.progress}/{project.totalPhases} phases
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              ··· Options
            </button>
          </div>
        </header>

        {/* ── Sub-nav tabs ── */}
        <div className="shrink-0 flex items-center gap-1 px-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? "border-zinc-900 text-zinc-900 dark:border-white dark:text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden flex">
          {tab === "produits" && (
            <BudgetsTab
              project={project}
              clientColor={client.color}
              budgetProducts={budgetProducts}
            />
          )}
          {tab === "chat" && (
            <ChatTab
              project={project}
              clientId={clientId}
              clientColor={client.color}
              clientDocs={clientDocs}
              projectDocs={projectDocs}
            />
          )}
          {tab === "documents" && (
            <DocumentsTab
              project={project}
              clientId={clientId}
              clientColor={client.color}
              projectDocs={projectDocs}
              clientDocs={clientDocs}
            />
          )}
        </div>
      </div>
    </>
  );
}
