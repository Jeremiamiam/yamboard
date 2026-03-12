// ─── Hooks for pages to read from store ─────────────────────────
// Select raw state only (stable refs) — compute derived values in useMemo.
// Avoids "getSnapshot should be cached" infinite loop with Zustand v5 + React 19.

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import {
  getClient,
  getClientProjects,
  getClientDocs,
  getProjectDocs,
  getBudgetProducts,
  getBudgetProductsForClient,
} from "@/lib/store";
import type { Client, Project, Document, BudgetProduct } from "@/lib/types";

const EMPTY_PROJECTS: Project[] = [];
const EMPTY_DOCUMENTS: Document[] = [];
const EMPTY_BUDGET_PRODUCTS: BudgetProduct[] = [];
const EMPTY_BUDGET_MAP: Record<string, BudgetProduct[]> = {};

export function useClient(clientId: string | undefined): Client | undefined {
  const clients = useStore((s) => s.clients);
  const prospects = useStore((s) => s.prospects);
  const archived = useStore((s) => s.archived);
  return useMemo(
    () =>
      clientId
        ? getClient({ clients, prospects, archived }, clientId)
        : undefined,
    [clientId, clients, prospects, archived]
  );
}

export function useClientProjects(clientId: string | undefined): Project[] {
  const projects = useStore((s) => s.projects);
  return useMemo(
    () =>
      clientId
        ? getClientProjects({ projects }, clientId)
        : EMPTY_PROJECTS,
    [clientId, projects]
  );
}

export function useClientDocs(clientId: string | undefined): Document[] {
  const documents = useStore((s) => s.documents);
  return useMemo(
    () =>
      clientId ? getClientDocs({ documents }, clientId) : EMPTY_DOCUMENTS,
    [clientId, documents]
  );
}

export function useProjectDocs(projectId: string | undefined): Document[] {
  const documents = useStore((s) => s.documents);
  return useMemo(
    () =>
      projectId
        ? getProjectDocs({ documents }, projectId)
        : EMPTY_DOCUMENTS,
    [projectId, documents]
  );
}

export function useBudgetProducts(projectId: string | undefined): BudgetProduct[] {
  const budgetProducts = useStore((s) => s.budgetProducts);
  return useMemo(
    () =>
      projectId
        ? getBudgetProducts({ budgetProducts }, projectId)
        : EMPTY_BUDGET_PRODUCTS,
    [projectId, budgetProducts]
  );
}

export function useBudgetProductsForClient(
  clientId: string | undefined
): Record<string, BudgetProduct[]> {
  const projects = useStore((s) => s.projects);
  const budgetProducts = useStore((s) => s.budgetProducts);
  return useMemo(
    () =>
      clientId
        ? getBudgetProductsForClient({ projects, budgetProducts }, clientId)
        : EMPTY_BUDGET_MAP,
    [clientId, projects, budgetProducts]
  );
}

// Reactive hooks (re-render when store changes)
export function useSidebarClients() {
  return useStore((s) => s.clients);
}
export function useSidebarProspects() {
  return useStore((s) => s.prospects);
}
export function useSidebarArchived() {
  return useStore((s) => s.archived);
}
export function useStoreLoaded() {
  return useStore((s) => s.loaded);
}
export function useStoreLoading() {
  return useStore((s) => s.loading);
}
export function useStoreError() {
  return useStore((s) => s.error);
}
