"use client";

import { useState, useMemo, useTransition } from "react";
import {
  PAYMENT_STAGE_LABEL,
  type Project,
  type BudgetProduct,
  type PaymentStage,
} from "@/lib/types";
import { createBudgetProductAction } from "@/lib/store/actions";
import { useStore } from "@/lib/store";
import { SectionHeader, Button, Surface, InputField, Progress, Badge, IconBox } from "@/components/ui";
import { getContrastTextColor } from "@/lib/color-utils";
import { cn } from "@/lib/cn";

export function BudgetsTab({
  project,
  clientColor,
  budgetProducts,
  selectedProduct,
  onSelectProduct,
}: {
  project: Project;
  clientColor: string;
  budgetProducts: BudgetProduct[];
  selectedProduct?: BudgetProduct | null;
  onSelectProduct?: (product: BudgetProduct | null) => void;
}) {
  const { total, paid, remaining, sousTraitance, hasSubcontracts } = useMemo(() => {
    // total = somme des montants du devis (étape Devis), fallback sur totalAmount
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
    // Sous-traitance = somme de TOUS les montants (payés + en attente) pour affichage "à toucher"
    const st = budgetProducts.reduce(
      (s, p) => s + (p.subcontracts ?? []).reduce((a, sub) => a + (sub.amount ?? 0), 0),
      0
    );
    const hasSubcontracts = budgetProducts.some((p) => (p.subcontracts?.length ?? 0) > 0);
    return { total: t, paid: pd, remaining: t - pd, sousTraitance: st, hasSubcontracts };
  }, [budgetProducts]);

  const pct = total > 0 ? Math.round((paid / total) * 100) : 0;

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [isPendingAdd, startAddTransition] = useTransition();

  function handleAddProduct() {
    const name = newName.trim();
    if (!name) return;

    startAddTransition(async () => {
      setAddError(null);
      const result = await createBudgetProductAction({ projectId: project.id, name, totalAmount: 0 });
      if (result.error) {
        setAddError(result.error);
      } else {
        setShowForm(false);
        setNewName("");
        if (result.product) onSelectProduct?.(result.product);
      }
    });
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-2xl w-full min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <SectionHeader level="h3">Produits</SectionHeader>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowForm((v) => !v)}
          >
            {showForm ? "✕ Annuler" : "+ Ajouter un produit"}
          </Button>
        </div>

        {/* Add product form */}
        {showForm && (
          <Surface variant="dashed" padding="md" className="mb-6">
            <SectionHeader level="label" className="mb-3">
              Nouveau produit / prestation
            </SectionHeader>
            <div className="flex gap-3">
              <InputField
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleAddProduct(); }
                }}
                placeholder="Nom de la prestation…"
                className="flex-1"
                autoFocus
              />
              <Button
                variant="primary"
                onClick={handleAddProduct}
                disabled={!newName.trim() || isPendingAdd}
                style={newName.trim() ? { background: clientColor, color: getContrastTextColor(clientColor) } : undefined}
              >
                {isPendingAdd ? "…" : "Créer"}
              </Button>
            </div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-700 mt-2">
              Le devis, les acomptes, avancements et sous-traitances s&apos;ajoutent ensuite depuis la fiche.
            </p>
            {addError && (
              <p className="text-[11px] text-red-500 mt-1">{addError}</p>
            )}
          </Surface>
        )}

        {/* Summary */}
        {total > 0 && (
          <Surface
            variant="card"
            padding="md"
            className={cn(
              "mb-6",
              pct >= 100 && "border-emerald-500/40 dark:border-emerald-500/40 ring-1 ring-emerald-500/20"
            )}
          >
            <div className={`grid gap-2 sm:gap-4 mb-4 ${hasSubcontracts ? "grid-cols-2 sm:grid-cols-5" : "grid-cols-3"}`}>
              <SumCard label="Budget" value={`${total.toLocaleString("fr-FR")} €`} />
              <SumCard label="Encaissé (sur devis validés)" value={`${paid.toLocaleString("fr-FR")} €`} highlight />
              <SumCard label="Restant" value={`${remaining.toLocaleString("fr-FR")} €`} />
              {hasSubcontracts && (
                <>
                  <SumCard label="Sous-traitance" value={`${sousTraitance.toLocaleString("fr-FR")} €`} />
                  <SumCard label="À toucher (net)" value={`${(total - sousTraitance).toLocaleString("fr-FR")} €`} highlight />
                </>
              )}
            </div>
            <Progress
              value={pct}
              size="sm"
              color={pct >= 100 ? "rgb(16 185 129)" : clientColor}
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-600 mt-1.5 flex items-center gap-2">
              {pct}% encaissé
              {pct >= 100 && total > 0 && (
                <span className="inline-flex items-center gap-1 text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Soldé
                </span>
              )}
            </p>
          </Surface>
        )}

        {/* Products */}
        {budgetProducts.length === 0 && !showForm ? (
          <EmptyBudget onAdd={() => setShowForm(true)} />
        ) : (
          <div className="flex flex-col gap-3 w-full min-w-0">
            {budgetProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                clientColor={clientColor}
                isSelected={selectedProduct?.id === product.id}
                onClick={() => onSelectProduct?.(selectedProduct?.id === product.id ? null : product)}
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
    <div className="min-w-0">
      <p className="text-[10px] sm:text-[11px] text-zinc-500 dark:text-zinc-600 uppercase tracking-wider mb-1 truncate">{label}</p>
      <p className={`text-base sm:text-lg font-semibold truncate ${highlight ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}>
        {value}
      </p>
    </div>
  );
}

function ProductCard({
  product,
  clientColor,
  onClick,
  isSelected,
}: {
  product: BudgetProduct;
  clientColor: string;
  onClick?: () => void;
  isSelected?: boolean;
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

  // Montant encaissé (acompte + avancements + solde) — le devis n'est pas un encaissement
  const total = product.devis?.amount ?? product.totalAmount;
  const paid = [product.acompte, ...(product.avancements ?? []), product.solde].reduce(
    (s, stage) => s + (stage?.status === "paid" ? (stage.amount ?? 0) : 0),
    0
  );
  const isSoldé = total > 0 && paid >= total;
  const sentCount = fixedStages.filter((s) => s.stage?.status === "sent").length;

  return (
    <Surface
      variant="interactive"
      as={onClick ? "button" : "div"}
      onClick={onClick}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e: React.KeyboardEvent) => e.key === "Enter" && onClick() : undefined}
      className={cn(
        "w-full text-left",
        isSelected && "border-zinc-400 dark:border-zinc-600 ring-1 ring-zinc-300 dark:ring-zinc-600",
        onClick && "cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-700 hover:shadow-md active:scale-[0.99]"
      )}
      title={onClick ? "Cliquer pour ouvrir" : undefined}
    >
      {/* Product header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 truncate">
            {product.name}
          </span>
          {isSoldé && (
            <Badge variant="success" size="xs">Soldé</Badge>
          )}
          {sentCount > 0 && !isSoldé && (
            <Badge variant="warning" size="xs">En attente</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              {(product.devis?.amount ?? product.totalAmount).toLocaleString("fr-FR")} €
            </span>
            {(product.subcontracts?.length ?? 0) > 0 && (() => {
              const st = (product.subcontracts ?? []).reduce((s, sub) => s + (sub.amount ?? 0), 0);
              const net = (product.devis?.amount ?? product.totalAmount) - st;
              return (
                <>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-600">
                    dont {st.toLocaleString("fr-FR")} € sous-traitance
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    À toucher : {net.toLocaleString("fr-FR")} €
                  </span>
                </>
              );
            })()}
          </div>
          {onClick && (
            <svg className="w-4 h-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
        </div>
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
        {(product.subcontracts?.length ?? 0) > 0 && (
          <div className="px-3 sm:px-4 py-2.5">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-zinc-500" />
              <span className="text-xs text-zinc-500 dark:text-zinc-600 shrink-0">Sous-traitance</span>
            </div>
            <div className="pl-5 space-y-1">
              {(product.subcontracts ?? []).map((sub, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400 truncate">{sub.freelancerName || "—"}</span>
                  <span className="text-zinc-600 dark:text-zinc-400 shrink-0 ml-2">
                    {(sub.amount ?? 0).toLocaleString("fr-FR")} €
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Surface>
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
  const isDevis = label === "Devis";
  const statusConfig = {
    pending: { dot: "bg-zinc-700", text: "text-zinc-600", label: "En attente" },
    sent: { dot: "bg-yellow-500", text: "text-yellow-500", label: "Envoyé" },
    paid: { dot: "bg-emerald-500", text: "text-emerald-500", label: isDevis ? "Signé ✓" : "Payé ✓" },
  }[stage.status ?? "pending"];

  return (
    <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
      {/* Label */}
      <span className="text-xs text-zinc-500 dark:text-zinc-600 shrink-0 w-16 sm:w-20">{label}</span>
      {/* Amount */}
      <span className="text-xs text-zinc-600 dark:text-zinc-400 flex-1 text-right sm:text-left">
        {stage.amount ? `${stage.amount.toLocaleString("fr-FR")} €` : "—"}
      </span>
      {/* Date — masquée sur mobile */}
      <span className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-600 w-24 text-right">
        {stage.date ?? "—"}
      </span>
      {/* Status */}
      <span className={`text-[11px] font-medium shrink-0 text-right sm:w-20 ${statusConfig.text}`}>
        {statusConfig.label}
      </span>
    </div>
  );
}

function EmptyBudget({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <IconBox size="lg" variant="surface" className="mb-4">
        <span className="text-xl">💳</span>
      </IconBox>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Aucun produit</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-4">
        Ajoute les prestations pour suivre le budget.
      </p>
      <Button variant="secondary" onClick={onAdd}>
        + Ajouter un premier produit
      </Button>
    </div>
  );
}
