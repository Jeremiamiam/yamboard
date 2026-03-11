"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Project, BudgetProduct } from "@/lib/types";
import { createProjectAction } from "@/lib/store/actions";
import { useStore } from "@/lib/store";

type ProjectCardProps = {
  project: Project;
  products: BudgetProduct[];
  clientId: string;
};

function ProjectCard({ project, products, clientId }: ProjectCardProps) {
  const { devisé, facturé, paid } = products.reduce(
    (acc, p) => {
      const t = p.devis?.amount ?? p.totalAmount;
      let pd = 0;
      let fact = 0;
      const addIfSentOrPaid = (stage: { amount?: number; status?: string } | undefined) => {
        if (stage?.status === "sent" || stage?.status === "paid") {
          return (stage.amount ?? 0);
        }
        return 0;
      };
      if (p.acompte?.status === "paid") pd += p.acompte.amount ?? 0;
      fact += addIfSentOrPaid(p.acompte);
      for (const av of p.avancements ?? []) {
        if (av.status === "paid") pd += av.amount ?? 0;
        fact += addIfSentOrPaid(av);
      }
      if (p.solde?.status === "paid") pd += p.solde.amount ?? 0;
      fact += addIfSentOrPaid(p.solde);
      return {
        devisé: acc.devisé + t,
        facturé: acc.facturé + fact,
        paid: acc.paid + pd,
      };
    },
    { devisé: 0, facturé: 0, paid: 0 }
  );
  const isSoldé = devisé > 0 && paid >= devisé;

  return (
    <Link
      href={`/${clientId}/${project.id}#produits`}
      prefetch
      className={`block group flex flex-col p-5 rounded-xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer ${
        isSoldé
          ? "border-emerald-500/30 dark:border-emerald-500/30 ring-1 ring-emerald-500/20"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {project.name}
          </span>
          {isSoldé && (
            <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full shrink-0">
              Soldé
            </span>
          )}
        </div>
      </div>
      {products.length > 0 ? (
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-500 mb-3">
          {products.map((p) => (
            <li key={p.id} className="truncate">
              {p.name}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-600 mb-3">Aucun produit</p>
      )}
      {(devisé > 0 || facturé > 0) && (
        <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-4 text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">
            Facturé : <span className="font-medium text-zinc-800 dark:text-zinc-200">{facturé.toLocaleString("fr-FR")} €</span>
          </span>
          <span className="text-zinc-600 dark:text-zinc-400">
            Devisé : <span className="font-medium text-zinc-800 dark:text-zinc-200">{devisé.toLocaleString("fr-FR")} €</span>
          </span>
        </div>
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
      <p className="text-base font-medium text-zinc-600 dark:text-zinc-400">Aucun projet</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-600 mt-1 mb-4">
        Crée le premier projet pour commencer.
      </p>
      {onAdd && (
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          + Nouveau projet
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
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projectError, setProjectError] = useState<string | null>(null);
  const [isPendingProject, startProjectTransition] = useTransition();

  function handleAddProject() {
    const name = newProjectName.trim();
    if (!name) return;

    startProjectTransition(async () => {
      setProjectError(null);
      const result = await createProjectAction({ clientId, name });
      if (result.error) {
        setProjectError(result.error);
      } else {
        setShowAddProject(false);
        setNewProjectName("");
      }
    });
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Projets ({projects.length})
        </h2>
        <button
          onClick={() => setShowAddProject((v) => !v)}
          className={`px-3 py-1.5 rounded-lg border text-sm transition-colors cursor-pointer ${
            showAddProject
              ? "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
              : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:text-zinc-800 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
          }`}
        >
          {showAddProject ? "✕ Annuler" : "+ Nouveau projet"}
        </button>
      </div>

      {showAddProject && (
        <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
            Nouveau projet
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm text-zinc-500 dark:text-zinc-600 mb-1">Nom</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddProject();
                  }
                }}
                placeholder="Ex. Identité de marque"
                className="w-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={handleAddProject}
              disabled={!newProjectName.trim() || isPendingProject}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
              style={{
                background: newProjectName.trim() ? clientColor : undefined,
              }}
            >
              {isPendingProject ? "…" : "Créer"}
            </button>
          </div>
          {projectError && <p className="text-sm text-red-500 mt-2">{projectError}</p>}
        </div>
      )}

      {projects.length === 0 && !showAddProject ? (
        <EmptyProjects onAdd={() => setShowAddProject(true)} />
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
