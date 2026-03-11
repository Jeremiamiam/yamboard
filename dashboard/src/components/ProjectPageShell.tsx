"use client";

import { useState, useEffect, useTransition } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClientAvatar } from "@/components/ClientAvatar";
import { ChatTab } from "@/components/tabs/ChatTab";
import { DocumentsTab } from "@/components/tabs/DocumentsTab";
import { BudgetsTab } from "@/components/tabs/BudgetsTab";
import { type Client, type Project, type Document, type BudgetProduct } from "@/lib/types";
import { updateProjectAction } from "@/lib/store/actions";

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
}

export function ProjectPageShell({
  client,
  project: propProject,
  projectDocs,
  clientDocs,
  budgetProducts,
  clientId,
  projectId,
}: Props) {
  const [tab, setTab] = useState<Tab>("produits");
  const [potentiel, setPotentiel] = useState<number | undefined>(propProject?.potentialAmount);
  const [isEditingPotentiel, setIsEditingPotentiel] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (hash === "produits" || hash === "budgets") setTab("produits");
  }, []);

  useEffect(() => {
    if (propProject) setPotentiel(propProject.potentialAmount);
  }, [propProject?.potentialAmount]);

  // If project is null (invalid UUID in URL) → redirect to client page
  if (!propProject) {
    redirect(`/${clientId}`)
  }

  const project = propProject

  function handlePotentielSave() {
    setIsEditingPotentiel(false);
    startTransition(async () => {
      await updateProjectAction(project.id, { potentialAmount: potentiel });
    });
  }

  return (
    <>
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
              <ClientAvatar client={client} size="lg" />
              <span className="text-sm font-medium text-zinc-500 hidden sm:inline">
                {client.name}
              </span>
            </Link>
            <span className="text-zinc-400 dark:text-zinc-700 shrink-0">/</span>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-white truncate min-w-0">
              {project.name}
            </h1>
          </div>

          {/* Potentiel (mission) */}
          <div className="flex items-center gap-5 shrink-0">
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">
                Potentiel
              </label>
              {isEditingPotentiel ? (
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 w-24">
                  <input
                    type="number"
                    value={potentiel ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPotentiel(v === "" ? undefined : parseFloat(v) || undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePotentielSave();
                      if (e.key === "Escape") {
                        setIsEditingPotentiel(false);
                        setPotentiel(project.potentialAmount);
                      }
                    }}
                    autoFocus
                    className="bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none text-right w-full"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-600">€</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingPotentiel(true)}
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {potentiel != null && !isNaN(potentiel)
                    ? `${potentiel.toLocaleString("fr-FR")} €`
                    : "—"}
                </button>
              )}
            </div>
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
