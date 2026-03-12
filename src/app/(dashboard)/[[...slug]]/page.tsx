"use client";

import { useEffect } from "react";
import { useStore } from "@/lib/store";
import { ClientPageShell } from "@/components/ClientPageShell";
import { ProjectPageShell } from "@/components/ProjectPageShell";
import { ComptaView } from "@/components/ComptaView";
import {
  useClient,
  useClientProjects,
  useClientDocs,
  useProjectDocs,
  useBudgetProductsForClient,
  useBudgetProducts,
  useStoreLoaded,
} from "@/hooks/useStoreData";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function LoadingScreen() {
  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <div className="flex-1 flex items-center justify-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-600">Chargement…</p>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600 mb-3">
      {children}
    </h2>
  );
}

function HomeView() {
  const clients = useStore((s) => s.clients);
  const prospects = useStore((s) => s.prospects);
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const loaded = useStoreLoaded();
  const navigateTo = useStore((s) => s.navigateTo);
  const navigateToCompta = useStore((s) => s.navigateToCompta);

  const allClients = [...clients, ...prospects];
  const recentProjects = projects.slice(-5).reverse();

  const alertProjects = projects.filter((p) => {
    const hasNoActivity = !p.lastActivity || p.lastActivity === "—";
    const hasNoProducts = !budgetProducts.some((bp) => bp.projectId === p.id);
    return hasNoActivity || hasNoProducts;
  });

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 mb-8">Tableau de bord</h1>

        {!loaded ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">Chargement…</p>
        ) : (
          <div className="space-y-10">
            {/* Stats */}
            {(clients.length > 0 || projects.length > 0) && (
              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {clients.length}
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {clients.length === 1 ? "Client" : "Clients"}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  <div className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">
                    {projects.length}
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                    {projects.length === 1 ? "Projet" : "Projets"}
                  </div>
                </div>
                <div
                  className={`p-4 rounded-xl border ${
                    alertProjects.length > 0
                      ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                      : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div
                    className={`text-2xl font-semibold tabular-nums ${
                      alertProjects.length > 0
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-zinc-900 dark:text-zinc-100"
                    }`}
                  >
                    {alertProjects.length}
                  </div>
                  <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">À surveiller</div>
                </div>
              </div>
            )}

            {/* Raccourcis */}
            {(clients.length > 0 || prospects.length > 0) && (
              <section>
                <SectionLabel>Raccourcis</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={navigateToCompta}
                    className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                  >
                    Comptabilité
                  </button>
                  {clients.slice(0, 6).map((c) => (
                    <button
                      key={c.id}
                      onClick={() => navigateTo(c.id)}
                      className="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                      style={{ background: c.color + "18", color: c.color, border: `1px solid ${c.color}35` }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Projets récents */}
            {recentProjects.length > 0 && (
              <section>
                <SectionLabel>Projets récents</SectionLabel>
                <div className="space-y-1.5">
                  {recentProjects.map((p) => {
                    const client = allClients.find((c) => c.id === p.clientId);
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigateTo(p.clientId, p.id)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          {client?.color && (
                            <span
                              className="w-2 h-2 rounded-full flex-shrink-0 opacity-80"
                              style={{ background: client.color }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate block">
                              {p.name}
                            </span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 block mt-0.5">
                              {client?.name ?? "—"}
                            </span>
                          </div>
                          <svg
                            className="w-4 h-4 text-zinc-300 dark:text-zinc-700 group-hover:text-zinc-400 dark:group-hover:text-zinc-500 transition-colors flex-shrink-0"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {/* À surveiller */}
            {alertProjects.length > 0 && (
              <section>
                <SectionLabel>À surveiller</SectionLabel>
                <div className="space-y-1.5">
                  {alertProjects.slice(0, 5).map((p) => {
                    const client = allClients.find((c) => c.id === p.clientId);
                    const hasNoActivity = !p.lastActivity || p.lastActivity === "—";
                    const hasNoProducts = !budgetProducts.some((bp) => bp.projectId === p.id);
                    const labels: string[] = [];
                    if (hasNoActivity) labels.push("Sans activité");
                    if (hasNoProducts) labels.push("Sans budget");
                    return (
                      <button
                        key={p.id}
                        onClick={() => navigateTo(p.clientId, p.id)}
                        className="w-full text-left px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 hover:border-amber-300 dark:hover:border-amber-800/70 transition-all group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors truncate block">
                              {p.name}
                            </span>
                            <span className="text-xs text-zinc-400 dark:text-zinc-500 block mt-0.5">
                              {client?.name ?? "—"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 flex-shrink-0">
                            {labels.map((label) => (
                              <span
                                key={label}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {clients.length === 0 && projects.length === 0 && (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">
                Aucun client. Créez-en un depuis la sidebar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ClientView({ clientId }: { clientId: string }) {
  const loaded = useStoreLoaded();
  const client = useClient(clientId);
  const projects = useClientProjects(clientId);
  const globalDocs = useClientDocs(clientId);
  const budgetByProject = useBudgetProductsForClient(clientId);
  const navigateHome = useStore((s) => s.navigateHome);

  useEffect(() => {
    if (!loaded) return;
    if (!clientId || !UUID_RE.test(clientId) || !client) navigateHome();
  }, [loaded, clientId, client, navigateHome]);

  if (!loaded || !client) return <LoadingScreen />;

  return (
    <ClientPageShell
      client={client}
      projects={projects}
      budgetByProject={budgetByProject}
      globalDocs={globalDocs}
      clientId={clientId}
    />
  );
}

function ProjectView({ clientId, projectId }: { clientId: string; projectId: string }) {
  const loaded = useStoreLoaded();
  const client = useClient(clientId);
  const projects = useClientProjects(clientId);
  const project = projects.find((p) => p.id === projectId) ?? null;
  const projectDocs = useProjectDocs(projectId);
  const clientDocs = useClientDocs(clientId);
  const budgetProducts = useBudgetProducts(projectId);
  const navigateTo = useStore((s) => s.navigateTo);
  const navigateHome = useStore((s) => s.navigateHome);

  useEffect(() => {
    if (!loaded) return;
    if (!clientId || !projectId || !UUID_RE.test(clientId) || !UUID_RE.test(projectId)) {
      navigateHome();
      return;
    }
    if (!client || !project || project.clientId !== clientId) navigateTo(clientId);
  }, [loaded, clientId, projectId, client, project, navigateTo, navigateHome]);

  if (!loaded || !client) return <LoadingScreen />;

  return (
    <ProjectPageShell
      client={client}
      project={project}
      projectDocs={projectDocs}
      clientDocs={clientDocs}
      budgetProducts={budgetProducts}
      clientId={clientId}
      projectId={projectId}
    />
  );
}

export default function DashboardSPA() {
  const currentView = useStore((s) => s.currentView);
  const selectedClientId = useStore((s) => s.selectedClientId);
  const selectedProjectId = useStore((s) => s.selectedProjectId);
  const navigateTo = useStore((s) => s.navigateTo);
  const navigateToCompta = useStore((s) => s.navigateToCompta);
  const navigateHome = useStore((s) => s.navigateHome);

  // Restaure la vue depuis l'URL au premier chargement (deep links / refresh / rotation)
  useEffect(() => {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] === "compta") {
      navigateToCompta();
    } else if (parts.length === 2 && UUID_RE.test(parts[0]) && UUID_RE.test(parts[1])) {
      navigateTo(parts[0], parts[1]);
    } else if (parts.length === 1 && UUID_RE.test(parts[0])) {
      navigateTo(parts[0]);
    } else {
      navigateHome();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (currentView === "compta") return <ComptaView />;
  if (currentView === "client" && selectedClientId) return <ClientView clientId={selectedClientId} />;
  if (currentView === "project" && selectedClientId && selectedProjectId)
    return <ProjectView clientId={selectedClientId} projectId={selectedProjectId} />;
  return <HomeView />;
}
