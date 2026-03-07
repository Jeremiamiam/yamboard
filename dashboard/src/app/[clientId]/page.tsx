"use client";

import { notFound } from "next/navigation";
import { use } from "react";
import Link from "next/link";
import { GlobalNav } from "@/components/GlobalNav";
import { ClientSidebar } from "@/components/ClientSidebar";
import {
  getClient,
  getClientProjects,
  getClientStats,
  PROJECT_TYPE_ICON,
  PROJECT_TYPE_LABEL,
  PROJECT_STATUS_CONFIG,
  type Project,
} from "@/lib/mock";

export default function ClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = use(params);
  const client = getClient(clientId);
  if (!client) notFound();

  const projects = getClientProjects(clientId);
  const stats = getClientStats(clientId);

  const statusColor = {
    active: "bg-emerald-500",
    draft: "bg-zinc-600",
    paused: "bg-yellow-500",
  }[client.status];

  return (
    <>
      <GlobalNav />
      <ClientSidebar />

      <div
        className="flex flex-col min-h-screen"
        style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
      >
        {/* ── Client header ── */}
        <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-800">
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
                <h1 className="text-base font-semibold text-white leading-none">
                  {client.name}
                </h1>
                <span className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">{client.industry}</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-zinc-600">Contact</p>
              <p className="text-xs text-zinc-400">{client.contact.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-600">Budget total</p>
              <p className="text-xs text-zinc-400">
                {stats.budget.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-600">Missions</p>
              <p className="text-xs text-zinc-400">
                {stats.activeCount} active{stats.activeCount !== 1 ? "s" : ""} /{" "}
                {stats.projectCount}
              </p>
            </div>
          </div>
        </header>

        {/* ── Projects grid ── */}
        <div className="flex-1 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white">Missions</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {projects.length} projet{projects.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors">
              + Nouvelle mission
            </button>
          </div>

          {projects.length === 0 ? (
            <EmptyProjects />
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
        </div>
      </div>
    </>
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
  const remaining = project.budget - project.spent;

  const barColor =
    project.status === "done"
      ? "#10b981"
      : project.status === "active"
      ? clientColor
      : "#27272a";

  return (
    <Link
      href={`/${clientId}/${project.id}`}
      className="group flex flex-col p-5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900/80 cursor-pointer"
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-lg leading-none">
            {PROJECT_TYPE_ICON[project.type]}
          </span>
          <div>
            <p className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors leading-tight">
              {project.name}
            </p>
            <p className="text-[11px] text-zinc-600 mt-0.5">
              {PROJECT_TYPE_LABEL[project.type]}
            </p>
          </div>
        </div>
        <span
          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${statusCfg.class}`}
        >
          {statusCfg.label}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-500 leading-relaxed mb-4 line-clamp-2">
        {project.description}
      </p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-zinc-600">
            {project.progress}/{project.totalPhases} phases
          </span>
          <span className="text-[11px] font-medium text-zinc-500">{pct}%</span>
        </div>
        <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: barColor }}
          />
        </div>
      </div>

      {/* Budget + last activity */}
      <div className="flex items-end justify-between mt-auto">
        <div>
          <p className="text-[11px] text-zinc-600">Budget</p>
          <p className="text-xs font-medium text-zinc-400">
            {project.spent.toLocaleString("fr-FR")} €
            <span className="text-zinc-600 font-normal">
              {" "}/ {project.budget.toLocaleString("fr-FR")} €
            </span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-zinc-600">Dernière activité</p>
          <p className="text-xs text-zinc-500">{project.lastActivity}</p>
        </div>
      </div>
    </Link>
  );
}

function EmptyProjects() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <span className="text-xl">📁</span>
      </div>
      <p className="text-sm font-medium text-zinc-400">Aucune mission</p>
      <p className="text-xs text-zinc-600 mt-1">
        Crée la première mission pour commencer.
      </p>
    </div>
  );
}
