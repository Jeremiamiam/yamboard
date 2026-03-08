// ─── Types ───────────────────────────────────────────────────

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
  avancement?: PaymentStage;
  solde?: PaymentStage;
};

// ─── Clients ─────────────────────────────────────────────────
export const CLIENTS: Client[] = [
  // ── Clients actifs
  {
    id: "brutus",
    name: "Brutus.club",
    industry: "E-commerce · Pet",
    category: "client",
    status: "active",
    contact: { name: "Thomas Marin", role: "Fondateur", email: "thomas@brutus.club", phone: "+33 6 12 34 56 78" },
    color: "#f97316",
    since: "Oct 2024",
  },
  {
    id: "bloo-conseil",
    name: "Bloo Conseil",
    industry: "Conseil · Cyber",
    category: "client",
    status: "active",
    contact: { name: "Aurélien Bloo", role: "CEO", email: "a.bloo@bloo-conseil.fr" },
    color: "#3b82f6",
    since: "Sep 2024",
  },
  {
    id: "forge",
    name: "Forge",
    industry: "Wellness · Recovery",
    category: "client",
    status: "active",
    contact: { name: "Marine Leroy", role: "Co-fondatrice", email: "marine@forge-smalo.fr", phone: "+33 6 98 76 54 32" },
    color: "#10b981",
    since: "Nov 2024",
  },
  {
    id: "ornanza",
    name: "Ornanza",
    industry: "Retail · Bijoux",
    category: "client",
    status: "draft",
    contact: { name: "Clara Fontaine", role: "Gérante", email: "clara@ornanza.fr" },
    color: "#a855f7",
    since: "Mar 2025",
  },

  // ── Prospects
  {
    id: "solstice",
    name: "Solstice Studio",
    industry: "Architecture · Intérieur",
    category: "prospect",
    status: "draft",
    contact: { name: "Emma Duval", role: "Directrice", email: "emma@solstice-studio.fr" },
    color: "#eab308",
  },
  {
    id: "kaia",
    name: "Kaïa Foods",
    industry: "Agroalimentaire · Bio",
    category: "prospect",
    status: "draft",
    contact: { name: "Romain Salis", role: "Co-fondateur", email: "r.salis@kaia-foods.fr" },
    color: "#84cc16",
  },

  // ── Archives
  {
    id: "novu",
    name: "Novu Paris",
    industry: "Mode · Prêt-à-porter",
    category: "archived",
    status: "paused",
    contact: { name: "Léa Chen", role: "Directrice artistique", email: "lea@novu-paris.fr" },
    color: "#ec4899",
    since: "Jan 2024",
  },
];

// ─── Projects ────────────────────────────────────────────────
export const PROJECTS: Project[] = [
  // Brutus
  {
    id: "identite-de-marque",
    clientId: "brutus",
    name: "Identité de marque",
    type: "brand",
    status: "done",
    description: "Contre-brief, plateforme de marque, système verbal et brandbook.",
    progress: 5,
    totalPhases: 5,
    lastActivity: "28 nov 2024",
    startDate: "Oct 2024",
  },
  {
    id: "site-web",
    clientId: "brutus",
    name: "Site web",
    type: "site",
    status: "active",
    description: "Architecture, contenus, maquettes et intégration Webflow.",
    progress: 2,
    totalPhases: 4,
    lastActivity: "3 mars 2025",
    startDate: "Jan 2025",
  },
  {
    id: "campagne-lancement",
    clientId: "brutus",
    name: "Campagne de lancement",
    type: "campaign",
    status: "draft",
    description: "Concept créatif et déclinaisons pour le lancement printemps.",
    progress: 0,
    totalPhases: 3,
    lastActivity: "—",
    startDate: "À planifier",
    potentialAmount: 4500,
  },

  // Bloo Conseil
  {
    id: "refonte-marque",
    clientId: "bloo-conseil",
    name: "Refonte de marque",
    type: "brand",
    status: "active",
    description: "10 ans d'existence — repositionnement, plateforme et refonte visuelle.",
    progress: 3,
    totalPhases: 5,
    lastActivity: "22 oct 2024",
    startDate: "Sep 2024",
  },

  // Forge
  {
    id: "plateforme-marque",
    clientId: "forge",
    name: "Plateforme de marque",
    type: "brand",
    status: "active",
    description: "L'Atelier de la Durée — positionnement, essence et manifeste.",
    progress: 2,
    totalPhases: 5,
    lastActivity: "12 déc 2024",
    startDate: "Nov 2024",
  },
  {
    id: "campagne-route-du-rhum",
    clientId: "forge",
    name: "Campagne Route du Rhum",
    type: "campaign",
    status: "draft",
    description: "Campagne d'activation autour de la Route du Rhum 2026.",
    progress: 0,
    totalPhases: 3,
    lastActivity: "—",
    startDate: "2026",
    potentialAmount: 8000,
  },

  // Ornanza
  {
    id: "kickoff-marque",
    clientId: "ornanza",
    name: "Identité de marque",
    type: "brand",
    status: "draft",
    description: "Kick-off et brief stratégique — bijoux intemporels haut de gamme.",
    progress: 0,
    totalPhases: 5,
    lastActivity: "—",
    startDate: "À planifier",
    potentialAmount: 3500,
  },

  // Prospects — Solstice Studio
  {
    id: "refonte-interieur",
    clientId: "solstice",
    name: "Refonte identité",
    type: "brand",
    status: "draft",
    description: "Repositionnement et identité visuelle pour agence d'architecture.",
    progress: 0,
    totalPhases: 4,
    lastActivity: "—",
    startDate: "À planifier",
    potentialAmount: 6000,
  },

  // Prospects — Kaïa Foods
  {
    id: "packaging-bio",
    clientId: "kaia",
    name: "Packaging & marque",
    type: "brand",
    status: "draft",
    description: "Identité visuelle et packaging pour gamme bio.",
    progress: 0,
    totalPhases: 5,
    lastActivity: "—",
    startDate: "À planifier",
    potentialAmount: 5200,
  },
];

