"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { PAYMENT_STAGE_LABEL, type BudgetProduct, type PaymentStage, type Subcontract } from "@/lib/types";
import {
  updatePaymentStageAction,
  removePaymentStageAction,
  setAvancementsAction,
  setSubcontractsAction,
  updateBudgetProductAction,
  deleteBudgetProductAction,
  moveProductAction,
  extractProductToNewMissionAction,
} from "@/lib/store/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { EditMenu } from "@/components/EditMenu";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Surface } from "@/components/ui/Surface";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Progress } from "@/components/ui/Progress";
import { DateInput } from "@/components/ui/DateInput";
import { Backdrop } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const FIXED_STAGE_KEYS = ["devis", "acompte", "solde"] as const;
type FixedStageKey = typeof FIXED_STAGE_KEYS[number];
const STATUS_CYCLE: PaymentStage["status"][] = ["pending", "sent", "paid"];

export function ProductDrawer({
  product,
  onClose,
  clientColor,
  variant = "drawer",
}: {
  product: BudgetProduct | null;
  onClose: () => void;
  clientColor?: string;
  variant?: "drawer" | "inline";
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!product) return null;

  if (variant === "inline") {
    return (
      <ProductDrawerContent
        key={product.id}
        product={product}
        onClose={onClose}
        clientColor={clientColor}
        inline
      />
    );
  }

  return (
    <>
      <Backdrop onClose={onClose} className="bg-black/60" />
      <ProductDrawerContent
        key={product.id}
        product={product}
        onClose={onClose}
        clientColor={clientColor}
      />
    </>
  );
}

// ─── Inner content (keyed so state resets on product change) ──

