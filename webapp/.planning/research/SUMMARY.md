# Project Research Summary

**Project:** GET BRANDON — Web App
**Domain:** Interface web pour orchestrateur AI multi-workflow (remplacement de CLI)
**Researched:** 2026-02-25
**Confidence:** MEDIUM-HIGH

---

## Executive Summary

GET BRANDON Web App est un outil interne pour 2 utilisateurs qui remplace une interface CLI par une interface web. Le produit central est un orchestrateur de workflows AI structurés : chaque workflow (start, platform, campaign, site, standalone, wireframe) est une session multi-tours avec Claude, produisant des artefacts JSON figés (CONTRE-BRIEF.json, PLATFORM.json, etc.) et un wiki HTML auto-généré. Ce n'est pas un chatbot générique — c'est un co-créateur dirigé par des prompts markdown qui structurent chaque session selon une séquence de validation précise. L'approche recommandée est Next.js 15 (App Router) + SDK Anthropic direct (sans Vercel AI SDK) + Supabase pour l'auth, la DB et le storage.

Le risque principal est technique et non fonctionnel : le streaming de longue durée (3-5 minutes par workflow) doit survivre aux timeouts Vercel et aux déconnexions réseau. La stratégie validée est la Route Handler Node.js avec `maxDuration = 300` (plan Vercel Pro requis) et `req.signal` passé au SDK Anthropic pour annuler proprement si le client déconnecte. Tous les autres choix stack découlent de ce choix central : l'Anthropic SDK direct (pas `useChat`) pour garder le contrôle total sur les messages et le parsing JSON des outputs, la table `messages` avec rows individuels (pas JSONB monolithique) pour gérer l'historique long, et le signed URL Supabase pour les uploads de fichiers (pas de transit par Vercel).

Pour la v1, le périmètre doit être rigoureusement borné aux 8 fonctionnalités de la critical path : auth, dashboard projets, upload fichiers, chat avec streaming, sélecteur de workflow, persistence de session, affichage JSON, et wiki en iframe. Tout le reste — structured output cards, auto-régénération du wiki, progress indicator de workflow, partage client, export PDF — est volontairement reporté en v2. La complexité résides dans l'infrastructure de streaming fiable, pas dans les features.

---

## Key Findings

### Recommended Stack

Next.js 15 (App Router) est le choix central qui structure toutes les autres décisions : il offre le streaming natif via Route Handlers, une intégration Vercel optimale, et le meilleur support Supabase + Anthropic SDK. TypeScript est non-négociable — les workflows produisent des JSON de formats précis que Zod doit valider avant écriture en DB. L'Anthropic SDK est utilisé directement (pas via le Vercel AI SDK `useChat`) car les workflows multi-phases avec JSON structuré en output se battent contre les conventions du hook `useChat`.

**Core technologies:**
- **Next.js 15 App Router**: Framework full-stack — streaming natif, Route Handlers, Server Components
- **@anthropic-ai/sdk ^0.30**: SDK Anthropic direct — contrôle total sur le streaming et les messages
- **Supabase (supabase-js + @supabase/ssr)**: Auth + PostgreSQL + Storage en un seul service — `@supabase/ssr` obligatoire (remplace `auth-helpers` deprecated depuis 2024)
- **Tailwind CSS v4 + shadcn/ui**: Styling zero-config + composants owned (pas de bundle bloat)
- **Zod + react-hook-form**: Validation des JSON outputs et des formulaires projet
- **Vercel Pro**: Requis — `maxDuration = 300s` impossible sur Hobby (limite 60s, insuffisant pour les workflows GBD)

**Decisions fermes:**
- Runtime Node.js (pas Edge) pour les routes de streaming Anthropic — le SDK n'est pas compatible Edge runtime (modules Node natifs)
- Pas de Redux/Zustand — React built-ins suffisent, la DB est source de vérité, 2 utilisateurs
- Pas de WebSocket — SSE via ReadableStream est suffisant et plus simple pour du streaming unidirectionnel

### Expected Features