// ─── Documents ───────────────────────────────────────────────
// Docs sans projectId = docs "globaux" du client (plateforme de marque, brandbook)
export const DOCUMENTS: Document[] = [
  // ── Docs globaux clients (plateforme de marque = intouchable)
  {
    id: "g1",
    clientId: "brutus",
    name: "Plateforme de marque",
    type: "platform",
    updatedAt: "18 nov 2024",
    size: "87 Ko",
  },
  {
    id: "g2",
    clientId: "brutus",
    name: "Brandbook",
    type: "other",
    updatedAt: "28 nov 2024",
    size: "2.1 Mo",
  },
  {
    id: "g3",
    clientId: "bloo-conseil",
    name: "Plateforme de marque",
    type: "platform",
    updatedAt: "20 oct 2024",
    size: "92 Ko",
  },
  {
    id: "g4",
    clientId: "forge",
    name: "Plateforme de marque v1",
    type: "platform",
    updatedAt: "12 déc 2024",
    size: "79 Ko",
  },

  // ── Docs projets (livrables spécifiques à une mission)
  { id: "d1", clientId: "brutus", projectId: "identite-de-marque", name: "Contre-brief", type: "brief", updatedAt: "10 nov 2024", size: "24 Ko" },

  { id: "d2", clientId: "brutus", projectId: "site-web", name: "Architecture du site", type: "site", updatedAt: "20 jan 2025", size: "52 Ko" },
  { id: "d3", clientId: "brutus", projectId: "site-web", name: "Contenus Home + Boutique", type: "other", updatedAt: "3 mars 2025", size: "38 Ko" },

  { id: "d4", clientId: "bloo-conseil", projectId: "refonte-marque", name: "Brief stratégique", type: "brief", updatedAt: "5 oct 2024", size: "31 Ko" },

  { id: "d5", clientId: "forge", projectId: "plateforme-marque", name: "Contre-brief", type: "brief", updatedAt: "1 déc 2024", size: "28 Ko" },
];