function ProductDrawerContent({
  product,
  onClose,
  clientColor,
  inline,
}: {
  product: BudgetProduct;
  onClose: () => void;
  clientColor?: string;
  inline?: boolean;
}) {
  const liveProduct = useStore((s) => s.budgetProducts.find((p) => p.id === product.id)) ?? product;

  const [editingHeader, setEditingHeader] = useState(false);
  const [editName, setEditName] = useState(liveProduct.name);
  const [editAmount, setEditAmount] = useState(String(liveProduct.totalAmount));
  const [isPending, startTransition] = useTransition();
  const [autoFocusStage, setAutoFocusStage] = useState<string | null>(null);

  function saveHeader() {
    const name = editName.trim();
    const amount = parseFloat(editAmount);
    if (!name || isNaN(amount)) return;
    setEditingHeader(false);
    startTransition(() =>
      void updateBudgetProductAction(product.id, {
        name: name !== liveProduct.name ? name : undefined,
        totalAmount: amount !== liveProduct.totalAmount ? amount : undefined,
      })
    );
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteBudgetProductAction(product.id);
      onClose();
    });
  }

  const missingFixed = FIXED_STAGE_KEYS.filter((k) => liveProduct[k] == null);
  const hasAnyStage =
    FIXED_STAGE_KEYS.some((k) => liveProduct[k] != null) ||
    (liveProduct.avancements?.length ?? 0) > 0;

  return (
    <div
      className={`flex flex-col bg-white dark:bg-zinc-950 overflow-hidden ${
        inline
          ? "flex-1 min-h-0 border-l border-zinc-200 dark:border-zinc-800"
          : "fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] border-l border-zinc-200 dark:border-zinc-800 shadow-2xl"
      }`}
    >
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
        {editingHeader ? (
          <div className="flex-1 space-y-2 mr-3">
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") saveHeader(); if (e.key === "Escape") setEditingHeader(false); }}
              className="w-full text-base font-semibold bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none pb-0.5 text-zinc-900 dark:text-white"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveHeader(); }}
                className="w-28 text-sm bg-transparent border-b border-zinc-300 dark:border-zinc-600 outline-none pb-0.5 text-zinc-600 dark:text-zinc-400 text-right"
              />
              <span className="text-sm text-zinc-500">€</span>
              <button onClick={saveHeader} className="ml-2 text-xs font-medium text-emerald-600 hover:text-emerald-500">OK</button>
              <button onClick={() => setEditingHeader(false)} className="text-xs text-zinc-400 hover:text-zinc-600">✕</button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-white truncate">
                {liveProduct.name}
              </h2>
              {(() => {
                const productTotal = liveProduct.devis?.amount ?? liveProduct.totalAmount;
                const st = (liveProduct.subcontracts ?? []).reduce((s, sub) => s + (sub.amount ?? 0), 0);
                const net = productTotal - st;
                return (
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {productTotal.toLocaleString("fr-FR")} €
                    {st > 0 && (
                      <>
                        {" "}
                        <span className="text-zinc-400 dark:text-zinc-600">(dont {st.toLocaleString("fr-FR")} € sous-traitance)</span>
                        {" · "}
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">À toucher : {net.toLocaleString("fr-FR")} €</span>
                      </>
                    )}
                  </p>
                );
              })()}
            </div>
            <EditMenu
              onRename={() => { setEditName(liveProduct.name); setEditAmount(String(liveProduct.totalAmount)); setEditingHeader(true); }}
              onDelete={handleDelete}
              confirmDeleteLabel="Supprimer ce produit ?"
              disabled={isPending}
            />
          </div>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="icon_md"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        <SectionHeader level="label" className="mb-1">
          Étapes de paiement
        </SectionHeader>

        {!hasAnyStage && (
          <p className="text-sm text-zinc-500 dark:text-zinc-600 py-4 text-center">
            Aucune étape — ajoute-en ci-dessous.
          </p>
        )}

        {/* Ordre logique : devis → acompte → avancements → solde */}
        {liveProduct.devis != null && (
          <FixedStageRow
            key="devis"
            stageKey="devis"
            stage={liveProduct.devis}
            productId={product.id}
            clientColor={clientColor}
            autoFocusAmount={autoFocusStage === "devis"}
            onAutoFocused={() => setAutoFocusStage(null)}
            onRemove={() =>
              startTransition(() => void removePaymentStageAction(product.id, "devis"))
            }
          />
        )}
        {liveProduct.acompte != null && (
          <FixedStageRow
            key="acompte"
            stageKey="acompte"
            stage={liveProduct.acompte}
            productId={product.id}
            clientColor={clientColor}
            autoFocusAmount={autoFocusStage === "acompte"}
            onAutoFocused={() => setAutoFocusStage(null)}
            onRemove={() =>
              startTransition(() => void removePaymentStageAction(product.id, "acompte"))
            }
          />
        )}
        <AvancementsSection
          productId={product.id}
          avancements={liveProduct.avancements ?? []}
          clientColor={clientColor}
          autoFocusLast={autoFocusStage === "avancement"}
          onAutoFocused={() => setAutoFocusStage(null)}
        />
        {liveProduct.solde != null && (
          <FixedStageRow
            key="solde"
            stageKey="solde"
            stage={liveProduct.solde}
            productId={product.id}
            clientColor={clientColor}
            autoFocusAmount={autoFocusStage === "solde"}
            onAutoFocused={() => setAutoFocusStage(null)}
            onRemove={() =>
              startTransition(() => void removePaymentStageAction(product.id, "solde"))
            }
          />
        )}

        {/* Ajouter une étape — ordre : Devis, Acompte, Avancement, Solde */}
        <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <SectionHeader level="label" className="mb-2">
              Ajouter une étape
            </SectionHeader>
            <div className="flex flex-wrap gap-2">
              {missingFixed.includes("devis") && (
                <Button
                  variant="dashed"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    setAutoFocusStage("devis");
                    startTransition(() =>
                      void updatePaymentStageAction(product.id, "devis", { status: "pending" })
                    );
                  }}
                >
                  + Devis
                </Button>
              )}
              {missingFixed.includes("acompte") && (
                <Button
                  variant="dashed"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    setAutoFocusStage("acompte");
                    startTransition(() =>
                      void updatePaymentStageAction(product.id, "acompte", { status: "pending" })
                    );
                  }}
                >
                  + Acompte
                </Button>
              )}
              <Button
                variant="dashed"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setAutoFocusStage("avancement");
                  startTransition(() =>
                    void setAvancementsAction(product.id, [
                      ...(liveProduct.avancements ?? []),
                      { status: "pending" },
                    ])
                  );
                }}
              >
                + Avancement
              </Button>
              {missingFixed.includes("solde") && (
                <Button
                  variant="dashed"
                  size="sm"
                  disabled={isPending}
                  onClick={() => {
                    setAutoFocusStage("solde");
                    startTransition(() =>
                      void updatePaymentStageAction(product.id, "solde", { status: "pending" })
                    );
                  }}
                >
                  + Solde
                </Button>
              )}
            </div>
          </div>

        {/* Sous-traitance */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <SectionHeader level="label" className="mb-2">
            Sous-traitance
          </SectionHeader>
          <SubcontractsSection
            productId={product.id}
            subcontracts={liveProduct.subcontracts ?? []}
          />
        </div>

        {/* Déplacer vers... */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <MoveProductSection productId={product.id} />
        </div>
      </div>
    </div>
  );
}

