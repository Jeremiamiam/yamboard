// ─── Types ───────────────────────────────────────────────────
// Shared types and UI config maps.
// No runtime mock data arrays — those stay in mock.ts until plan 04-05.
// No `import 'server-only'` — used by both server and client components.

export type ClientCategory = "client" | "prospect" | "archived";
export type ClientStatus = "active" | "draft" | "paused";
export type ProjectType = "brand" | "site" | "campaign" | "social" | "other";
export type ProjectStatus = "active" | "done" | "paused" | "draft";

export type Client = {
  id: string;
  name: string;
  industry: string;
  category: ClientCategory;
  status: ClientStatus;
  contact: { name: string; role: string; email: string; phone?: string };
  color: string;
  since?: string;   // date début relation
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  description: string;
  progress: number;     // phases terminées
  totalPhases: number;
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

export type BudgetProduct = {
  id: string;
  projectId: string;
  name: string;
  totalAmount: number;
  devis?: PaymentStage;
  acompte?: PaymentStage;
  avancements?: PaymentStage[]; // tableau — autant de factures d'avancement que souhaité
  solde?: PaymentStage;
};

// ─── UI config maps ───────────────────────────────────────────

export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  brand: "Marque",
  site: "Site web",
  campaign: "Campagne",
  social: "Social",
  other: "Autre",
};

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; dot: string }
> = {
  active: { label: "En cours", dot: "bg-blue-500" },
  done: { label: "Terminé", dot: "bg-emerald-500" },
  paused: { label: "En pause", dot: "bg-yellow-500" },
  draft: { label: "À démarrer", dot: "bg-zinc-600" },
};

export const DOC_TYPE_LABEL: Record<Document["type"], string> = {
  brief: "Contre-brief",
  platform: "Plateforme",
  campaign: "Campagne",
  site: "Site web",
  other: "Document",
};

export const DOC_TYPE_COLOR: Record<Document["type"], string> = {
  brief: "text-orange-400",
  platform: "text-blue-400",
  campaign: "text-purple-400",
  site: "text-cyan-400",
  other: "text-zinc-400",
};

export const PAYMENT_STAGE_LABEL: Record<"devis" | "acompte" | "solde", string> = {
  devis: "Devis",
  acompte: "Acompte",
  solde: "Solde",
};