// ─── Conversations ────────────────────────────────────────────
export const CONVERSATIONS: Conversation[] = [
  // Par projet
  { id: "c1", clientId: "brutus", projectId: "identite-de-marque", title: "Session brief stratégique", preview: "On a discuté du positionnement premium vs accessible...", date: "10 nov", messageCount: 24 },
  { id: "c2", clientId: "brutus", projectId: "identite-de-marque", title: "Plateforme — itération 1", preview: "L'essence « Caractère » validée, on affine le manifeste...", date: "18 nov", messageCount: 47 },
  { id: "c3", clientId: "brutus", projectId: "identite-de-marque", title: "Brandbook — révisions finales", preview: "Dernières corrections typographiques avant envoi...", date: "28 nov", messageCount: 12 },

  { id: "c4", clientId: "brutus", projectId: "site-web", title: "Architecture du site", preview: "5 pages, la home met en avant la box du mois...", date: "20 jan", messageCount: 31 },
  { id: "c5", clientId: "brutus", projectId: "site-web", title: "Contenus et copywriting", preview: "On travaille les titres de la page boutique...", date: "3 mars", messageCount: 19 },

  { id: "c6", clientId: "bloo-conseil", projectId: "refonte-marque", title: "Kick-off projet", preview: "10 ans d'existence, refonte de l'image...", date: "5 oct", messageCount: 18 },
  { id: "c7", clientId: "bloo-conseil", projectId: "refonte-marque", title: "Plateforme — angle éthique structurelle", preview: "L'éthique comme contrainte, pas comme valeur...", date: "20 oct", messageCount: 52 },

  { id: "c8", clientId: "forge", projectId: "plateforme-marque", title: "Brief — L'Atelier de la Durée", preview: "Route du Rhum 2026 comme fenêtre de lancement...", date: "1 déc", messageCount: 29 },
  { id: "c9", clientId: "forge", projectId: "plateforme-marque", title: "Plateforme v1 — retours client", preview: "Marine valide l'essence mais demande plus de...", date: "12 déc", messageCount: 34 },

  // Globales client (sans projet)
  { id: "cg1", clientId: "brutus", title: "Point général Brutus", preview: "Discussion sur la roadmap globale et les priorités...", date: "5 mars", messageCount: 8 },
  { id: "cg2", clientId: "bloo-conseil", title: "Suivi relationnel", preview: "Échanges sur la collaboration et les prochaines étapes...", date: "22 oct", messageCount: 12 },
  { id: "cg3", clientId: "forge", title: "Échanges généraux", preview: "Suivi de la relation et des projets en cours...", date: "15 déc", messageCount: 5 },
];

// ─── Mock messages ────────────────────────────────────────────
export const MOCK_MESSAGES: Message[] = [
  { id: "m1", role: "user", content: "On reprend sur la plateforme. J'hésite encore sur l'essence — entre 'Caractère' et 'Mordant'.", timestamp: "14:32" },
  { id: "m2", role: "assistant", content: "Les deux ont une énergie différente. 'Caractère' est plus large, il inclut la sélectivité sans l'agressivité. 'Mordant' est plus tranchant mais risque d'intimider les nouveaux propriétaires. Est-ce que Brutus.club veut être intimidant ou simplement exigeant ?", timestamp: "14:32" },
  { id: "m3", role: "user", content: "Exigeant mais pas condescendant. On veut que les gens se sentent fiers d'y être, pas jugés de ne pas y être.", timestamp: "14:33" },
  { id: "m4", role: "assistant", content: "Alors 'Caractère' est juste. Il y a une dignité dans ce mot qui correspond — avoir du caractère, c'est une qualité qu'on reconnaît et qu'on désire. 'Mordant' créerait une friction à l'entrée. L'essence peut rester **Caractère**, avec la tension : *exigence sans condescendance*.", timestamp: "14:33" },
  { id: "m5", role: "user", content: "Ok validé. On passe au manifeste ?", timestamp: "14:35" },
  { id: "m6", role: "assistant", content: "Oui. Le manifeste doit incarner cette voix — exigeante mais bienveillante. Je te propose une première version :\n\n*Il y a des chiens qui s'assument. Et des propriétaires qui les méritent.*\n*Brutus.club, c'est pour eux.*\n*Pas pour les indécis. Pas pour ceux qui cherchent à faire bonne figure.*\n*Pour ceux qui ont fait un choix — et qui l'assument jusqu'au bout.*", timestamp: "14:35" },
];

