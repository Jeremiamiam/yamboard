"use client";

import {
  getBudgetProducts,
  getProjectBudgetSummary,
  PAYMENT_STAGE_LABEL,
  type Project,
  type BudgetProduct,
  type PaymentStage,
} from "@/lib/mock";

export function BudgetsTab({
  project,
  clientColor,
}: {
  project: Project;
  clientColor: string;
}) {
  const products = getBudgetProducts(project.id);
  const { total, paid, remaining } = getProjectBudgetSummary(project.id);
  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-white">Budget</h2>
            <p className="text-sm text-zinc-500 mt-0.5">{project.name}</p>
          </div>
          <button className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-colors">
            + Ajouter un produit
          </button>
        </div>

        {/* Summary */}
        {total > 0 && (
          <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 mb-6">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <SumCard label="Devis total" value={`${total.toLocaleString("fr-FR")} €`} />
              <SumCard label="Encaissé" value={`${paid.toLocaleString("fr-FR")} €`} highlight />
              <SumCard label="Restant" value={`${remaining.toLocaleString("fr-FR")} €`} />
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, background: clientColor }}
              />
            </div>
            <p className="text-[11px] text-zinc-600 mt-1.5">{pct}% encaissé</p>
          </div>
        )}

        {/* Products */}
        {products.length === 0 ? (
          <EmptyBudget />
        ) : (
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} clientColor={clientColor} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

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
      <p className="text-[11px] text-zinc-600 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-lg font-semibold ${highlight ? "text-white" : "text-zinc-400"}`}>
        {value}
      </p>
    </div>
  );
}

function ProductCard({
  product,
  clientColor,
}: {
  product: BudgetProduct;
  clientColor: string;
}) {
  const stages: {
    key: "devis" | "acompte" | "avancement" | "solde";
    stage: PaymentStage | undefined;
  }[] = [
    { key: "devis", stage: product.devis },
    { key: "acompte", stage: product.acompte },
    { key: "avancement", stage: product.avancement },
    { key: "solde", stage: product.solde },
  ];

  // Only show stages that are defined
  const definedStages = stages.filter((s) => s.stage !== undefined);

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800">
      {/* Product header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <span className="text-sm font-medium text-zinc-200">{product.name}</span>
        <span className="text-sm font-semibold text-zinc-300">
          {product.totalAmount.toLocaleString("fr-FR")} €
        </span>
      </div>

      {/* Payment stages */}
      <div className="divide-y divide-zinc-800/60">
        {definedStages.map(({ key, stage }) => (
          <PaymentRow
            key={key}
            label={PAYMENT_STAGE_LABEL[key]}
            stage={stage!}
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
  clientColor,
}: {
  label: string;
  stage: PaymentStage;
  clientColor: string;
}) {
  const statusConfig = {
    pending: { dot: "bg-zinc-600", text: "text-zinc-600", label: "En attente" },
    sent: { dot: "bg-yellow-500", text: "text-yellow-500", label: "Envoyé" },
    paid: { dot: "bg-emerald-500", text: "text-emerald-500", label: "Payé" },
  }[stage.status];

  return (
    <div className="flex items-center gap-4 px-4 py-2.5">
      {/* Status dot */}
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />

      {/* Label */}
      <span className="text-xs text-zinc-500 w-20 shrink-0">{label}</span>

      {/* Amount */}
      <span className="text-xs text-zinc-400 flex-1">
        {stage.amount ? `${stage.amount.toLocaleString("fr-FR")} €` : "—"}
      </span>

      {/* Date */}
      <span className="text-xs text-zinc-600 w-24 text-right">
        {stage.date ?? "—"}
      </span>

      {/* Status */}
      <span className={`text-[11px] font-medium w-16 text-right ${statusConfig.text}`}>
        {statusConfig.label}
      </span>
    </div>
  );
}

function EmptyBudget() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
        <span className="text-xl">💳</span>
      </div>
      <p className="text-sm font-medium text-zinc-400">Aucun produit</p>
      <p className="text-xs text-zinc-600 mt-1">Ajoute les prestations pour suivre le budget.</p>
    </div>
  );
}