// ─── Avancements section (dynamic list) ───────────────────────

function AvancementsSection({
  productId,
  avancements,
  clientColor,
  autoFocusLast,
  onAutoFocused,
}: {
  productId: string;
  avancements: PaymentStage[];
  clientColor?: string;
  autoFocusLast?: boolean;
  onAutoFocused?: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  function updateAt(index: number, patch: Partial<PaymentStage>) {
    const next = avancements.map((av, i) => (i === index ? { ...av, ...patch } : av));
    startTransition(() => void setAvancementsAction(productId, next));
  }

  function removeAt(index: number) {
    const next = avancements.filter((_, i) => i !== index);
    startTransition(async () => {
      const result = await setAvancementsAction(productId, next);
      if (!result.error) toast.success("Avancement supprimé");
    });
  }

  return (
    <>
      {avancements.map((av, i) => (
        <AvancementRow
          key={i}
          index={i}
          total={avancements.length}
          stage={av}
          onUpdate={(patch) => updateAt(i, patch)}
          onRemove={() => removeAt(i)}
          isPending={isPending}
          clientColor={clientColor}
          autoFocusAmount={autoFocusLast && i === avancements.length - 1}
          onAutoFocused={onAutoFocused}
        />
      ))}
    </>
  );
}

// ─── Single avancement row ─────────────────────────────────────

function AvancementRow({
  index,
  total,
  stage,
  onUpdate,
  onRemove,
  isPending,
  clientColor,
  autoFocusAmount,
  onAutoFocused,
}: {
  index: number;
  total: number;
  stage: PaymentStage;
  onUpdate: (patch: Partial<PaymentStage>) => void;
  onRemove: () => void;
  isPending: boolean;
  clientColor?: string;
  autoFocusAmount?: boolean;
  onAutoFocused?: () => void;
}) {
  const amountRef = useRef<HTMLInputElement>(null);
  const [editAmount, setEditAmount] = useState(stage.amount != null ? String(stage.amount) : "");

  useEffect(() => {
    if (autoFocusAmount) {
      requestAnimationFrame(() => {
        amountRef.current?.focus();
        amountRef.current?.select();
      });
      onAutoFocused?.();
    }
  }, [autoFocusAmount, onAutoFocused]);

  const label = total > 1 ? `Avancement ${index + 1}` : "Avancement";

  function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(stage.status);
    onUpdate({ status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
  }

  const statusConfig = {
    pending: { dot: "bg-zinc-400", label: "En attente" },
    sent: { dot: "bg-yellow-500", label: "Envoyé" },
    paid: { dot: "bg-emerald-500", label: "Payé ✓" },
  }[stage.status];

  return (
    <Surface variant="muted" padding="sm" className="space-y-3 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{label}</span>
          <ConfirmButton
            onConfirm={onRemove}
            confirmLabel="Retirer ?"
            className="text-[11px] text-zinc-400 hover:text-red-500 transition-colors px-1 disabled:opacity-40"
            disabled={isPending}
          >
            ✕
          </ConfirmButton>
        </div>
        <button
          onClick={cycleStatus}
          disabled={isPending}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-50",
            stage.status === "paid"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : stage.status === "sent"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
          )}
          title="Cliquer pour changer le statut"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
          <input
            ref={amountRef}
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            onBlur={() => {
              const v = parseFloat(editAmount);
              if (!isNaN(v) && v !== stage.amount) onUpdate({ amount: v });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = parseFloat(editAmount);
                if (!isNaN(v)) onUpdate({ amount: v });
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Montant"
            disabled={isPending}
            className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none text-right placeholder-zinc-400 dark:placeholder-zinc-600 disabled:opacity-50"
          />
          <span className="text-sm text-zinc-400 dark:text-zinc-600 ml-1 shrink-0">€</span>
        </div>
        <DateInput
          value={stage.date}
          onChange={(d) => onUpdate({ date: d })}
          disabled={isPending}
          className="flex-1"
        />
      </div>

      {stage.status === "paid" && stage.amount && (
        <Progress value={100} size="sm" color={clientColor ?? "#10b981"} className="h-0.5" />
      )}
    </Surface>
  );
}

// ─── Fixed stage row (devis / acompte / solde) ────────────────

function FixedStageRow({
  stageKey,
  stage,
  productId,
  clientColor,
  onRemove,
  autoFocusAmount,
  onAutoFocused,
}: {
  stageKey: FixedStageKey;
  stage: PaymentStage;
  productId: string;
  clientColor?: string;
  onRemove?: () => void;
  autoFocusAmount?: boolean;
  onAutoFocused?: () => void;
}) {
  const amountRef = useRef<HTMLInputElement>(null);
  const [editAmount, setEditAmount] = useState(stage.amount != null ? String(stage.amount) : "");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (autoFocusAmount) {
      requestAnimationFrame(() => {
        amountRef.current?.focus();
        amountRef.current?.select();
      });
      onAutoFocused?.();
    }
  }, [autoFocusAmount, onAutoFocused]);

  function save(patch: Partial<PaymentStage>) {
    startTransition(() =>
      void updatePaymentStageAction(productId, stageKey, { ...stage, ...patch })
    );
  }

  function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(stage.status);
    save({ status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
  }

  const isDevis = stageKey === "devis";
  const statusConfig = {
    pending: { dot: "bg-zinc-400", label: "En attente" },
    sent: { dot: "bg-yellow-500", label: "Envoyé" },
    paid: { dot: "bg-emerald-500", label: isDevis ? "Signé ✓" : "Payé ✓" },
  }[stage.status];

  return (
    <Surface variant="muted" padding="sm" className="space-y-3 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {PAYMENT_STAGE_LABEL[stageKey]}
          </span>
          {onRemove && (
            <ConfirmButton
              onConfirm={onRemove}
              confirmLabel="Retirer cette étape ?"
              className="text-[11px] text-zinc-400 hover:text-red-500 transition-colors px-1 disabled:opacity-40"
              disabled={isPending}
            >
              ✕
            </ConfirmButton>
          )}
        </div>
        <button
          onClick={cycleStatus}
          disabled={isPending}
          className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-50",
            stage.status === "paid"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : stage.status === "sent"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
          )}
          title="Cliquer pour changer le statut"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
          <input
            ref={amountRef}
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            onBlur={() => {
              const v = parseFloat(editAmount);
              if (!isNaN(v) && v !== stage.amount) save({ amount: v });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const v = parseFloat(editAmount);
                if (!isNaN(v)) save({ amount: v });
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Montant"
            disabled={isPending}
            className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none text-right placeholder-zinc-400 dark:placeholder-zinc-600 disabled:opacity-50"
          />
          <span className="text-sm text-zinc-400 dark:text-zinc-600 ml-1 shrink-0">€</span>
        </div>
        <DateInput
          value={stage.date}
          onChange={(d) => save({ date: d })}
          disabled={isPending}
          className="flex-1"
        />
      </div>

      {stage.status === "paid" && stage.amount && (
        <Progress value={100} size="sm" color={clientColor ?? "#10b981"} className="h-0.5" />
      )}
    </Surface>
  );
}

// ─── Sous-traitance section ────────────────────────────────────

function SubcontractsSection({
  productId,
  subcontracts,
}: {
  productId: string;
  subcontracts: Subcontract[];
}) {
  const [isPending, startTransition] = useTransition();

  function add() {
    startTransition(() =>
      void setSubcontractsAction(productId, [
        ...subcontracts,
        { freelancerName: "", status: "pending" },
      ])
    );
  }

  function updateAt(index: number, patch: Partial<Subcontract>) {
    const next = subcontracts.map((s, i) => (i === index ? { ...s, ...patch } : s));
    startTransition(() => void setSubcontractsAction(productId, next));
  }

  function removeAt(index: number) {
    const next = subcontracts.filter((_, i) => i !== index);
    startTransition(() => void setSubcontractsAction(productId, next));
  }

  return (
    <div className="space-y-2">
      {subcontracts.map((sub, i) => (
        <SubcontractRow
          key={i}
          sub={sub}
          onUpdate={(patch) => updateAt(i, patch)}
          onRemove={() => removeAt(i)}
          isPending={isPending}
        />
      ))}
      <Button
        variant="dashed"
        size="sm"
        className="w-full"
        onClick={add}
        disabled={isPending}
      >
        + Sous-traitance
      </Button>
    </div>
  );
}

function SubcontractRow({
  sub,
  onUpdate,
  onRemove,
  isPending,
}: {
  sub: Subcontract;
  onUpdate: (patch: Partial<Subcontract>) => void;
  onRemove: () => void;
  isPending: boolean;
}) {
  const [editName, setEditName] = useState(sub.freelancerName);
  const [editAmount, setEditAmount] = useState(sub.amount != null ? String(sub.amount) : "");

  function toggleStatus() {
    onUpdate({ status: sub.status === "paid" ? "pending" : "paid" });
  }

  return (
    <Surface variant="muted" padding="sm" className="space-y-2 bg-zinc-50 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <ConfirmButton
            onConfirm={onRemove}
            confirmLabel="Retirer ?"
            className="text-[11px] text-zinc-400 hover:text-red-500 transition-colors px-1 shrink-0 disabled:opacity-40"
            disabled={isPending}
          >
            ✕
          </ConfirmButton>
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={() => {
              if (editName !== sub.freelancerName) onUpdate({ freelancerName: editName });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onUpdate({ freelancerName: editName });
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Nom du freelance…"
            disabled={isPending}
            className="flex-1 min-w-0 bg-transparent border-b border-zinc-300 dark:border-zinc-700 outline-none text-xs text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 pb-0.5 disabled:opacity-50"
          />
        </div>
        <button
          onClick={toggleStatus}
          disabled={isPending}
          className={cn(
            "shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-50",
            sub.status === "paid"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
          )}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${sub.status === "paid" ? "bg-emerald-500" : "bg-zinc-400"}`} />
          {sub.status === "paid" ? "Payé ✓" : "En attente"}
        </button>
      </div>

      <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
        <input
          type="number"
          value={editAmount}
          onChange={(e) => setEditAmount(e.target.value)}
          onBlur={() => {
            const v = parseFloat(editAmount);
            if (!isNaN(v) && v !== sub.amount) onUpdate({ amount: v });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const v = parseFloat(editAmount);
              if (!isNaN(v)) onUpdate({ amount: v });
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Montant payé au freelance"
          disabled={isPending}
          className="flex-1 bg-transparent text-sm text-zinc-700 dark:text-zinc-300 outline-none text-right placeholder-zinc-400 dark:placeholder-zinc-600 disabled:opacity-50"
        />
        <span className="text-sm text-zinc-400 dark:text-zinc-600 ml-1 shrink-0">€</span>
      </div>
    </Surface>
  );
}

// ─── Move product section ─────────────────────────────────────────

function MoveProductSection({ productId }: { productId: string }) {
  const product = useStore((s) => s.budgetProducts.find((p) => p.id === productId));
  const projects = useStore((s) => s.projects);

  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!product) return null;

  // Find the client that owns this product's project
  const currentProject = projects.find((p) => p.id === product.projectId);
  if (!currentProject) return null;

  const clientId = currentProject.clientId;
  const siblingProjects = projects.filter(
    (p) => p.clientId === clientId && p.id !== product.projectId
  );

  function handleMove(targetProjectId: string) {
    startTransition(async () => {
      await moveProductAction(productId, targetProjectId);
      setOpen(false);
    });
  }

  function handleExtract() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      await extractProductToNewMissionAction(productId, clientId, name);
      setOpen(false);
      setNewName("");
    });
  }

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-zinc-500 dark:text-zinc-500"
        onClick={() => setOpen(true)}
      >
        Déplacer vers une autre mission…
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <SectionHeader level="label">Déplacer vers…</SectionHeader>

      {/* Existing missions */}
      {siblingProjects.length > 0 && (
        <div className="space-y-1">
          {siblingProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => handleMove(p.id)}
              disabled={isPending}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {/* New mission */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleExtract(); if (e.key === "Escape") { setOpen(false); setNewName(""); } }}
          placeholder="Nouvelle mission…"
          autoFocus
          disabled={isPending}
          className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors disabled:opacity-50"
        />
        <Button
          variant="primary"
          size="sm"
          onClick={handleExtract}
          disabled={!newName.trim() || isPending}
        >
          Créer
        </Button>
      </div>

      <button
        onClick={() => { setOpen(false); setNewName(""); }}
        className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
      >
        Annuler
      </button>
    </div>
  );
}