// ─── Budget products ──────────────────────────────────────────
export const BUDGET_PRODUCTS: BudgetProduct[] = [
  // Brutus — identité
  {
    id: "bp1",
    projectId: "identite-de-marque",
    name: "Contre-brief",
    totalAmount: 1000,
    devis: { status: "paid", date: "1 oct 2024" },
    acompte: { amount: 500, date: "5 oct 2024", status: "paid" },
    solde: { amount: 500, date: "10 nov 2024", status: "paid" },
  },
  {
    id: "bp2",
    projectId: "identite-de-marque",
    name: "Plateforme de marque",
    totalAmount: 3000,
    devis: { status: "paid", date: "1 oct 2024" },
    acompte: { amount: 1500, date: "5 oct 2024", status: "paid" },
    avancement: { amount: 1000, date: "10 nov 2024", status: "paid" },
    solde: { amount: 500, date: "18 nov 2024", status: "paid" },
  },
  {
    id: "bp3",
    projectId: "identite-de-marque",
    name: "Brandbook",
    totalAmount: 1500,
    devis: { status: "paid", date: "15 oct 2024" },
    acompte: { amount: 750, date: "20 oct 2024", status: "paid" },
    solde: { amount: 750, date: "28 nov 2024", status: "paid" },
  },

  // Brutus — site web
  {
    id: "bp4",
    projectId: "site-web",
    name: "Architecture + contenus",
    totalAmount: 2200,
    devis: { status: "paid", date: "10 jan 2025" },
    acompte: { amount: 1100, date: "15 jan 2025", status: "paid" },
    solde: { amount: 1100, status: "pending" },
  },
  {
    id: "bp5",
    projectId: "site-web",
    name: "Maquettes + intégration Webflow",
    totalAmount: 1800,
    devis: { status: "sent", date: "1 mars 2025" },
    acompte: { amount: 900, status: "pending" },
    solde: { amount: 900, status: "pending" },
  },

  // Bloo
  {
    id: "bp6",
    projectId: "refonte-marque",
    name: "Brief stratégique",
    totalAmount: 1000,
    devis: { status: "paid", date: "1 sep 2024" },
    acompte: { amount: 500, date: "5 sep 2024", status: "paid" },
    solde: { amount: 500, date: "10 oct 2024", status: "paid" },
  },
  {
    id: "bp7",
    projectId: "refonte-marque",
    name: "Plateforme de marque",
    totalAmount: 2500,
    devis: { status: "paid", date: "1 sep 2024" },
    acompte: { amount: 1250, date: "5 sep 2024", status: "paid" },
    avancement: { amount: 750, date: "15 oct 2024", status: "paid" },
    solde: { amount: 500, status: "pending" },
  },
  {
    id: "bp8",
    projectId: "refonte-marque",
    name: "Système visuel",
    totalAmount: 1500,
    devis: { status: "sent", date: "20 oct 2024" },
    acompte: { amount: 750, status: "pending" },
    solde: { amount: 750, status: "pending" },
  },

  // Forge
  {
    id: "bp9",
    projectId: "plateforme-marque",
    name: "Contre-brief",
    totalAmount: 1000,
    devis: { status: "paid", date: "1 nov 2024" },
    acompte: { amount: 500, date: "5 nov 2024", status: "paid" },
    solde: { amount: 500, date: "1 déc 2024", status: "paid" },
  },
  {
    id: "bp10",
    projectId: "plateforme-marque",
    name: "Plateforme de marque",
    totalAmount: 3500,
    devis: { status: "paid", date: "5 nov 2024" },
    acompte: { amount: 1750, date: "10 nov 2024", status: "paid" },
    avancement: { amount: 1000, status: "pending" },
    solde: { amount: 750, status: "pending" },
  },
];

// ─── Helpers ──────────────────────────────────────────────────
export function getClients(category: ClientCategory = "client") {
  return CLIENTS.filter((c) => c.category === category);
}

export function getClient(id: string) {
  return CLIENTS.find((c) => c.id === id) ?? null;
}

export function getClientProjects(clientId: string) {
  return PROJECTS.filter((p) => p.clientId === clientId);
}

export function getProject(projectId: string) {
  return PROJECTS.find((p) => p.id === projectId) ?? null;
}

// Docs globaux du client (pas liés à un projet)
export function getClientDocs(clientId: string) {
  return DOCUMENTS.filter((d) => d.clientId === clientId && !d.projectId);
}

// Docs spécifiques à un projet
export function getProjectDocs(projectId: string) {
  return DOCUMENTS.filter((d) => d.projectId === projectId);
}

export function getConversations(projectId: string) {
  return CONVERSATIONS.filter((c) => c.projectId === projectId);
}

// Conversations globales client (hors projet)
export function getClientConversations(clientId: string) {
  return CONVERSATIONS.filter((c) => c.clientId === clientId && !c.projectId);
}

export function getBudgetProducts(projectId: string) {
  return BUDGET_PRODUCTS.filter((p) => p.projectId === projectId);
}

export function getProjectBudgetSummary(projectId: string) {
  const products = getBudgetProducts(projectId);
  const total = products.reduce((s, p) => s + p.totalAmount, 0);
  const paid = products.reduce((s, p) => {
    let amt = 0;
    if (p.acompte?.status === "paid") amt += p.acompte.amount ?? 0;
    if (p.avancement?.status === "paid") amt += p.avancement.amount ?? 0;
    if (p.solde?.status === "paid") amt += p.solde.amount ?? 0;
    return s + amt;
  }, 0);
  return { total, paid, remaining: total - paid };
}

// ─── Label maps ───────────────────────────────────────────────
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

export const PAYMENT_STAGE_LABEL: Record<"devis" | "acompte" | "avancement" | "solde", string> = {
  devis: "Devis",
  acompte: "Acompte",
  avancement: "Avancement",
  solde: "Solde",
};
