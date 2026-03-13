"use client";

import { ClientAvatar } from "@/components/ClientAvatar";
import { useStore } from "@/lib/store";
import {
  useSidebarClients,
  useStoreLoaded,
} from "@/hooks/useStoreData";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Progress } from "@/components/ui/Progress";
import type { Client, Project } from "@/lib/types";
import { projectHasLockedPotentiel } from "@/lib/budget-utils";

type ProjectSegment = {
  name: string;
  netTotal: number;
  netPaid: number;
};

function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

function pct(a: number, b: number) {
  if (b <= 0) return 0;
  return Math.round((a / b) * 100);
}

export function ComptaView() {
  const loaded = useStoreLoaded();
  const clients = useSidebarClients();
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  const navigateTo = useStore((s) => s.navigateTo);

  const clientIds = clients.map((c) => c.id);
  const allProjects = projects.filter((p) => clientIds.includes(p.clientId));
  const budgetByProject: Record<string, { total: number; paid: number; sousTraitancePayee: number; sousTraitanceTotale: number }> = {};
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

  let globalTotal = 0;
  let globalPaid = 0;
  let globalPotentiel = 0;
  let globalSousTraitancePayee = 0;
  let globalSousTraitanceTotale = 0;

  const rows = clients
    .map((client) => {
      const clientProjects = allProjects.filter((p) => p.clientId === client.id);
      const total = clientProjects.reduce((acc, p) => acc + (budgetByProject[p.id]?.total ?? 0), 0);
      const paid = clientProjects.reduce((acc, p) => acc + (budgetByProject[p.id]?.paid ?? 0), 0);
      const sousTraitancePayee = clientProjects.reduce((acc, p) => acc + (budgetByProject[p.id]?.sousTraitancePayee ?? 0), 0);
      const sousTraitanceTotale = clientProjects.reduce((acc, p) => acc + (budgetByProject[p.id]?.sousTraitanceTotale ?? 0), 0);
      const potentiel = clientProjects.reduce(
        (acc, p) =>
          acc + (projectHasLockedPotentiel(budgetProducts, p.id) ? 0 : p.potentialAmount ?? 0),
        0
      );
      // Build per-project segments for the stacked bar
      const segments: ProjectSegment[] = clientProjects
        .map((p) => {
          const b = budgetByProject[p.id];
          if (!b || b.total <= 0) return null;
          const netT = b.total - b.sousTraitanceTotale;
          const netP = b.paid - b.sousTraitancePayee;
          if (netT <= 0) return null;
          return { name: p.name, netTotal: netT, netPaid: netP };
        })
        .filter((s): s is ProjectSegment => s !== null)
        .sort((a, b) => b.netTotal - a.netTotal);

      globalTotal += total;
      globalPaid += paid;
      globalSousTraitancePayee += sousTraitancePayee;
      globalSousTraitanceTotale += sousTraitanceTotale;
      globalPotentiel += potentiel;
      return { client, total, paid, sousTraitancePayee, sousTraitanceTotale, potentiel, segments };
    })
    .filter((r) => r.total > 0 || r.potentiel > 0)
    .sort((a, b) => (b.total - b.sousTraitanceTotale) - (a.total - a.sousTraitanceTotale));

  const globalNetPaid = globalPaid - globalSousTraitancePayee;
  const globalNetTotal = globalTotal - globalSousTraitanceTotale;
  const globalPctPaid = pct(globalNetPaid, globalNetTotal);
  const globalReste = globalNetTotal - globalNetPaid;

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
        <div className="max-w-3xl space-y-6">

          {/* ── KPI Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Surface variant="card" padding="sm">
              <SectionHeader level="sublabel" className="mb-1">Encaissé net</SectionHeader>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                {fmt(globalNetPaid)} €
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Progress
                  value={globalNetPaid}
                  max={globalNetTotal || 1}
                  size="sm"
                  color="rgb(16 185 129)"
                />
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums shrink-0">
                  {globalPctPaid}%
                </span>
              </div>
            </Surface>

            <Surface variant="card" padding="sm">
              <SectionHeader level="sublabel" className="mb-1">Reste à encaisser</SectionHeader>
              <p className="text-xl font-bold text-zinc-900 dark:text-white tabular-nums">
                {fmt(globalReste)} €
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 tabular-nums">
                sur {fmt(globalNetTotal)} € net
              </p>
            </Surface>

            <Surface variant="card" padding="sm">
              <SectionHeader level="sublabel" className="mb-1">Sous-traitance</SectionHeader>
              <p className="text-xl font-bold text-zinc-600 dark:text-zinc-400 tabular-nums">
                {fmt(globalSousTraitancePayee)} €
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 tabular-nums">
                payée sur {fmt(globalSousTraitanceTotale)} €
              </p>
            </Surface>

            <Surface variant="card" padding="sm">
              <SectionHeader level="sublabel" className="mb-1">Potentiel</SectionHeader>
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                {fmt(globalPotentiel)} €
              </p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-500 mt-1 tabular-nums">
                total projeté {fmt(globalNetTotal + globalPotentiel)} €
              </p>
            </Surface>
          </div>

          {/* ── Brut vs Net reminder ── */}
          <div className="flex items-center gap-3 px-4 py-2 text-[10px] text-zinc-400 dark:text-zinc-600 tabular-nums">
            <span>Devis brut {fmt(globalTotal)} €</span>
            <span className="text-zinc-300 dark:text-zinc-700">—</span>
            <span>Sous-traitance {fmt(globalSousTraitanceTotale)} €</span>
            <span className="text-zinc-300 dark:text-zinc-700">=</span>
            <span className="font-semibold text-zinc-500 dark:text-zinc-500">Net agence {fmt(globalNetTotal)} €</span>
          </div>

          {/* ── Client count ── */}
          <div className="px-4 pt-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
            {rows.length} client{rows.length > 1 ? "s" : ""}
          </div>

          {/* ── Client Rows ── */}
          <div className="space-y-2">
            {rows.map(({ client, total, paid, sousTraitancePayee, sousTraitanceTotale, potentiel, segments }) => {
              const netPaid = paid - sousTraitancePayee;
              const netTotal = total - sousTraitanceTotale;
              const ratio = pct(netPaid, netTotal);
              return (
                <Surface
                  key={client.id}
                  as="button"
                  variant="interactive"
                  className="w-full py-3 px-4 group text-left"
                  onClick={() => navigateTo(client.id)}
                >
                  {/* Header row: avatar + name + totals */}
                  <div className="flex items-center gap-3 mb-2">
                    <ClientAvatar client={client} size="sm" rounded="lg" />
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 group-hover:text-zinc-900 dark:group-hover:text-white truncate flex-1 min-w-0">
                      {client.name}
                    </span>
                    <div className="flex items-baseline gap-3 shrink-0">
                      {netTotal > 0 && (
                        <span className="text-xs tabular-nums text-zinc-600 dark:text-zinc-400">
                          {fmt(netPaid)} / {fmt(netTotal)} €
                          <span className="ml-1 text-[10px] font-semibold text-zinc-400 dark:text-zinc-600">
                            {ratio}%
                          </span>
                        </span>
                      )}
                      {sousTraitanceTotale > 0 && (
                        <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-600">
                          st. {fmt(sousTraitanceTotale)} €
                        </span>
                      )}
                      {potentiel > 0 && (
                        <span className="text-[10px] font-medium tabular-nums text-amber-600 dark:text-amber-400">
                          +{fmt(potentiel)} €
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Per-project lines */}
                  {segments.length > 0 && (
                    <div className="space-y-1.5 pl-9">
                      {segments.map((seg, i) => {
                        const segRatio = pct(seg.netPaid, seg.netTotal);
                        return (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate w-24 shrink-0">
                              {seg.name}
                            </span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800/60">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${segRatio}%`, background: "rgb(16 185 129)" }}
                              />
                            </div>
                            <span className="text-[10px] tabular-nums text-zinc-400 dark:text-zinc-600 shrink-0 w-16 text-right">
                              {fmt(seg.netTotal)} €
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Surface>
              );
            })}
          </div>

          {rows.length === 0 && (
            <Surface variant="muted" padding="lg" className="text-center">
              <p className="text-sm text-zinc-500 dark:text-zinc-500">
                Aucun client avec des budgets en cours.
              </p>
            </Surface>
          )}
        </div>
      </div>
    </div>
  );
}
