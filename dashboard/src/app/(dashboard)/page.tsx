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
  const loaded = useStoreLoaded();
  const navigateTo = useStore((s) => s.navigateTo);

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">Accueil</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-600 text-center max-w-md">
          {loaded
            ? clients.length === 0
              ? "Aucun client. Créez-en un depuis la sidebar."
              : `${clients.length} client${clients.length > 1 ? "s" : ""} actif${clients.length > 1 ? "s" : ""}. Sélectionne un client dans la sidebar.`
            : "Chargement…"}
        </p>
        {loaded && clients.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
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

  // Restaure la vue depuis l'URL au premier chargement (deep links / refresh)
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
