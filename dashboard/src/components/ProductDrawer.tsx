"use client";

import { useEffect, useState, useTransition } from "react";
import { PAYMENT_STAGE_LABEL, type BudgetProduct, type PaymentStage, type Subcontract } from "@/lib/types";
import {
  updatePaymentStageAction,
  setAvancementsAction,
  setSubcontractsAction,
  updateBudgetProductAction,
  deleteBudgetProductAction,
} from "@/lib/store/actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { useStore } from "@/lib/store";

const FIXED_STAGE_KEYS = ["devis", "acompte", "solde"] as const;
type FixedStageKey = typeof FIXED_STAGE_KEYS[number];
const STATUS_CYCLE: PaymentStage["status"][] = ["pending", "sent", "paid"];

export function ProductDrawer({
  product,
  onClose,
  clientColor,
}: {
  product: BudgetProduct | null;
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

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
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
}: {
  product: BudgetProduct;
  onClose: () => void;
  clientColor?: string;
}) {
  const liveProduct = useStore((s) => s.budgetProducts.find((p) => p.id === product.id)) ?? product;

  const [editingHeader, setEditingHeader] = useState(false);
  const [editName, setEditName] = useState(liveProduct.name);
  const [editAmount, setEditAmount] = useState(String(liveProduct.totalAmount));
  const [isPending, startTransition] = useTransition();

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
    <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
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
          <button
            onClick={() => { setEditName(liveProduct.name); setEditAmount(String(liveProduct.totalAmount)); setEditingHeader(true); }}
            className="flex-1 text-left group"
          >
            <h2 className="text-base font-semibold text-zinc-900 dark:text-white group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              {liveProduct.name}
              <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity">✏</span>
            </h2>
            <p className="text-sm text-zinc-500 mt-0.5">{liveProduct.totalAmount.toLocaleString("fr-FR")} €</p>
          </button>
        )}
        <div className="flex items-center gap-2 shrink-0">
          <ConfirmButton
            onConfirm={handleDelete}
            confirmLabel="Supprimer ?"
            className="px-2 py-1 rounded text-xs text-zinc-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors disabled:opacity-40"
            disabled={isPending}
          >
            🗑
          </ConfirmButton>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-1">
          Étapes de paiement
        </p>

        {!hasAnyStage && (
          <p className="text-sm text-zinc-500 dark:text-zinc-600 py-4 text-center">
            Aucune étape — ajoute-en ci-dessous.
          </p>
        )}

        {/* Fixed stages: devis, acompte, solde */}
        {FIXED_STAGE_KEYS.filter((k) => liveProduct[k] != null).map((key) => (
          <FixedStageRow
            key={key}
            stageKey={key}
            stage={liveProduct[key]!}
            productId={product.id}
            clientColor={clientColor}
          />
        ))}

        {/* Avancements — N rows */}
        <AvancementsSection
          productId={product.id}
          avancements={liveProduct.avancements ?? []}
          clientColor={clientColor}
        />

        {/* Add missing fixed stages */}
        {missingFixed.length > 0 && (
          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-2">
              Ajouter une étape
            </p>
            <div className="flex flex-wrap gap-2">
              {missingFixed.map((key) => (
                <button
                  key={key}
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() =>
                      void updatePaymentStageAction(product.id, key, { status: "pending" })
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors disabled:opacity-40"
                >
                  + {PAYMENT_STAGE_LABEL[key]}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sous-traitance */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-2">
            Sous-traitance
          </p>
          <SubcontractsSection
            productId={product.id}
            subcontracts={liveProduct.subcontracts ?? []}
          />
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
}: {
  productId: string;
  avancements: PaymentStage[];
  clientColor?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function addAvancement() {
    startTransition(() =>
      void setAvancementsAction(productId, [...avancements, { status: "pending" }])
    );
  }

  function updateAt(index: number, patch: Partial<PaymentStage>) {
    const next = avancements.map((av, i) => (i === index ? { ...av, ...patch } : av));
    startTransition(() => void setAvancementsAction(productId, next));
  }

  function removeAt(index: number) {
    const next = avancements.filter((_, i) => i !== index);
    startTransition(() => void setAvancementsAction(productId, next));
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
        />
      ))}
      <button
        onClick={addAvancement}
        disabled={isPending}
        className="w-full px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors disabled:opacity-40"
      >
        + Avancement
      </button>
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
}: {
  index: number;
  total: number;
  stage: PaymentStage;
  onUpdate: (patch: Partial<PaymentStage>) => void;
  onRemove: () => void;
  isPending: boolean;
  clientColor?: string;
}) {
  const [editAmount, setEditAmount] = useState(stage.amount != null ? String(stage.amount) : "");
  const [editDate, setEditDate] = useState(stage.date ?? "");

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
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
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
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-50 ${
            stage.status === "paid"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : stage.status === "sent"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
          }`}
          title="Cliquer pour changer le statut"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
          <input
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
        <input
          type="text"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          onBlur={() => { if (editDate !== (stage.date ?? "")) onUpdate({ date: editDate || undefined }); }}
          onKeyDown={(e) => { if (e.key === "Enter") { onUpdate({ date: editDate || undefined }); (e.target as HTMLInputElement).blur(); } }}
          placeholder="Date (ex: 15 jan.)"
          disabled={isPending}
          className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors disabled:opacity-50"
        />
      </div>

      {stage.status === "paid" && stage.amount && (
        <div className="h-0.5 rounded-full" style={{ background: clientColor ?? "#10b981" }} />
      )}
    </div>
  );
}

// ─── Fixed stage row (devis / acompte / solde) ────────────────

function FixedStageRow({
  stageKey,
  stage,
  productId,
  clientColor,
}: {
  stageKey: FixedStageKey;
  stage: PaymentStage;
  productId: string;
  clientColor?: string;
}) {
  const [editAmount, setEditAmount] = useState(stage.amount != null ? String(stage.amount) : "");
  const [editDate, setEditDate] = useState(stage.date ?? "");
  const [isPending, startTransition] = useTransition();

  function save(patch: Partial<PaymentStage>) {
    startTransition(() =>
      void updatePaymentStageAction(productId, stageKey, { ...stage, ...patch })
    );
  }

  function cycleStatus() {
    const idx = STATUS_CYCLE.indexOf(stage.status);
    save({ status: STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length] });
  }

  const statusConfig = {
    pending: { dot: "bg-zinc-400", label: "En attente" },
    sent: { dot: "bg-yellow-500", label: "Envoyé" },
    paid: { dot: "bg-emerald-500", label: "Payé ✓" },
  }[stage.status];

  return (
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {PAYMENT_STAGE_LABEL[stageKey]}
        </span>
        <button
          onClick={cycleStatus}
          disabled={isPending}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-50 ${
            stage.status === "paid"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : stage.status === "sent"
              ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
          }`}
          title="Cliquer pour changer le statut"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 focus-within:border-zinc-400 dark:focus-within:border-zinc-500 transition-colors">
          <input
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
        <input
          type="text"
          value={editDate}
          onChange={(e) => setEditDate(e.target.value)}
          onBlur={() => { if (editDate !== (stage.date ?? "")) save({ date: editDate || undefined }); }}
          onKeyDown={(e) => { if (e.key === "Enter") { save({ date: editDate || undefined }); (e.target as HTMLInputElement).blur(); } }}
          placeholder="Date (ex: 15 jan.)"
          disabled={isPending}
          className="flex-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors disabled:opacity-50"
        />
      </div>

      {stage.status === "paid" && stage.amount && (
        <div className="h-0.5 rounded-full" style={{ background: clientColor ?? "#10b981" }} />
      )}
    </div>
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
      <button
        onClick={add}
        disabled={isPending}
        className="w-full px-3 py-1.5 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-600 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-400 transition-colors disabled:opacity-40"
      >
        + Sous-traitance
      </button>
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
    <div className="rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
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
          className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all disabled:opacity-50 ${
            sub.status === "paid"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
              : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-500"
          }`}
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
    </div>
  );
}
