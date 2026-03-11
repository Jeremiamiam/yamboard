"use client";

import { useState, useMemo, useTransition } from "react";
import {
  PAYMENT_STAGE_LABEL,
  type Project,
  type BudgetProduct,
  type PaymentStage,
} from "@/lib/types";
import { ProductDrawer } from "@/components/ProductDrawer";
import { createBudgetProductAction } from "@/lib/store/actions";

export function BudgetsTab({
  project,
  clientColor,
  budgetProducts,
}: {
  project: Project;
  clientColor: string;
  budgetProducts: BudgetProduct[];
}) {
  const { total, paid, remaining } = useMemo(() => {
    const t = budgetProducts.reduce((s, p) => s + p.totalAmount, 0);
    const pd = budgetProducts.reduce((s, p) => {
      let amt = 0;
      if (p.acompte?.status === "paid") amt += p.acompte.amount ?? 0;
      for (const av of p.avancements ?? []) {
        if (av.status === "paid") amt += av.amount ?? 0;
      }
      if (p.solde?.status === "paid") amt += p.solde.amount ?? 0;
      return s + amt;
    }, 0);
    return { total: t, paid: pd, remaining: t - pd };
  }, [budgetProducts]);

  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isPendingAdd, startAddTransition] = useTransition();

  const [drawerProduct, setDrawerProduct] = useState<BudgetProduct | null>(null);

  function handleAddProduct() {
    const name = newName.trim();
    const amount = parseFloat(newAmount);
    if (!name || isNaN(amount) || amount <= 0) return;

    startAddTransition(async () => {
      setAddError(null);
      const result = await createBudgetProductAction({ projectId: project.id, name, totalAmount: amount });
      if (result.error) {
        setAddError(result.error);
      } else {
        setShowForm(false);
        setNewName("");
        setNewAmount("");
      }
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-2xl">
        <ProductDrawer
          product={drawerProduct}
          onClose={() => setDrawerProduct(null)}
          clientColor={clientColor}
        />
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white">Produits</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{project.name}</p>
          </div>
          <button
              onClick={() => setShowForm((v) => !v)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                showForm
                  ? "bg-zinc-200 border-zinc-300 text-zinc-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300"
                  : "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              {showForm ? "✕ Annuler" : "+ Ajouter un produit"}
            </button>
        </div>

        {/* Add product form */}
        {showForm && (
          <div className="mb-6 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 border-dashed">
            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
              Nouveau produit / prestation
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddProduct(); }
                }}
                placeholder="Nom de la prestation…"
                className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors"
                autoFocus
              />
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
                <input
                  type="number"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") { e.preventDefault(); handleAddProduct(); }
                  }}
                  placeholder="0"
                  className="w-24 bg-transparent text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none text-right"
                />
                <span className="text-sm text-zinc-500 dark:text-zinc-600 ml-1">€</span>
              </div>
              <button
                onClick={handleAddProduct}
                disabled={!newName.trim() || !newAmount || isPendingAdd}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors disabled:bg-zinc-300 dark:disabled:bg-zinc-800"
                style={{
                  background: newName.trim() && newAmount ? clientColor : undefined,
                }}
              >
                {isPendingAdd ? "…" : "Créer"}
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-700 mt-2">
              Les étapes de paiement (devis, acompte, avancement, solde) s&apos;ajoutent ensuite.
            </p>
            {addError && (
              <p className="text-[11px] text-red-500 mt-1">{addError}</p>
            )}
          </div>
        )}

        {/* Summary */}
        {total > 0 && (
          <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <SumCard label="Devis total" value={`${total.toLocaleString("fr-FR")} €`} />
              <SumCard label="Encaissé" value={`${paid.toLocaleString("fr-FR")} €`} highlight />
              <SumCard label="Restant" value={`${remaining.toLocaleString("fr-FR")} €`} />
            </div>
            <div className="h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: clientColor }}
              />
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-1.5">{pct}% encaissé</p>
          </div>
        )}

        {/* Products */}
        {budgetProducts.length === 0 && !showForm ? (
          <EmptyBudget onAdd={() => setShowForm(true)} />
        ) : (
          <div className="space-y-3">
            {budgetProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                clientColor={clientColor}
                onClick={() => setDrawerProduct(product)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function SumCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}>
        {value}
      </p>
    </div>
  );
}

function ProductCard({
  product,
  clientColor,
  onClick,
}: {
  product: BudgetProduct;
  clientColor: string;
  onClick?: () => void;
}) {
  const fixedStages: { label: string; stage: PaymentStage }[] = [
    product.devis && { label: PAYMENT_STAGE_LABEL["devis"], stage: product.devis },
    product.acompte && { label: PAYMENT_STAGE_LABEL["acompte"], stage: product.acompte },
    ...(product.avancements ?? []).map((av, i) => ({
      label: `Avancement${(product.avancements?.length ?? 0) > 1 ? ` ${i + 1}` : ""}`,
      stage: av,
    })),
    product.solde && { label: PAYMENT_STAGE_LABEL["solde"], stage: product.solde },
  ].filter(Boolean) as { label: string; stage: PaymentStage }[];

  // Progress: how many stages are paid
  const paidCount = fixedStages.filter((s) => s.stage?.status === "paid").length;
  const sentCount = fixedStages.filter((s) => s.stage?.status === "sent").length;

  return (
    <div
      role={onClick ? "button" : undefined}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
      className={`rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 ${onClick ? "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors" : ""}`}
    >
      {/* Product header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">{product.name}</span>
          {paidCount === fixedStages.length && fixedStages.length > 0 && (
            <span className="text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
              Soldé
            </span>
          )}
          {sentCount > 0 && paidCount < fixedStages.length && (
            <span className="text-[10px] font-semibold text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-full">
              En attente
            </span>
          )}
        </div>
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {product.totalAmount.toLocaleString("fr-FR")} €
        </span>
      </div>

      {/* Payment stages */}
      <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
        {fixedStages.map(({ label, stage }, i) => (
          <PaymentRow
            key={i}
            label={label}
            stage={stage}
            clientColor={clientColor}
          />
        ))}
      </div>
    </div>
  );
}

function PaymentRow({
  label,
  stage,
  clientColor: _clientColor,
}: {
  label: string;
  stage: PaymentStage;
  clientColor: string;
}) {
  const statusConfig = {
    pending: { dot: "bg-zinc-700", text: "text-zinc-600", label: "En attente" },
    sent: { dot: "bg-yellow-500", text: "text-yellow-500", label: "Envoyé" },
    paid: { dot: "bg-emerald-500", text: "text-emerald-500", label: "Payé ✓" },
  }[stage.status ?? "pending"];

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
      <span className="text-xs text-zinc-500 dark:text-zinc-600 w-20 shrink-0">{label}</span>
      <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1">
        {stage.amount ? `${stage.amount.toLocaleString("fr-FR")} €` : "—"}
      </span>
      <span className="text-xs text-zinc-500 dark:text-zinc-600 w-24 text-right">
        {stage.date ?? "—"}
      </span>
      <span className={`text-[11px] font-medium w-20 text-right ${statusConfig.text}`}>
        {statusConfig.label}
      </span>
    </div>
  );
}

function EmptyBudget({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4">
        <span className="text-xl">💳</span>
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aucun produit</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-4">
        Ajoute les prestations pour suivre le budget.
      </p>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors"
      >
        + Ajouter un premier produit
      </button>
    </div>
  );
}
