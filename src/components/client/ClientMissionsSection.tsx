"use client";

import { useState, useTransition } from "react";
import type { Project, BudgetProduct } from "@/lib/types";
import { projectHasLockedPotentiel } from "@/lib/budget-utils";
import { createProjectAction } from "@/lib/store/actions";
import { useStore } from "@/lib/store";
import { SectionHeader, Button, Surface, InputField, Badge, IconBox } from "@/components/ui";
import { getContrastTextColor } from "@/lib/color-utils";
import { cn } from "@/lib/cn";

type ProjectCardProps = {
  project: Project;
  products: BudgetProduct[];
  clientId: string;
  clientColor: string;
};

function ProjectCard({ project, products, clientId, clientColor }: ProjectCardProps) {
  const navigateTo = useStore((s) => s.navigateTo);
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
  const potentielActif =
    (project.potentialAmount ?? 0) > 0 && !projectHasLockedPotentiel(products, project.id);

  return (
    <button
      onClick={() => navigateTo(clientId, project.id)}
      className={cn(
        "relative text-left w-full group flex flex-col p-5 rounded-xl bg-white dark:bg-zinc-900 border transition-all cursor-pointer overflow-hidden",
        isSoldé
          ? "border-emerald-500/30 dark:border-emerald-500/30 ring-1 ring-emerald-500/20"
          : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      {/* Barre couleur inset — rect droite, évite l'arrondi aux coins */}
      <div
        className="absolute left-0 top-4 bottom-4 w-1 shrink-0"
        style={{ background: clientColor }}
        aria-hidden
      />
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base font-semibold text-zinc-800 dark:text-zinc-100 truncate">
            {project.name}
          </span>
          {isSoldé && (
            <Badge variant="success" size="xs">Soldé</Badge>
          )}
        </div>
      </div>
      {products.length > 0 ? (
        <ul className="space-y-1 text-sm text-zinc-600 dark:text-zinc-500 mb-3">
          {products.map((p) => {
            const pTotal = p.devis?.amount ?? p.totalAmount;
            const pPaid = [p.acompte, ...(p.avancements ?? []), p.solde].reduce(
              (s, stage) => s + (stage?.status === "paid" ? (stage.amount ?? 0) : 0), 0
            );
            const pSoldé = pTotal > 0 && pPaid >= pTotal;
            return (
              <li key={p.id} className="flex items-center gap-1.5 min-w-0">
                <span className="truncate">{p.name}</span>
                {pSoldé && (
                  <Badge variant="success" size="xs">Soldé</Badge>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-600 mb-3">Aucun produit</p>
      )}
      {(devisé > 0 || facturé > 0 || potentielActif) && (
        <div className="mt-auto pt-3 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-4 text-xs">
          {devisé > 0 || facturé > 0 ? (
            <>
              <span className="text-zinc-600 dark:text-zinc-400">
                Facturé : <span className="font-medium text-zinc-800 dark:text-zinc-200">{facturé.toLocaleString("fr-FR")} €</span>
              </span>
              <span className="text-zinc-600 dark:text-zinc-400">
                Devisé : <span className="font-medium text-zinc-800 dark:text-zinc-200">{devisé.toLocaleString("fr-FR")} €</span>
              </span>
            </>
          ) : null}
          {potentielActif && (
            <span className="text-zinc-600 dark:text-zinc-400">
              Potentiel : <span className="font-medium text-amber-600 dark:text-amber-400">{(project.potentialAmount ?? 0).toLocaleString("fr-FR")} €</span>
            </span>
          )}
        </div>
      )}
    </button>
  );
}

function EmptyProjects({ onAdd }: { onAdd?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <IconBox size="lg" variant="surface" className="mb-4">
        <span className="text-xl">📁</span>
      </IconBox>
      <p className="text-base font-medium text-zinc-600 dark:text-zinc-400">Aucun projet</p>
      <p className="text-sm text-zinc-500 dark:text-zinc-600 mt-1 mb-4">
        Crée le premier projet pour commencer.
      </p>
      {onAdd && (
        <Button variant="secondary" onClick={onAdd}>
          + Nouveau projet
        </Button>
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
        <SectionHeader level="sublabel" className="flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Projets ({projects.length})
        </SectionHeader>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowAddProject((v) => !v)}
        >
          {showAddProject ? "✕ Annuler" : "+ Nouveau projet"}
        </Button>
      </div>

      {showAddProject && (
        <Surface variant="dashed" padding="md" className="mb-6">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-3">
            Nouveau projet
          </p>
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-sm text-zinc-500 dark:text-zinc-600 mb-1">Nom</label>
              <InputField
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
                autoFocus
              />
            </div>
            <Button
              variant="primary"
              onClick={handleAddProject}
              disabled={!newProjectName.trim() || isPendingProject}
              style={newProjectName.trim() ? { background: clientColor, color: getContrastTextColor(clientColor) } : undefined}
            >
              {isPendingProject ? "…" : "Créer"}
            </Button>
          </div>
          {projectError && <p className="text-sm text-red-500 mt-2">{projectError}</p>}
        </Surface>
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
              clientColor={clientColor}
            />
          ))}
        </div>
      )}
    </section>
  );
}
