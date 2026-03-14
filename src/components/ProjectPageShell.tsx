"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { redirect } from "next/navigation";
import { DocumentsTab } from "@/components/tabs/DocumentsTab";
import { BudgetsTab } from "@/components/tabs/BudgetsTab";
import { ProductDrawer } from "@/components/ProductDrawer";
import { type Client, type Project, type Document, type BudgetProduct } from "@/lib/types";
import { updateProjectAction, deleteProjectAction } from "@/lib/store/actions";
import { ClientBreadcrumbNav } from "@/components/ClientBreadcrumbNav";
import { EditMenu } from "@/components/EditMenu";
import { projectHasLockedPotentiel } from "@/lib/budget-utils";
import { useStore } from "@/lib/store";
import { Button, Surface, Progress } from "@/components/ui";
import { cn } from "@/lib/cn";

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
  const [mobileTab, setMobileTab] = useState<"produits" | "documents">("produits");

  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const budgetSummary = useMemo(() => {
    const t = budgetProducts.reduce((s, p) => s + (p.devis?.amount ?? p.totalAmount), 0);
    const pd = budgetProducts.reduce((s, p) => {
      let amt = 0;
      if (p.acompte?.status === "paid") amt += p.acompte.amount ?? 0;
      for (const av of p.avancements ?? []) {
        if (av.status === "paid") amt += av.amount ?? 0;
      }
      if (p.solde?.status === "paid") amt += p.solde.amount ?? 0;
      return s + amt;
    }, 0);
    const st = budgetProducts.reduce(
      (s, p) => s + (p.subcontracts ?? []).reduce((a, sub) => a + (sub.amount ?? 0), 0),
      0
    );
    const hasSubcontracts = budgetProducts.some((p) => (p.subcontracts?.length ?? 0) > 0);
    return {
      total: t,
      paid: pd,
      remaining: t - pd,
      sousTraitance: st,
      hasSubcontracts,
      pct: t > 0 ? Math.round((pd / t) * 100) : 0,
    };
  }, [budgetProducts]);

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

  const navigateTo = useStore((s) => s.navigateTo);
  const toggleDetailSidebar = useStore((s) => s.toggleDetailSidebar);

  function SumCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider mb-1 truncate">{label}</p>
        <p className={cn("text-base sm:text-lg font-semibold truncate", highlight ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400")}>
          {value}
        </p>
      </div>
    );
  }

  function handleDeleteProject() {
    startTransition(async () => {
      const result = await deleteProjectAction(project.id);
      if (!result.error) navigateTo(clientId);
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
            <div className="flex items-center gap-2 sm:gap-5">
              <Button
                variant="ghost"
                size="icon_md"
                onClick={toggleDetailSidebar}
                className="md:hidden"
                aria-label="Contacts et infos"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Button>
              {/* Éditer projet — titre déjà dans le breadcrumb à gauche */}
              <div className="flex items-center gap-2">
                {isEditingName ? (
                  <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 focus-within:border-zinc-400 dark:focus-within:border-zinc-500">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNameSave();
                        if (e.key === "Escape") {
                          setIsEditingName(false);
                          setEditName(project.name);
                        }
                      }}
                      autoFocus
                      placeholder="Nom du projet"
                      className="bg-transparent text-sm text-zinc-800 dark:text-zinc-200 outline-none min-w-[120px]"
                    />
                    <Button variant="ghost" size="xs" onClick={handleNameSave} className="text-emerald-600 hover:text-emerald-500">OK</Button>
                    <Button variant="ghost" size="xs" onClick={() => { setIsEditingName(false); setEditName(project.name); }}>✕</Button>
                  </div>
                ) : (
                  <EditMenu
                    onRename={() => setIsEditingName(true)}
                    onDelete={handleDeleteProject}
                    confirmDeleteLabel="Supprimer ce projet ? Les produits et documents seront supprimés."
                    disabled={isPending}
                  />
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <label className="text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider hidden sm:inline">
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
                  className="text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
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

        {/* ── Titre projet + résumé budget fusionnés ── */}
        <header className="shrink-0 px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-4">
          <h1 className="text-2xl sm:text-3xl font-semibold text-zinc-900 dark:text-white truncate">
            {project.name}
          </h1>
          {budgetSummary.total > 0 && (
            <Surface
              variant="card"
              padding="md"
              className={cn(
                budgetSummary.pct >= 100 && "border-emerald-500/40 dark:border-emerald-500/40 ring-1 ring-emerald-500/20"
              )}
            >
              <div className={cn(
                "grid gap-2 sm:gap-4 mb-3",
                budgetSummary.hasSubcontracts ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-3"
              )}>
                <SumCard label="Budget" value={`${budgetSummary.total.toLocaleString("fr-FR")} €`} />
                <SumCard label="Encaissé (sur devis validés)" value={`${budgetSummary.paid.toLocaleString("fr-FR")} €`} highlight />
                <SumCard label="Restant" value={`${budgetSummary.remaining.toLocaleString("fr-FR")} €`} />
                {budgetSummary.hasSubcontracts && (
                  <>
                    <SumCard label="Sous-traitance" value={`${budgetSummary.sousTraitance.toLocaleString("fr-FR")} €`} />
                    <SumCard label="À toucher (net)" value={`${(budgetSummary.total - budgetSummary.sousTraitance).toLocaleString("fr-FR")} €`} highlight />
                  </>
                )}
              </div>
              <Progress
                value={budgetSummary.pct}
                size="sm"
                color={budgetSummary.pct >= 100 ? "rgb(16 185 129)" : client.color}
              />
              <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-1.5 flex items-center gap-2">
                {budgetSummary.pct}% encaissé
                {budgetSummary.pct >= 100 && (
                  <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Soldé
                  </span>
                )}
              </p>
            </Surface>
          )}
        </header>

        {/* ── Desktop: split horizontal | Mobile: onglets plein écran ── */}
        {isLg ? (
          <div className="flex-1 overflow-hidden flex flex-row min-h-0">
            <div className="flex-1 min-w-0 flex flex-col min-h-0 overflow-hidden border-r border-zinc-200 dark:border-zinc-800">
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
        ) : (
          <>
            {/* Mobile: onglets Produits | Documents, fiche produit en overlay */}
            <div className="shrink-0 flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
              <button
                onClick={() => setMobileTab("produits")}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  mobileTab === "produits"
                    ? "text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                Produits
              </button>
              <button
                onClick={() => setMobileTab("documents")}
                className={cn(
                  "flex-1 px-4 py-3 text-sm font-medium transition-colors",
                  mobileTab === "documents"
                    ? "text-zinc-900 dark:text-white border-b-2 border-zinc-900 dark:border-white"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                Documents
              </button>
            </div>
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              {mobileTab === "produits" ? (
                <BudgetsTab
                  project={project}
                  clientColor={client.color}
                  budgetProducts={budgetProducts}
                  selectedProduct={selectedProduct}
                  onSelectProduct={setSelectedProduct}
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
            {selectedProduct && (
              <ProductDrawer
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
                clientColor={client.color}
                variant="drawer"
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