**Must have (table stakes) — sans ces features, l'app est pire que le CLI:**
- Chat avec messages alternés user/assistant
- Streaming token-par-token (feature technique la plus critique — sans elle, l'UI semble figée)
- Sélecteur de workflow (6 workflows, boutons disabled si prérequis manquants)
- Création et nommage de projets (équivalent du dossier `clients/[client-name]/`)
- Upload de fichiers inputs (PDFs, .txt, .md, .eml) — prérequis obligatoire pour /start
- Persistence de session (conversation resumable, rechargement sans perte)
- Reprise de projet existant (équivalent du menu "Reprendre / Recommencer / Voir" CLI)
- Affichage JSON output (lisible, téléchargeable)
- Wiki HTML in-browser (iframe avec GBD-WIKI.html)
- Accès partagé 2 utilisateurs (workspace commun, pas d'isolation par user)
- Auth basique 2 comptes (Supabase email/password, signup public désactivé)

**Should have (différenciateurs — raisons de construire l'app vs garder le CLI):**
- Dashboard projets avec statut par workflow (impossible dans le CLI)
- Workflow progress indicator (étape X/N visible)
- Structured output cards par type JSON (CONTRE-BRIEF en cartes nommées vs JSON brut)
- File management par projet (upload, liste, suppression sans navigation filesystem)
- Multi-track workflow map (progression start → platform → campaign visible d'un coup d'oeil)
- Inline wiki auto-régénéré sur écriture de nouveau JSON
- Copy button sur chaque message + download button sur les outputs

**Defer v2+:**
- Structured output cards (rendu custom par schéma JSON — Medium complexity)
- Wiki auto-régénération (hook sur écriture output — High complexity)
- Workflow progress step indicator (inférer l'étape depuis le stream — Medium)
- Client sharing links (URL publiques, access tokens — v2 explicite dans PROJECT.md)
- PDF export (hors scope PROJECT.md)

**Ne jamais construire (anti-features):**
- WYSIWYG editor sur les outputs JSON (corruption de schéma)
- Multi-tenant / public signup (outil interne)
- Real-time collaboration (2 utilisateurs, jamais simultanés sur le même projet)
- Custom workflow builder (DSL editor hors scope)
- Mobile app (sessions longues, keyboard-first)

**Critical path MVP:**
Auth → Project creation → File upload → Chat + streaming → JSON display → Wiki display

### Architecture Approach

L'architecture suit trois couches clairement séparées : UI layer (React Server/Client Components), API layer (Route Handlers Next.js pour le streaming et le CRUD), et persistence layer (Supabase PostgreSQL + Storage). Le streaming AI est la primitive centrale — tout le reste sert cette primitive. La stratégie multi-turn est de passer l'historique complet à chaque appel Anthropic (API stateless), avec une table `messages` individuelle (1 row = 1 message) pour éviter la latence du JSONB monolithique sur des conversations longues.

**Major components:**
1. **ChatInterface** (`app/projects/[id]/page.tsx`) — UI principale : input, messages, workflow selector, file upload
2. **Route Handler `/api/chat/[id]/stream`** — coeur du système : reconstruit l'historique, appelle Anthropic en streaming, pipe SSE au client, persiste le message et extrait les JSON outputs à la fin
3. **WorkflowLoader** (`lib/workflows/loader.ts`) — charge les fichiers .md comme system prompts par type de workflow
4. **OutputExtractor** (`lib/workflows/extractor.ts`) — parse les blocs JSON dans la réponse complète et les persiste dans la table `outputs`
5. **WikiViewer** (`app/projects/[id]/wiki/page.tsx`) — iframe avec `srcDoc` pour isoler les CSS/JS du wiki du reste de l'app
6. **Supabase schema** — 4 tables : `projects`, `conversations`, `messages`, `outputs` + 2 buckets Storage : `inputs/`, `outputs/`

**Schema DB recommandé (ARCHITECTURE.md > STACK.md):**
ARCHITECTURE.md propose un schéma plus granulaire que STACK.md : 4 tables distinctes (projects, conversations, messages, outputs) vs 2 tables dans STACK.md (projects, workflow_sessions). Le schéma à 4 tables est préférable car il permet la pagination des messages, le tracking des tokens par message, et une meilleure isolation entre métadonnées de conversation et contenu des messages.

**File upload:** Client direct vers Supabase Storage via signed URL (pas de transit par Vercel — évite la limite 4MB et les timeouts).

**Wiki rendering:** iframe avec `srcDoc` (pas `dangerouslySetInnerHTML`) — isole les CSS/JS du wiki, préserve le comportement existant.

### Critical Pitfalls

1. **Timeout Vercel sur les workflows longs** — Configurer `export const maxDuration = 300` sur la Route Handler de streaming dès le début. Plan Pro Vercel obligatoire (Hobby = 60s max, insuffisant). Ne pas basculer sur Edge Runtime (incompatible avec le SDK Anthropic). Vérifier le timeout actuel en 2026 sur les docs Vercel.

2. **Race condition message perdu si réseau coupe entre fin stream et écriture DB** — Créer un row `pending` au début du stream, le mettre à jour avec le contenu complet à la fin (`status: 'streaming'` → `status: 'complete'`). Ne jamais écrire en un seul appel après le stream.

3. **Connexion client fermée mais Serverless Function continue (coût inutile)** — Passer `signal: req.signal` au SDK Anthropic. L'objet `Request` de l'App Router expose un signal aborted automatiquement quand le client déconnecte.

4. **Contexte Anthropic sans bornes — context window dépassée ou coûts explosifs** — Stocker `token_count` par message. Implémenter une fenêtre glissante côté serveur avant chaque appel Anthropic. Activer le prompt caching (`cache_control: { type: 'ephemeral' }`) sur le system prompt — sur des workflows de 20+ échanges, le system prompt (2000+ tokens) représente la majorité du coût input.

5. **Client Supabase browser dans un Server Component — session toujours null** — Maintenir deux factories séparées : `createServerClient` (depuis `@supabase/ssr`) pour Server Components et Route Handlers, `createBrowserClient` pour Client Components. Configurer le middleware pour rafraîchir les tokens (JWT Supabase expire après 1h).

6. **Upload fichiers via Next.js API — timeouts et limite 4MB** — Upload direct client → Supabase Storage via signed URL. La Route API génère uniquement la signed URL, ne fait jamais transiter le fichier.

---

## Implications for Roadmap

Basé sur les dépendances fonctionnelles (FEATURES.md), l'ordre architectural recommandé (ARCHITECTURE.md), et les risques à mitiger tôt (PITFALLS.md), 5 phases sont suggérées.

### Phase 1: Data Foundation + Auth
**Rationale:** Tout dépend de l'existence d'un projet. L'auth gate toutes les routes. Sans schéma DB stabilisé, aucune autre phase ne peut démarrer correctement.
**Delivers:** Supabase configuré (tables, RLS, storage buckets), 2 comptes auth créés, middleware de session, CRUD projets basique (`/api/projects` GET/POST)
**Addresses:** Auth, project creation, two-user access (table stakes FEATURES.md)
**Avoids:** Piège Supabase browser client dans Server Components — configurer `@supabase/ssr` correctement dès le début; RLS activé sur toutes les tables immédiatement
**Research flag:** Patterns standards, bien documentés — pas de recherche supplémentaire nécessaire

### Phase 2: Core Streaming (Highest Risk)
**Rationale:** C'est le composant le plus risqué (timeouts Vercel, streaming fiable, persistence atomique). Le prouver fonctionnel avant de construire l'UI finale réduit le risque projet de 80%.
**Delivers:** Route Handler `/api/chat/[id]/stream` avec maxDuration, WorkflowLoader chargeant les .md, MessageSerializer, `useStreamingChat` hook côté client, ChatInterface minimal (input + display)
**Uses:** @anthropic-ai/sdk streaming, Node.js runtime, ReadableStream + SSE, Supabase messages table
**Implements:** Pattern streaming validé avec `req.signal` pour annulation, row `pending` pour persistence atomique, prompt caching Anthropic
**Avoids:** Les 3 premiers pitfalls critiques (timeout, race condition, signal annulation)
**Research flag:** Pattern bien documenté, mais vérifier `maxDuration` actuel Vercel en 2026 et compatibilité SDK Anthropic avec la version Node.js cible

### Phase 3: UI Workflow + Project Dashboard
**Rationale:** Une fois le streaming prouvé, construire l'UI qui l'entoure. Le sélecteur de workflow et le dashboard sont les features qui justifient l'app vs le CLI.
**Delivers:** WorkflowSelector (6 boutons, disabled logic basée sur outputs existants), MessageList avec Markdown rendering, ProjectList dashboard avec statut par workflow, projet detail page avec workflow map
**Implements:** Workflow state machine (created → inputs_ready → start_done → platform_done → ...), OutputsPanel pour JSON outputs disponibles
**Avoids:** Piège UI bloquée sans feedback — implémenter les 3 états visuels (waiting / streaming / done), désactiver le bouton send pendant streaming, timeout client si pas de premier token après 30s
**Research flag:** Patterns standards — pas de recherche nécessaire

### Phase 4: File Upload + Output Extraction
**Rationale:** Prérequis technique pour le workflow /start (sans upload, le workflow principal ne peut pas commencer). L'extraction automatique des JSON outputs ferme la boucle entre le stream et les artefacts livrables.
**Delivers:** FileUploadZone (drag/drop, progress), signed URL generation, Supabase Storage buckets `inputs/` et `outputs/`, OutputExtractor (parse JSON blocks dans les réponses complètes), persistence dans table `outputs`, `project.status` mis à jour à `inputs_ready`
**Avoids:** Piège upload via Next.js API — upload direct client → Supabase Storage; validation MIME côté serveur avant génération signed URL; tracking `anthropic_file_id` avec expiration si Files API utilisée
**Research flag:** Vérifier si l'API Files Anthropic est pertinente pour ce use case (les inputs GBD sont du texte extrait, pas des PDFs passés directement à Claude) — peut simplifier considérablement

### Phase 5: Wiki Viewer + Polish
**Rationale:** Feature read-only qui dépend d'au moins un workflow /start + /wiki complété. Peut être validée uniquement avec des données réelles. Le polish UX final s'intègre naturellement ici.
**Delivers:** WikiViewer en iframe avec srcDoc, Route Handler `/api/projects/[id]/wiki` servant le HTML depuis Supabase Storage, reconnexion SSE basique (retry avec backoff), copy buttons sur messages, download buttons sur JSON outputs
**Implements:** Sandboxed iframe pour isolation CSS/JS du wiki, stockage HTML wiki dans bucket `outputs/`
**Avoids:** Piège Markdown non rendu pendant streaming — react-markdown avec remarkGfm; piège pas de reconnexion SSE — fallback polling Supabase si SSE coupe
**Research flag:** Pattern iframe srcDoc standard — pas de recherche nécessaire

### Phase Ordering Rationale

- **Phase 1 avant tout:** Schéma DB difficile à migrer après coup; RLS doit être activé avant toute donnée en production; auth gate toutes les autres features
- **Phase 2 en deuxième:** Risque le plus élevé du projet — timeout, streaming, persistence atomique. Prouver d'abord, UI ensuite
- **Phase 3 après streaming:** Dashboard et UI workflow n'ont de valeur que si le streaming sous-jacent fonctionne; workflow state machine dépend de l'existence des outputs
- **Phase 4 après UI:** Upload est prérequis pour /start mais est fonctionnellement indépendant du streaming; OutputExtractor dépend que la Route de streaming soit stabilisée
- **Phase 5 en dernier:** Read-only, dépend d'outputs réels pour être testable; polish UX est la dernière chose à affiner

### Research Flags

**Phases nécessitant une recherche approfondie lors du planning:**
- **Phase 2:** Vérifier `maxDuration` actuel Vercel en 2026 (docs peuvent avoir changé depuis Aug 2025); vérifier compatibilité exacte SDK Anthropic ^0.30 avec Node.js 20 LTS; tester streaming en conditions réelles Vercel avant de bloquer sur cette route
- **Phase 4:** Clarifier si l'API Files Anthropic est utilisée (GBD passe les inputs comme texte extrait ou comme fichiers binaires?) — impact sur le schéma `documents` et la logique d'upload

**Phases avec patterns standards (recherche supplémentaire non nécessaire):**
- **Phase 1:** Auth Supabase + App Router est documenté officiellement, patterns stables
- **Phase 3:** Dashboard CRUD et UI composants shadcn sont standards
- **Phase 5:** iframe srcDoc et SSE reconnect sont des patterns browser stables

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM-HIGH | Next.js 15 + Supabase + Anthropic SDK: patterns stables. Tailwind v4 et Vercel timeouts à vérifier en 2026 |
| Features | HIGH | Basé sur analyse directe du code CLI source (workflows/*.md, PROJECT.md, VISION.md) — pas de web search |
| Architecture | HIGH | Patterns Next.js Route Handler streaming vérifiés via docs officiels; Supabase SSR pattern officiel depuis 2024 |
| Pitfalls | HIGH | Pitfalls basés sur des erreurs d'implémentation connues et documentées — spécifiques à ce stack exact |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Vercel timeout 2026:** La recherche est basée sur la connaissance jusqu'en Aug 2025. Les durées maximales Vercel (Pro, Fluid Compute) peuvent avoir changé. A vérifier en premier lors du setup Vercel.
- **Anthropic SDK Edge runtime:** STACK.md note que le SDK v0.29+ supportait Edge runtime, mais PITFALLS.md et ARCHITECTURE.md recommandent Node.js runtime. Decision: rester sur Node.js runtime, clarifier au moment du setup.
- **API Files Anthropic vs texte extrait:** GBD passe-t-il les PDFs clients directement à Claude via l'API Files (avec `type: "document"`) ou extrait-il le texte en amont? Cette question impacte le schéma `documents`, la logique d'upload, et la gestion des IDs Anthropic avec expiration. A clarifier en lisant les workflows source avant de coder Phase 4.
- **Context window et summarization:** Pour les workflows GBD verbeux (platform = 3-5 minutes, 10 pages), la conversation peut approcher les limites de context window. La recherche suggère une summarization par checkpoint de workflow mais ne détaille pas l'implémentation. A traiter lors du planning Phase 2.

---

## Sources

### Primary (HIGH confidence)
- CLI workflow source files: `/workflows/start.md`, `/workflows/platform.md`, `/workflows/campaign.md`, `/workflows/site.md`, `/workflows/standalone.md`, `/workflows/wireframe.md`, `/workflows/wiki.md` — analyse directe de première main
- Project requirements: `/WEBAPP/.planning/PROJECT.md` — source de vérité pour périmètre et anti-features
- Next.js Route Handlers streaming: https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming (vérifié Feb 2026, version 16.1.6)
- Supabase SSR docs: https://supabase.com/docs/guides/auth/server-side/nextjs — remplacement officiel de auth-helpers depuis 2024
- Anthropic SDK: https://github.com/anthropic-ai/anthropic-sdk-typescript (knowledge cutoff Aug 2025)

### Secondary (MEDIUM confidence)
- Vercel function duration limits: https://vercel.com/docs/functions/runtimes#max-duration — vérifier en 2026
- shadcn/ui Next.js installation: https://ui.shadcn.com/docs/installation/next
- Output artifact example: `/clients/brandon/outputs/GBD-WIKI.html` — structure réelle du wiki

### Tertiary (needs validation at implementation)
- Tailwind CSS v4 stability: actif en 2025, vérifier release stable à l'init projet
- Anthropic prompt caching: pattern documenté, vérifier disponibilité sur tous les modèles cibles
- Vercel Edge runtime + Anthropic SDK: conflict identifié, Node.js runtime retenu par défaut

---
*Research completed: 2026-02-25*
*Ready for roadmap: yes*
