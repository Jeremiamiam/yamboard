"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Project, BudgetProduct } from "@/lib/types";
import { createProjectAction } from "@/lib/store/actions";

type ProjectCardProps = {
  project: Project;
  products: BudgetProduct[];
  clientId: string;
};

function ProjectCard({ project, products, clientId }: ProjectCardProps) {
  return (
    <Link
      href={`/${clientId}/${project.id}#produits`}
      prefetch
      className="group flex flex-col p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all"
    >
      <p className="text-base font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors leading-tight mb-3">
        {project.name}
      </p>
      {products.length > 0 ? (
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-500">
          {products.map((p) => (
            <li key={p.id} className="truncate">
              {p.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-600">Aucun produit</p>
      )}
    </Link>
  );
}

function EmptyProjects({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4">
        <span className="text-xl">📁</span>
      </div>
      <p className="text-base font-medium text-zinc-600 dark:text-zinc-400">Aucune mission</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-600 mt-1 mb-4">
        Crée la première mission pour commencer.
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          + Nouvelle mission
        </button>
      )}
    </div>
  );
}

type Props = {
  clientId: string;
  clientColor: string;
  projects: Project[];
  budgetByProject: Record<string, BudgetProduct[]>;
};

export function ClientMissionsSection({
  clientId,
  clientColor,
  projects,
  budgetByProject,
}: Props) {
  const [showAddMission, setShowAddMission] = useState(false);
  const [newMissionName, setNewMissionName] = useState("");
  const [missionError, setMissionError] = useState<string | null>(null);
  const [isPendingMission, startMissionTransition] = useTransition();

  function handleAddMission() {
    const name = newMissionName.trim();
    if (!name) return;

    startMissionTransition(async () => {
      setMissionError(null);
      const result = await createProjectAction({ clientId, name });
      if (result.error) {
        setMissionError(result.error);
      } else {
        setShowAddMission(false);
        setNewMissionName("");
      }
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
          Missions · {projects.length}
        </h2>
        <button
          onClick={() => setShowAddMission((v) => !v)}
          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer ${
            showAddMission
              ? "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
              : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          {showAddMission ? "✕ Annuler" : "+ Nouvelle mission"}
        </button>
      </div>

      {showAddMission && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
            Nouvelle mission
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-zinc-500 dark:text-zinc-600 mb-1">Nom</label>
              <input
                type="text"
                value={newMissionName}
                onChange={(e) => setNewMissionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMission();
                  }
                }}
                placeholder="Ex. Identité de marque"
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={handleAddMission}
              disabled={!newMissionName.trim() || isPendingMission}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
              style={{
                background: newMissionName.trim() ? clientColor : undefined,
              }}
            >
              {isPendingMission ? "…" : "Créer"}
            </button>
          </div>
          {missionError && <p className="text-sm text-red-500 mt-2">{missionError}</p>}
        </div>
      )}

      {projects.length === 0 && !showAddMission ? (
        <EmptyProjects onAdd={() => setShowAddMission(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              products={budgetByProject[project.id] ?? []}
              clientId={clientId}
            />
          ))}
        </div>
      )}
    </section>
  );
}
