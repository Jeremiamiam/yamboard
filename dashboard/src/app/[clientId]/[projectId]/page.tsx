"use client";

import { notFound } from "next/navigation";
import { use, useState } from "react";
import Link from "next/link";
import { GlobalNav } from "@/components/GlobalNav";
import { ClientSidebar } from "@/components/ClientSidebar";
import { ChatTab } from "@/components/tabs/ChatTab";
import { DocumentsTab } from "@/components/tabs/DocumentsTab";
import { BudgetsTab } from "@/components/tabs/BudgetsTab";
import {
  getClient,
  getProject,
  PROJECT_TYPE_ICON,
  PROJECT_TYPE_LABEL,
  PROJECT_STATUS_CONFIG,
} from "@/lib/mock";

type Tab = "chat" | "documents" | "budgets";

const TABS: { id: Tab; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "documents", label: "Documents" },
  { id: "budgets", label: "Budget" },
];

export default function ProjectPage({
  params,
}: {
  params: Promise<{ clientId: string; projectId: string }>;
}) {
  const { clientId, projectId } = use(params);
  const client = getClient(clientId);
  const project = getProject(projectId);

  if (!client || !project || project.clientId !== clientId) notFound();

  const [tab, setTab] = useState<Tab>("chat");

  const statusCfg = PROJECT_STATUS_CONFIG[project.status];

  return (
    <>
      <GlobalNav />
      <ClientSidebar />

      <div
        className="flex flex-col h-screen"
        style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
      >
        {/* ── Header ── */}
        <header className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <Link
                href={`/${clientId}`}
                className="hover:text-zinc-400 transition-colors flex items-center gap-1.5"
              >
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                  style={{
                    background: client.color + "25",
                    color: client.color,
                  }}
                >
                  {client.name[0].toUpperCase()}
                </div>
                <span>{client.name}</span>
              </Link>
              <span className="text-zinc-700">/</span>
              <span className="text-zinc-400 font-medium truncate">
                {project.name}
              </span>
            </div>
          </div>

          {/* Right info */}
          <div className="flex items-center gap-4 shrink-0">
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.class}`}
            >
              {statusCfg.label}
            </span>
            <div className="text-right hidden sm:block">
              <p className="text-[11px] text-zinc-600">Type</p>
              <p className="text-xs text-zinc-400">
                {PROJECT_TYPE_ICON[project.type]} {PROJECT_TYPE_LABEL[project.type]}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-zinc-600">Avancement</p>
              <p className="text-xs text-zinc-400">
                {project.progress}/{project.totalPhases} phases
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors">
              ··· Options
            </button>
          </div>
        </header>

        {/* ── Sub-nav tabs ── */}
        <div className="shrink-0 flex items-center gap-1 px-6 border-b border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                tab === t.id
                  ? "border-white text-white"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tab content ── */}
        <div className="flex-1 overflow-hidden flex">
          {tab === "chat" && (
            <ChatTab project={project} clientColor={client.color} />
          )}
          {tab === "documents" && (
            <DocumentsTab project={project} clientColor={client.color} />
          )}
          {tab === "budgets" && (
            <BudgetsTab project={project} clientColor={client.color} />
          )}
        </div>
      </div>
    </>
  );
}
