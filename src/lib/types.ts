// ─── Types ───────────────────────────────────────────────────
// Shared types and UI config maps.
// No runtime mock data arrays — those stay in mock.ts until plan 04-05.
// No `import 'server-only'` — used by both server and client components.

export type ClientCategory = "client" | "prospect" | "archived";
export type ClientStatus = "active" | "draft" | "paused";
export type ProjectType = "brand" | "site" | "campaign" | "social" | "other";

export type Client = {
  id: string;
  name: string;
  industry: string;
  category: ClientCategory;
  status: ClientStatus;
  contact: { name: string; role: string; email: string; phone?: string };
  color: string;
  since?: string;   // date début relation
  logoPath?: string; // chemin Storage pour logo SVG (remplace les initiales)
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  type: ProjectType;
  description: string;
  lastActivity: string;
  startDate: string;
  potentialAmount?: number;  // montant potentiel (devis en cours, prospects)
};

// Documents — clientId toujours présent, projectId optionnel (absent = doc "global" client)
export type Document = {
  id: string;
  clientId: string;
  projectId?: string;  // absent = doc niveau client (plateforme de marque, etc.)
  name: string;
  type: "brief" | "platform" | "campaign" | "site" | "other";
  updatedAt: string;
  size: string;
  content?: string;    // note libre — texte collé/tapé directement, injecté dans le contexte agent
  storagePath?: string; // chemin Storage Supabase — défini uniquement pour les PDFs uploadés
  extractionStatus?: 'processing' | 'done' | 'failed' | null; // PDF: en cours / extrait / échec
  isPinned?: boolean; // épinglé au niveau client (contexte chat)
};

export type Conversation = {
  id: string;
  clientId: string;
  projectId?: string;  // absent = conversation globale client
  title: string;
  preview: string;
  date: string;
  messageCount: number;
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

// Budget — produits/phases par projet avec suivi des paiements
export type PaymentStage = {
  amount?: number;
  date?: string;
  status: "pending" | "sent" | "paid";
};

export type Subcontract = {
  freelancerName: string;
  amount?: number;
  status: "pending" | "paid";
};

export type BudgetProduct = {
  id: string;
  projectId: string;
  name: string;
  totalAmount: number; // conservé pour compat DB — l'affichage utilise devis.amount
  devis?: PaymentStage;
  acompte?: PaymentStage;
  avancements?: PaymentStage[]; // tableau — autant de factures d'avancement que souhaité
  solde?: PaymentStage;
  subcontracts?: Subcontract[]; // sous-traitance freelances
};

// ─── UI config maps ───────────────────────────────────────────

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  brand: "Marque",
  site: "Site web",
  campaign: "Campagne",
  social: "Social",
  other: "Autre",
};

export const PAYMENT_STAGE_LABEL: Record<"devis" | "acompte" | "solde", string> = {
  devis: "Devis",
  acompte: "Acompte",
  solde: "Solde",
};
