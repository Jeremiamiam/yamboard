"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { ClientPageShell } from "@/components/ClientPageShell";
import { ProjectPageShell } from "@/components/ProjectPageShell";
import { ComptaView } from "@/components/ComptaView";
import { projectHasLockedPotentiel } from "@/lib/budget-utils";
import { fetchRecentActivityForNotifications, type ClientActivityRow } from "@/lib/data/client-queries";
import {
  useClient,
  useClientProjects,
  useClientDocs,
  useProjectDocs,
  useBudgetProductsForClient,
  useBudgetProducts,
  useStoreLoaded,
} from "@/hooks/useStoreData";
import { TodoWidget } from "@/components/TodoWidget";

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

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3600_000);
  const diffDays = Math.floor(diffMs / 86400_000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function fmt(n: number): string {
  return n.toLocaleString("fr-FR");
}

function HomeView() {
  const userName = useStore((s) => s.userName);
  const clients = useStore((s) => s.clients);
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const loaded = useStoreLoaded();
  const navigateTo = useStore((s) => s.navigateTo);

  const [recentLogs, setRecentLogs] = useState<ClientActivityRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRecentActivityForNotifications(12)
      .then((logs) => { if (!cancelled) setRecentLogs(logs); })
      .catch(() => { if (!cancelled) setRecentLogs([]); });
    return () => { cancelled = true; };
  }, []);

  const allClients = clients;

  // ── Compta résumé (aligné sur page Compta : encaissé net = paid - sous-traitance payée) ──
  const budgetByProject: Record<string, { total: number; paid: number; sousTraitancePayee: number; sousTraitanceTotale: number }> = {};
  for (const p of projects) {
    const products = budgetProducts.filter((bp) => bp.projectId === p.id);
    const total = products.reduce((s, bp) => s + (bp.devis?.amount ?? bp.totalAmount), 0);
    const paid = products.reduce((s, bp) => {
      let amt = 0;
      if (bp.acompte?.status === "paid") amt += bp.acompte.amount ?? 0;
      for (const av of bp.avancements ?? []) {
        if (av.status === "paid") amt += av.amount ?? 0;
      }
      if (bp.solde?.status === "paid") amt += bp.solde.amount ?? 0;
      return s + amt;
    }, 0);
    const sousTraitancePayee = products.reduce(
      (s, bp) => s + (bp.subcontracts ?? []).filter((sub) => sub.status === "paid").reduce((a, sub) => a + (sub.amount ?? 0), 0),
      0
    );
    const sousTraitanceTotale = products.reduce(
      (s, bp) => s + (bp.subcontracts ?? []).reduce((a, sub) => a + (sub.amount ?? 0), 0),
      0
    );
    budgetByProject[p.id] = { total, paid, sousTraitancePayee, sousTraitanceTotale };
  }
  const globalTotal = Object.values(budgetByProject).reduce((s, v) => s + v.total, 0);
  const globalPaid = Object.values(budgetByProject).reduce((s, v) => s + v.paid, 0);
  const globalSousTraitancePayee = Object.values(budgetByProject).reduce((s, v) => s + v.sousTraitancePayee, 0);
  const globalSousTraitanceTotale = Object.values(budgetByProject).reduce((s, v) => s + v.sousTraitanceTotale, 0);
  const globalNetPaid = globalPaid - globalSousTraitancePayee;
  const globalNetTotal = globalTotal - globalSousTraitanceTotale;
  const globalRemaining = globalNetTotal - globalNetPaid;
  const paidPct = globalNetTotal > 0 ? Math.round((globalNetPaid / globalNetTotal) * 100) : 0;

  // ── Potentiel ──────────────────────────────────────────────
  const potentielRows = allClients
    .map((client) => {
      const clientProjects = projects.filter((p) => p.clientId === client.id);
      const projectsWithPotentiel = clientProjects.filter(
        (p) => (p.potentialAmount ?? 0) > 0 && !projectHasLockedPotentiel(budgetProducts, p.id)
      );
      const total = projectsWithPotentiel.reduce((acc, p) => acc + (p.potentialAmount ?? 0), 0);
      return { client, projects: projectsWithPotentiel, total };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total);

  const totalPotentiel = potentielRows.reduce((acc, r) => acc + r.total, 0);

  // ── À surveiller ───────────────────────────────────────────
  const alertProjects = projects.filter((p) => {
    const hasNoActivity = !p.lastActivity || p.lastActivity === "—";
    const hasNoProducts = !budgetProducts.some((bp) => bp.projectId === p.id);
    return hasNoActivity || hasNoProducts;
  });

  // ── Date ───────────────────────────────────────────────────
  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8">
        {/* ── Header : greeting + stats ────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
              Bonjour{userName ? ` ${userName}` : ""}
            </h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 mt-1 capitalize">{today}</p>
          </div>
          {loaded && (
            <div className="flex gap-5">
              {[
                { n: clients.length, label: clients.length === 1 ? "client" : "clients" },
                { n: projects.length, label: projects.length === 1 ? "projet" : "projets" },
              ].map((s) => (
                <div key={s.label} className="text-right">
                  <div className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums leading-none">
                    {s.n}
                  </div>
                  <div className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loaded ? (
          <p className="text-sm text-zinc-400 dark:text-zinc-600">Chargement…</p>
        ) : (
          /* ── 2 colonnes : gauche (potentiel + alertes) / droite (activité) ── */
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Colonne gauche — 2/5 */}
            <div className="lg:col-span-2 space-y-6">
              {/* Todos */}
              <TodoWidget />

              {/* Résumé compta */}
              {globalTotal > 0 && (
                <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden px-5 py-4">
                  <SectionLabel>Trésorerie</SectionLabel>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Encaissé net</span>
                    <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{fmt(globalNetPaid)} €</span>
                  </div>
                  {/* Barre de progression */}
                  <div className="mt-2 h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 dark:bg-emerald-400 transition-all"
                      style={{ width: `${paidPct}%` }}
                    />
                  </div>
                  <div className="flex items-baseline justify-between mt-2">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">Reste à encaisser</span>
                    <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 tabular-nums">{fmt(globalRemaining)} €</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">Net agence</span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">{fmt(globalNetTotal)} €</span>
                  </div>
                </section>
              )}

              {/* Potentiel en cours */}
              {potentielRows.length > 0 && (
                <section className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  <div className="flex items-baseline justify-between px-5 pt-4 pb-3">
                    <SectionLabel>Potentiel en cours</SectionLabel>
                    <span className="text-lg font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                      {fmt(totalPotentiel)} €
                    </span>
                  </div>
                  <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {potentielRows.map((row) => (
                      <button
                        key={row.client.id}
                        onClick={() => navigateTo(row.client.id)}
                        className="w-full text-left px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ background: row.client.color }}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-medium text-zinc-800 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate">
                                {row.client.name}
                              </span>
                              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 tabular-nums flex-shrink-0">
                                {fmt(row.total)} €
                              </span>
                            </div>
                            <div className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                              {row.projects.map((p) => p.name).join(", ")}
                            </div>
                            {row.client.contact.email !== "—" && (
                              <div className="text-xs text-zinc-400 dark:text-zinc-600 mt-0.5 truncate">
                                {row.client.contact.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* À surveiller */}
              {alertProjects.length > 0 && (
                <section className="rounded-2xl bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 overflow-hidden">
                  <div className="px-5 pt-4 pb-3 flex items-baseline justify-between">
                    <SectionLabel>À surveiller</SectionLabel>
                    <span className="text-xs font-medium text-amber-600 dark:text-amber-400 tabular-nums">
                      {alertProjects.length}
                    </span>
                  </div>
                  <div className="divide-y divide-amber-200/40 dark:divide-amber-900/20">
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
                          className="w-full text-left px-5 py-3 hover:bg-amber-100/40 dark:hover:bg-amber-950/20 transition-colors group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1 flex items-start gap-2">
                              {client?.color && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
                                  style={{ background: client.color }}
                                />
                              )}
                              <div className="min-w-0 flex-1">
                              <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                                {client?.name ?? "—"}
                              </span>
                              <span className="text-xs text-zinc-400 dark:text-zinc-500 block mt-0.5">
                                {p.name}
                              </span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 flex-shrink-0 mt-0.5">
                              {labels.map((label) => (
                                <span
                                  key={label}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400"
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

            {/* Colonne droite — 3/5 : Activité récente */}
            <section className="lg:col-span-3 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              <div className="px-5 pt-4 pb-3">
                <SectionLabel>Activité récente</SectionLabel>
              </div>
              {recentLogs === null ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800 animate-pulse">
                  {Array.from({ length: 5 }, (_, i) => (
                    <div key={i} className="px-5 py-3 flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4" />
                        <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800/60 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentLogs.length === 0 ? (
                <p className="px-5 pb-4 text-sm text-zinc-400 dark:text-zinc-600">Aucune activité récente.</p>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {recentLogs.map((log) => {
                    const client = allClients.find((c) => c.id === log.clientId);
                    return (
                      <button
                        key={log.id}
                        onClick={() => navigateTo(log.clientId)}
                        className="w-full text-left px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          {client?.color && (
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ background: client.color }}
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 truncate">
                              {log.metadata?.name ? String(log.metadata.name) : log.summary.slice(0, 80)}
                            </p>
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                              {client?.name ?? "—"}
                              {log.ownerName && (
                                <span className="text-amber-600 dark:text-amber-500"> · {log.ownerName}</span>
                              )}
                              <span className="text-zinc-300 dark:text-zinc-700"> · {formatRelativeTime(log.createdAt)}</span>
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
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
