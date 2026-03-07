export type ClientStatus = "active" | "draft" | "paused";
export type ProjectType = "brand" | "site" | "campaign" | "social" | "other";
export type ProjectStatus = "active" | "done" | "paused" | "draft";

export type Client = {
  id: string;
  name: string;
  industry: string;
  status: ClientStatus;
  contact: { name: string; role: string; email: string; phone?: string };
  color: string;
};

export type Project = {
  id: string;
  clientId: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  description: string;
  progress: number;      // phases done
  totalPhases: number;
  budget: number;
  spent: number;
  lastActivity: string;  // human-readable date
  startDate: string;
};

export type Document = {
  id: string;
  projectId: string;
  name: string;
  type: "brief" | "platform" | "campaign" | "site" | "other";
  updatedAt: string;
  size: string;
};

export type Conversation = {
  id: string;
  projectId: string;
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

export type BudgetPhase = {
  name: string;
  allocated: number;
  spent: number;
  status: "done" | "active" | "pending";
};

// ─── Clients ────────────────────────────────────────────────
export const CLIENTS: Client[] = [
  {
    id: "brutus",
    name: "Brutus.club",
    industry: "E-commerce · Pet",
    status: "active",
    contact: { name: "Thomas Marin", role: "Fondateur", email: "thomas@brutus.club", phone: "+33 6 12 34 56 78" },
    color: "#f97316",
  },
  {
    id: "bloo-conseil",
    name: "Bloo Conseil",
    industry: "Conseil · Cyber",
    status: "active",
    contact: { name: "Aurélien Bloo", role: "CEO", email: "a.bloo@bloo-conseil.fr" },
    color: "#3b82f6",
  },
  {
    id: "forge",
    name: "Forge",
    industry: "Wellness · Recovery",
    status: "active",
    contact: { name: "Marine Leroy", role: "Co-fondatrice", email: "marine@forge-smalo.fr", phone: "+33 6 98 76 54 32" },
    color: "#10b981",
  },
  {
    id: "ornanza",
    name: "Ornanza",
    industry: "Retail · Bijoux",
    status: "draft",
    contact: { name: "Clara Fontaine", role: "Gérante", email: "clara@ornanza.fr" },
    color: "#a855f7",
  },
];

// ─── Projects ───────────────────────────────────────────────
export const PROJECTS: Project[] = [
  // Brutus — 3 missions
  {
    id: "identite-de-marque",
    clientId: "brutus",
    name: "Identité de marque",
    type: "brand",
    status: "done",
    description: "Contre-brief, plateforme de marque, système verbal et brandbook.",
    progress: 5,
    totalPhases: 5,
    budget: 5500,
    spent: 5500,
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
    budget: 4000,
    spent: 1200,
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
    budget: 2500,
    spent: 0,
    lastActivity: "—",
    startDate: "À planifier",
  },

  // Bloo Conseil — 1 mission en cours
  {
    id: "refonte-marque",
    clientId: "bloo-conseil",
    name: "Refonte de marque",
    type: "brand",
    status: "active",
    description: "10 ans d'existence — repositionnement, plateforme et refonte visuelle.",
    progress: 3,
    totalPhases: 5,
    budget: 5000,
    spent: 3000,
    lastActivity: "22 oct 2024",
    startDate: "Sep 2024",
  },

  // Forge — 2 missions
  {
    id: "plateforme-marque",
    clientId: "forge",
    name: "Plateforme de marque",
    type: "brand",
    status: "active",
    description: "L'Atelier de la Durée — positionnement, essence et manifeste.",
    progress: 2,
    totalPhases: 5,
    budget: 4500,
    spent: 1800,
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
    budget: 1500,
    spent: 0,
    lastActivity: "—",
    startDate: "2026",
  },

  // Ornanza — démarrage
  {
    id: "kickoff-marque",
    clientId: "ornanza",
    name: "Identité de marque",
    type: "brand",
    status: "draft",
    description: "Kick-off et brief stratégique — bijoux intemporels haut de gamme.",
    progress: 0,
    totalPhases: 5,
    budget: 3500,
    spent: 0,
    lastActivity: "—",
    startDate: "À planifier",
  },
];

// ─── Documents ──────────────────────────────────────────────
export const DOCUMENTS: Document[] = [
  // Brutus — identité
  { id: "d1", projectId: "identite-de-marque", name: "Contre-brief", type: "brief", updatedAt: "10 nov 2024", size: "24 Ko" },
  { id: "d2", projectId: "identite-de-marque", name: "Plateforme de marque", type: "platform", updatedAt: "18 nov 2024", size: "87 Ko" },
  { id: "d3", projectId: "identite-de-marque", name: "Brandbook", type: "other", updatedAt: "28 nov 2024", size: "2.1 Mo" },

  // Brutus — site
  { id: "d4", projectId: "site-web", name: "Architecture du site", type: "site", updatedAt: "20 jan 2025", size: "52 Ko" },
  { id: "d5", projectId: "site-web", name: "Contenus Home + Boutique", type: "other", updatedAt: "3 mars 2025", size: "38 Ko" },

  // Bloo
  { id: "d6", projectId: "refonte-marque", name: "Brief stratégique", type: "brief", updatedAt: "5 oct 2024", size: "31 Ko" },
  { id: "d7", projectId: "refonte-marque", name: "Plateforme de marque", type: "platform", updatedAt: "20 oct 2024", size: "92 Ko" },

  // Forge
  { id: "d8", projectId: "plateforme-marque", name: "Contre-brief", type: "brief", updatedAt: "1 déc 2024", size: "28 Ko" },
  { id: "d9", projectId: "plateforme-marque", name: "Plateforme de marque v1", type: "platform", updatedAt: "12 déc 2024", size: "79 Ko" },
];

// ─── Conversations ───────────────────────────────────────────
export const CONVERSATIONS: Conversation[] = [
  // Brutus identité
  { id: "c1", projectId: "identite-de-marque", title: "Session brief stratégique", preview: "On a discuté du positionnement premium vs accessible...", date: "10 nov", messageCount: 24 },
  { id: "c2", projectId: "identite-de-marque", title: "Plateforme — itération 1", preview: "L'essence « Caractère » validée, on affine le manifeste...", date: "18 nov", messageCount: 47 },
  { id: "c3", projectId: "identite-de-marque", title: "Brandbook — révisions finales", preview: "Dernières corrections typographiques avant envoi...", date: "28 nov", messageCount: 12 },

  // Brutus site
  { id: "c4", projectId: "site-web", title: "Architecture du site", preview: "5 pages, la home met en avant la box du mois...", date: "20 jan", messageCount: 31 },
  { id: "c5", projectId: "site-web", title: "Contenus et copywriting", preview: "On travaille les titres de la page boutique...", date: "3 mars", messageCount: 19 },

  // Bloo
  { id: "c6", projectId: "refonte-marque", title: "Kick-off projet", preview: "10 ans d'existence, refonte de l'image...", date: "5 oct", messageCount: 18 },
  { id: "c7", projectId: "refonte-marque", title: "Plateforme — angle éthique structurelle", preview: "L'éthique comme contrainte, pas comme valeur...", date: "20 oct", messageCount: 52 },

  // Forge
  { id: "c8", projectId: "plateforme-marque", title: "Brief — L'Atelier de la Durée", preview: "Route du Rhum 2026 comme fenêtre de lancement...", date: "1 déc", messageCount: 29 },
  { id: "c9", projectId: "plateforme-marque", title: "Plateforme v1 — retours client", preview: "Marine valide l'essence mais demande plus de...", date: "12 déc", messageCount: 34 },
];

// ─── Mock messages ───────────────────────────────────────────
export const MOCK_MESSAGES: Message[] = [
  { id: "m1", role: "user", content: "On reprend sur la plateforme. J'hésite encore sur l'essence — entre 'Caractère' et 'Mordant'.", timestamp: "14:32" },
  { id: "m2", role: "assistant", content: "Les deux ont une énergie différente. 'Caractère' est plus large, il inclut la sélectivité sans l'agressivité. 'Mordant' est plus tranchant mais risque d'intimider les nouveaux propriétaires. Est-ce que Brutus.club veut être intimidant ou simplement exigeant ?", timestamp: "14:32" },
  { id: "m3", role: "user", content: "Exigeant mais pas condescendant. On veut que les gens se sentent fiers d'y être, pas jugés de ne pas y être.", timestamp: "14:33" },
  { id: "m4", role: "assistant", content: "Alors 'Caractère' est juste. Il y a une dignité dans ce mot qui correspond — avoir du caractère, c'est une qualité qu'on reconnaît et qu'on désire. 'Mordant' créerait une friction à l'entrée. L'essence peut rester **Caractère**, avec la tension : *exigence sans condescendance*.", timestamp: "14:33" },
  { id: "m5", role: "user", content: "Ok validé. On passe au manifeste ?", timestamp: "14:35" },
  { id: "m6", role: "assistant", content: "Oui. Le manifeste doit incarner cette voix — exigeante mais bienveillante. Je te propose une première version :\n\n*Il y a des chiens qui s'assument. Et des propriétaires qui les méritent.*\n*Brutus.club, c'est pour eux.*\n*Pas pour les indécis. Pas pour ceux qui cherchent à faire bonne figure.*\n*Pour ceux qui ont fait un choix — et qui l'assument jusqu'au bout.*", timestamp: "14:35" },
];

// ─── Budget data ─────────────────────────────────────────────
export const BUDGET_PHASES: Record<string, BudgetPhase[]> = {
  "identite-de-marque": [
    { name: "Contre-brief", allocated: 1000, spent: 1000, status: "done" },
    { name: "Plateforme de marque", allocated: 2500, spent: 2500, status: "done" },
    { name: "Système verbal", allocated: 500, spent: 500, status: "done" },
    { name: "Brandbook", allocated: 1000, spent: 1000, status: "done" },
    { name: "Livraison & révisions", allocated: 500, spent: 500, status: "done" },
  ],
  "site-web": [
    { name: "Architecture", allocated: 1000, spent: 1000, status: "done" },
    { name: "Contenus & copywriting", allocated: 1200, spent: 200, status: "active" },
    { name: "Maquettes Webflow", allocated: 1200, spent: 0, status: "pending" },
    { name: "Intégration & mise en ligne", allocated: 600, spent: 0, status: "pending" },
  ],
  "campagne-lancement": [
    { name: "Concept créatif", allocated: 1000, spent: 0, status: "pending" },
    { name: "Déclinaisons", allocated: 1000, spent: 0, status: "pending" },
    { name: "Livraison assets", allocated: 500, spent: 0, status: "pending" },
  ],
  "refonte-marque": [
    { name: "Brief stratégique", allocated: 1000, spent: 1000, status: "done" },
    { name: "Plateforme de marque", allocated: 2000, spent: 2000, status: "done" },
    { name: "Système visuel", allocated: 1500, spent: 0, status: "active" },
    { name: "Brand book", allocated: 500, spent: 0, status: "pending" },
  ],
  "plateforme-marque": [
    { name: "Contre-brief", allocated: 1000, spent: 1000, status: "done" },
    { name: "Plateforme de marque", allocated: 2500, spent: 800, status: "active" },
    { name: "Système verbal", allocated: 500, spent: 0, status: "pending" },
    { name: "Brandbook", allocated: 1000, spent: 0, status: "pending" },
  ],
  "campagne-route-du-rhum": [
    { name: "Concept créatif", allocated: 700, spent: 0, status: "pending" },
    { name: "Déclinaisons", allocated: 500, spent: 0, status: "pending" },
    { name: "Activation & RP", allocated: 300, spent: 0, status: "pending" },
  ],
  "kickoff-marque": [
    { name: "Brief stratégique", allocated: 1000, spent: 0, status: "pending" },
    { name: "Plateforme de marque", allocated: 2000, spent: 0, status: "pending" },
    { name: "Système visuel", allocated: 500, spent: 0, status: "pending" },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────
export function getClient(id: string) {
  return CLIENTS.find((c) => c.id === id) ?? null;
}

export function getClientProjects(clientId: string) {
  return PROJECTS.filter((p) => p.clientId === clientId);
}

export function getProject(projectId: string) {
  return PROJECTS.find((p) => p.id === projectId) ?? null;
}

export function getDocuments(projectId: string) {
  return DOCUMENTS.filter((d) => d.projectId === projectId);
}

export function getConversations(projectId: string) {
  return CONVERSATIONS.filter((c) => c.projectId === projectId);
}

export function getBudgetPhases(projectId: string): BudgetPhase[] {
  return BUDGET_PHASES[projectId] ?? [];
}

export function getClientStats(clientId: string) {
  const projects = getClientProjects(clientId);
  const budget = projects.reduce((sum, p) => sum + p.budget, 0);
  const spent = projects.reduce((sum, p) => sum + p.spent, 0);
  const activeCount = projects.filter((p) => p.status === "active").length;
  return { budget, spent, activeCount, projectCount: projects.length };
}

// ─── Label & color maps ───────────────────────────────────────
export const PROJECT_TYPE_LABEL: Record<ProjectType, string> = {
  brand: "Marque",
  site: "Site web",
  campaign: "Campagne",
  social: "Social",
  other: "Autre",
};

export const PROJECT_TYPE_ICON: Record<ProjectType, string> = {
  brand: "💎",
  site: "🌐",
  campaign: "📣",
  social: "📱",
  other: "📁",
};

export const PROJECT_STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; class: string }
> = {
  active: { label: "En cours", class: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  done: { label: "Terminé", class: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  paused: { label: "En pause", class: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  draft: { label: "À démarrer", class: "text-zinc-500 bg-zinc-800 border-zinc-700" },
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
