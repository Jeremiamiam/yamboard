"use client";

import { ClientAvatar } from "@/components/ClientAvatar";
import { useStore } from "@/lib/store";
import {
  useSidebarClients,
  useSidebarProspects,
  useStoreLoaded,
} from "@/hooks/useStoreData";
import type { Client } from "@/lib/types";
import { projectHasLockedPotentiel } from "@/lib/budget-utils";

export function ComptaView() {
  const loaded = useStoreLoaded();
  const clients = useSidebarClients();
  const prospects = useSidebarProspects();
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const navigateTo = useStore((s) => s.navigateTo);

  const clientsAndProspects: Client[] = [...clients, ...prospects];
  const clientIds = clientsAndProspects.map((c) => c.id);
  const allProjects = projects.filter((p) => clientIds.includes(p.clientId));
  const budgetByProject: Record<string, { total: number; paid: number; sousTraitance: number }> = {};
  for (const p of allProjects) {
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
    const sousTraitance = products.reduce(
      (s, bp) => s + (bp.subcontracts ?? []).reduce((a, sub) => a + (sub.amount ?? 0), 0),
      0
    );
    budgetByProject[p.id] = { total, paid, sousTraitance };
  }

  let globalTotal = 0;
  let globalPaid = 0;
  let globalPotentiel = 0;
  let globalSousTraitance = 0;

  const rows = clientsAndProspects
    .map((client) => {
      const clientProjects = allProjects.filter((p) => p.clientId === client.id);
      const total = clientProjects.reduce((acc, p) => acc + (budgetByProject[p.id]?.total ?? 0), 0);
      const paid = clientProjects.reduce((acc, p) => acc + (budgetByProject[p.id]?.paid ?? 0), 0);
      const sousTraitance = clientProjects.reduce((acc, p) => acc + (budgetByProject[p.id]?.sousTraitance ?? 0), 0);
      const potentiel = clientProjects.reduce(
        (acc, p) =>
          acc + (projectHasLockedPotentiel(budgetProducts, p.id) ? 0 : p.potentialAmount ?? 0),
        0
      );
      globalTotal += total;
      globalPaid += paid;
      globalSousTraitance += sousTraitance;
      globalPotentiel += potentiel;
      return { client, total, paid, sousTraitance, potentiel };
    })
    .filter((r) => r.total > 0 || r.potentiel > 0);

  if (!loaded) {
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

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <header className="shrink-0 px-4 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
        <h1 className="text-base font-semibold text-zinc-900 dark:text-white">Comptabilité</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-baseline justify-between gap-4 sm:gap-6 md:gap-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">
                Encaissé / Total
              </span>
              <p className="text-xl font-semibold text-zinc-900 dark:text-white mt-0.5">
                {(globalPaid - globalSousTraitance).toLocaleString("fr-FR")} €{" "}
                / {(globalTotal - globalSousTraitance).toLocaleString("fr-FR")} €
              </p>
            </div>
            <div>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">
                Sous-traitance
              </span>
              <p className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                {globalSousTraitance.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div className="ml-auto">
              <span className="text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">
                Potentiel
              </span>
              <p className="text-xl font-semibold text-amber-400 mt-0.5">
                {globalPotentiel.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>

          {rows.map(({ client, total, paid, sousTraitance, potentiel }) => {
            const netPaid = paid - sousTraitance;
            const netTotal = total - sousTraitance;
            return (
              <button
                key={client.id}
                onClick={() => navigateTo(client.id)}
                className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-3 px-4 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group cursor-pointer text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ClientAvatar client={client} size="sm" rounded="lg" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate block">
                      {client.name}
                    </span>
                    {client.category === "prospect" && (
                      <span className="text-[10px] text-amber-500/80 uppercase tracking-wider">
                        prospect
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-sm">
                  {(netTotal > 0 || netPaid > 0) && (
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {netPaid.toLocaleString("fr-FR")} € / {netTotal.toLocaleString("fr-FR")} €
                    </span>
                  )}
                  {potentiel > 0 && (
                    <span className="font-medium text-amber-400/90">
                      {potentiel.toLocaleString("fr-FR")} € potentiel
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
