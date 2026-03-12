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

function HomeView() {
  const clients = useStore((s) => s.clients);
  const prospects = useStore((s) => s.prospects);
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const loaded = useStoreLoaded();
  const navigateTo = useStore((s) => s.navigateTo);
  const navigateToCompta = useStore((s) => s.navigateToCompta);

  const allClients = [...clients, ...prospects];
  const lastProject = projects.length > 0 ? projects[projects.length - 1] : null;
  const lastProjectClient = lastProject ? allClients.find((c) => c.id === lastProject.clientId) : null;

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
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto w-full">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-6">Accueil</h1>

        {!loaded ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-600">Chargement…</p>
        ) : (
          <div className="space-y-8">
            {/* Raccourcis */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-600 mb-3">
                Raccourcis
              </h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={navigateToCompta}
                  className="px-4 py-2 rounded-lg text-sm font-medium bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
                >
                  Comptabilité
                </button>
                {clients.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => navigateTo(c.id)}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                    style={{ background: c.color + "20", color: c.color, border: `1px solid ${c.color}40` }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </section>

            {/* Dernier projet créé */}
            {lastProject && lastProjectClient && (
              <section>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-600 mb-3">
                  Dernier projet créé
                </h2>
                <button
                  onClick={() => navigateTo(lastProject.clientId, lastProject.id)}
                  className="w-full text-left p-4 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
                >
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">{lastProject.name}</span>
                  <span className="text-sm text-zinc-500 dark:text-zinc-600 block mt-0.5">
                    {lastProjectClient.name}
                  </span>
                </button>
              </section>
            )}

            {/* À surveiller */}
            {alertProjects.length > 0 && (
              <section>
                <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-600 mb-3">
                  À surveiller
                </h2>
                <div className="space-y-2">
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
                        className="w-full text-left p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 hover:border-amber-300 dark:hover:border-amber-700/50 transition-colors"
                      >
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{p.name}</span>
                        <span className="text-sm text-zinc-500 dark:text-zinc-600 block mt-0.5">
                          {client?.name ?? "—"} · {labels.join(", ")}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            )}

            {clients.length === 0 && projects.length === 0 && (
              <p className="text-sm text-zinc-500 dark:text-zinc-600">
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
