"use client";

import { ClientAvatar } from "@/components/ClientAvatar";
import { useStore } from "@/lib/store";
import {
  useSidebarClients,
  useStoreLoaded,
} from "@/hooks/useStoreData";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import type { Client } from "@/lib/types";
import { projectHasLockedPotentiel } from "@/lib/budget-utils";

export function ComptaView() {
  const loaded = useStoreLoaded();
  const clients = useSidebarClients();
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const navigateTo = useStore((s) => s.navigateTo);

  const clientIds = clients.map((c) => c.id);
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

  const rows = clients
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
        <SectionHeader level="h3">Comptabilité</SectionHeader>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        <div className="max-w-2xl space-y-4">
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-baseline justify-between gap-4 sm:gap-6 md:gap-8 pb-4 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <SectionHeader level="sublabel">
                Encaissé (sur devis validés) / Total
              </SectionHeader>
              <p className="text-xl font-semibold text-zinc-900 dark:text-white mt-0.5 whitespace-nowrap">
                {(globalPaid - globalSousTraitance).toLocaleString("fr-FR")} € / {(globalTotal - globalSousTraitance).toLocaleString("fr-FR")} €
              </p>
            </div>
            <div>
              <SectionHeader level="sublabel">
                Sous-traitance
              </SectionHeader>
              <p className="text-xl font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5 whitespace-nowrap">
                {globalSousTraitance.toLocaleString("fr-FR")} €
              </p>
            </div>
            <div className="ml-auto">
              <SectionHeader level="sublabel">
                Potentiel
              </SectionHeader>
              <p className="text-xl font-semibold text-amber-400 mt-0.5 whitespace-nowrap">
                {globalPotentiel.toLocaleString("fr-FR")} €
              </p>
            </div>
          </div>

          {/* En-têtes de colonnes */}
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">
            <span>Client</span>
            <span className="text-right w-28">Encaissé / Total</span>
            <span className="text-right w-24">Potentiel</span>
          </div>

          {rows.map(({ client, total, paid, sousTraitance, potentiel }) => {
            const netPaid = paid - sousTraitance;
            const netTotal = total - sousTraitance;
            return (
              <Surface
                key={client.id}
                as="button"
                variant="interactive"
                className="w-full grid grid-cols-[1fr_auto_auto] gap-4 items-center py-3 px-4 group text-left"
                onClick={() => navigateTo(client.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <ClientAvatar client={client} size="sm" rounded="lg" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate block">
                      {client.name}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-right w-28 tabular-nums whitespace-nowrap">
                  {(netTotal > 0 || netPaid > 0) ? (
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {netPaid.toLocaleString("fr-FR")} € / {netTotal.toLocaleString("fr-FR")} €
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">—</span>
                  )}
                </div>
                <div className="text-sm text-right w-24 tabular-nums whitespace-nowrap">
                  {potentiel > 0 ? (
                    <span className="font-medium text-amber-400/90">
                      {potentiel.toLocaleString("fr-FR")} €
                    </span>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500">—</span>
                  )}
                </div>
              </Surface>
            );
          })}
        </div>
      </div>
    </div>
  );
}
