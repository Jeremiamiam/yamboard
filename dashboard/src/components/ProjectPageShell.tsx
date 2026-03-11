"use client";

import { useState, useEffect, useTransition } from "react";
import { redirect } from "next/navigation";
import { DocumentsTab } from "@/components/tabs/DocumentsTab";
import { BudgetsTab } from "@/components/tabs/BudgetsTab";
import { ProductDrawer } from "@/components/ProductDrawer";
import { type Client, type Project, type Document, type BudgetProduct } from "@/lib/types";
import { updateProjectAction } from "@/lib/store/actions";
import { ClientBreadcrumbNav } from "@/components/ClientBreadcrumbNav";
import { projectHasLockedPotentiel } from "@/lib/budget-utils";

type Props = {
  client: Client
  project: Project | null
  projectDocs: Document[]
  clientDocs: Document[]
  budgetProducts: BudgetProduct[]
  clientId: string
  projectId: string
}

export function ProjectPageShell({
  client,
  project: propProject,
  projectDocs,
  clientDocs,
  budgetProducts,
  clientId,
  projectId,
}: Props) {
  const [potentiel, setPotentiel] = useState<number | undefined>(propProject?.potentialAmount);
  const [isEditingPotentiel, setIsEditingPotentiel] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(propProject?.name ?? "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (propProject) {
      setPotentiel(propProject.potentialAmount);
      setEditName(propProject.name);
    }
  }, [propProject?.potentialAmount, propProject?.name]);

  // If project is null (invalid UUID in URL) → redirect to client page
  if (!propProject) {
    redirect(`/${clientId}`)
  }

  const project = propProject
  const potentielLocked = projectHasLockedPotentiel(budgetProducts, project.id);
  const [selectedProduct, setSelectedProduct] = useState<BudgetProduct | null>(null);

  function handlePotentielSave() {
    setIsEditingPotentiel(false);
    startTransition(async () => {
      await updateProjectAction(project.id, { potentialAmount: potentiel });
    });
  }

  function handleNameSave() {
    const name = editName.trim();
    if (!name || name === project.name) {
      setIsEditingName(false);
      setEditName(project.name);
      return;
    }
    setIsEditingName(false);
    startTransition(async () => {
      await updateProjectAction(project.id, { name });
    });
  }

  return (
    <>
      <div
        className="flex flex-col h-screen bg-zinc-50 dark:bg-zinc-950"
        style={{ paddingLeft: "calc(var(--sidebar-w) + var(--client-detail-sidebar-w))", paddingTop: "calc(var(--nav-h) + var(--breadcrumb-h))" }}
      >
        <ClientBreadcrumbNav
          client={client}
          project={project}
          clientId={clientId}
          rightSlot={
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-1.5">
                <label className="text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider">
                  Potentiel
                </label>
                {potentielLocked ? (
                  <span
                    className="text-sm text-zinc-500 dark:text-zinc-600 italic"
                    title="Devis payé ou mouvement d'argent — le potentiel n'a plus d'intérêt"
                  >
                    Projet déjà actif
                  </span>
                ) : isEditingPotentiel ? (
                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 w-24">
                  <input
                    type="number"
                    value={potentiel ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      setPotentiel(v === "" ? undefined : parseFloat(v) || undefined);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handlePotentielSave();
                      if (e.key === "Escape") {
                        setIsEditingPotentiel(false);
                        setPotentiel(project.potentialAmount);
                      }
                    }}
                    autoFocus
                    className="bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none text-right w-full"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-600">€</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingPotentiel(true)}
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  {potentiel != null && !isNaN(potentiel)
                    ? `${potentiel.toLocaleString("fr-FR")} €`
                    : "—"}
                </button>
              )}
              </div>
            </div>
          }
        />

        {/* ── Split: produits à gauche, produit ou documents à droite ── */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row min-h-0">
          <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden lg:border-r border-b lg:border-b-0 border-zinc-200 dark:border-zinc-800">
            <BudgetsTab
              project={project}
              clientColor={client.color}
              budgetProducts={budgetProducts}
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden">
            {selectedProduct ? (
              <ProductDrawer
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                clientColor={client.color}
                variant="inline"
              />
            ) : (
              <DocumentsTab
                project={project}
                clientId={clientId}
                clientColor={client.color}
                projectDocs={projectDocs}
                clientDocs={clientDocs}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
