import type { BudgetProduct, Project } from "@/lib/types";

/**
 * Le potentiel = montant AVANT que le client signe quoi que ce soit.
 * Dès qu'il y a devis payé ou le moindre mouvement d'argent, le potentiel est locké.
 */
export function projectHasLockedPotentiel(
  budgetProducts: BudgetProduct[],
  projectId: string
): boolean {
  const products = budgetProducts.filter((bp) => bp.projectId === projectId);
  for (const p of products) {
    // Devisé = payé
    if (p.devis?.status === "paid") return true;
    // Mouvement d'argent
    if (p.acompte?.status === "paid") return true;
    for (const av of p.avancements ?? []) {
      if (av.status === "paid") return true;
    }
    if (p.solde?.status === "paid") return true;
  }
  return false;
}

export type ProjectDotStatus = "soldé" | "commencé" | "potentiel";

/**
 * Retourne les statuts des projets d'un client pour afficher les dots.
 * - soldé: 100% encaissé
 * - commencé: budget avec mouvement mais pas soldé
 * - potentiel: potentiel non locké (avant signature)
 */
export function getClientProjectDots(
  projects: Project[],
  budgetProducts: BudgetProduct[],
  clientId: string
): ProjectDotStatus[] {
  const clientProjects = projects.filter((p) => p.clientId === clientId);
  const dots: ProjectDotStatus[] = [];

  for (const p of clientProjects) {
    const products = budgetProducts.filter((bp) => bp.projectId === p.id);
    const total = products.reduce((s, bp) => s + (bp.devis?.amount ?? bp.totalAmount), 0);
    const paid = products.reduce((s, bp) => {
      if (bp.acompte?.status === "paid") s += bp.acompte.amount ?? 0;
      for (const av of bp.avancements ?? []) {
        if (av.status === "paid") s += av.amount ?? 0;
      }
      if (bp.solde?.status === "paid") s += bp.solde.amount ?? 0;
      return s;
    }, 0);

    if (total > 0 && paid >= total) {
      dots.push("soldé");
    } else if (total > 0 || paid > 0) {
      dots.push("commencé");
    } else if ((p.potentialAmount ?? 0) > 0 && !projectHasLockedPotentiel(budgetProducts, p.id)) {
      dots.push("potentiel");
    }
  }
  return dots;
}
