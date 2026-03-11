import type { BudgetProduct } from "@/lib/types";

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
