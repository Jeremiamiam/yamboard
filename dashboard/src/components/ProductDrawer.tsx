"use client";

import { useEffect } from "react";
import { PAYMENT_STAGE_LABEL, type BudgetProduct, type PaymentStage } from "@/lib/types";

type ProductForDrawer = BudgetProduct | { id: string; name: string; totalAmount: number };

export function ProductDrawer({
  product,
  onClose,
  clientColor,
}: {
  product: ProductForDrawer | null;
  onClose: () => void;
  clientColor?: string;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!product) return null;

  const isFullProduct = "devis" in product || "acompte" in product;
  const fullProduct = isFullProduct ? (product as BudgetProduct) : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />
      <div className="fixed top-0 right-0 bottom-0 z-50 w-[70vw] min-w-[320px] flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{product.name}</h2>
            <p className="text-sm text-zinc-500 mt-0.5">
              {product.totalAmount.toLocaleString("fr-FR")} €
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {fullProduct && hasPaymentStages(fullProduct) ? (
            <div className="space-y-4">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
                Étapes de paiement
              </h3>
              <div className="space-y-2">
                {[
                  { key: "devis" as const, stage: fullProduct.devis },
                  { key: "acompte" as const, stage: fullProduct.acompte },
                  { key: "avancement" as const, stage: fullProduct.avancement },
                  { key: "solde" as const, stage: fullProduct.solde },
                ]
                  .filter((s) => s.stage)
                  .map(({ key, stage }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                    >
                      <span className="text-xs text-zinc-500">
                        {PAYMENT_STAGE_LABEL[key]}
                      </span>
                      <div className="flex items-center gap-3">
                        {stage?.amount && (
                          <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            {stage.amount.toLocaleString("fr-FR")} €
                          </span>
                        )}
                        <StatusBadge status={stage?.status} />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-500">
              Produit ajouté — les étapes de paiement se gèrent dans l&apos;onglet Budget.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function hasPaymentStages(p: BudgetProduct) {
  return p.devis || p.acompte || p.avancement || p.solde;
}

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const config = {
    pending: { label: "En attente", className: "text-zinc-500 bg-zinc-200 dark:bg-zinc-800" },
    sent: { label: "Envoyé", className: "text-yellow-500 bg-yellow-500/10" },
    paid: { label: "Payé", className: "text-emerald-500 bg-emerald-500/10" },
  }[status] ?? { label: status, className: "text-zinc-500" };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${config.className}`}>
      {config.label}
    </span>
  );
}
