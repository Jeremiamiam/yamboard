"use client";

import { getBudgetPhases, type Project, type BudgetPhase } from "@/lib/mock";

export function BudgetsTab({
  project,
  clientColor,
}: {
  project: Project;
  clientColor: string;
}) {
  const phases = getBudgetPhases(project.id);
  const pct = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
  const remaining = project.budget - project.spent;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-white">Budget</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{project.name}</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard label="Budget total" value={`${project.budget.toLocaleString("fr-FR")} €`} />
          <StatCard label="Consommé" value={`${project.spent.toLocaleString("fr-FR")} €`} accent />
          <StatCard label="Restant" value={`${remaining.toLocaleString("fr-FR")} €`} />
        </div>

        {/* Global progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-500">Avancement global</span>
            <span className="text-xs font-semibold text-zinc-300">{pct}%</span>
          </div>
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: clientColor }}
            />
          </div>
        </div>

        {/* Phases */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">
            Phases
          </h3>
          <div className="space-y-2">
            {phases.map((phase, i) => (
              <PhaseRow key={i} phase={phase} color={clientColor} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-semibold ${accent ? "text-white" : "text-zinc-300"}`}>{value}</p>
    </div>
  );
}

function PhaseRow({ phase, color }: { phase: BudgetPhase; color: string }) {
  const phasePct = phase.allocated > 0 ? Math.round((phase.spent / phase.allocated) * 100) : 0;

  const statusConfig = {
    done: { label: "Terminé", class: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
    active: { label: "En cours", class: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
    pending: { label: "À venir", class: "text-zinc-500 bg-zinc-800 border-zinc-700" },
  };

  const s = statusConfig[phase.status];

  return (
    <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-200">{phase.name}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.class}`}>
            {s.label}
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-zinc-300">
            {phase.spent.toLocaleString("fr-FR")} €
          </span>
          <span className="text-xs text-zinc-600 ml-1">
            / {phase.allocated.toLocaleString("fr-FR")} €
          </span>
        </div>
      </div>

      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${phasePct}%`,
            background: phase.status === "done" ? "#10b981" : phase.status === "active" ? color : "#27272a",
          }}
        />
      </div>
    </div>
  );
}
