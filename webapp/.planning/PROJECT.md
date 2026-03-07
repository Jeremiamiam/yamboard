# GET BRANDON — Web App

## What This Is

Interface web pour GET BRANDON — remplace le CLI par une interface conversationnelle accessible à toute l'équipe. Deux utilisateurs (Jeremy + associé) de l'Agence Yam peuvent lancer et piloter les workflows GBD depuis un navigateur, sans terminal.

Le produit orchestre les mêmes agents IA qu'aujourd'hui (start, platform, campaign, site-standalone, wireframe) via une UI chat qui stream les réponses en temps réel, avec gestion des dépendances entre workflows.

## Core Value

N'importe quel membre de l'équipe peut démarrer et piloter un projet GBD sans passer par le CLI.

## Current State (v1.0 — shipped 2026-02-26)

- Auth Supabase + session middleware opérationnels
- Création/gestion de projets
- Chat streaming Anthropic (SSE, reconnexion auto, persistance DB)
- 5 workflows GBD avec dépendances visuelles (start→platform→campaign, site-standalone→wireframe)
- Historique chat scopé par workflow
- ~1 400 LOC TypeScript · Next.js 16 + Supabase + Anthropic SDK

## Requirements

### Validated (v1.0)

- ✓ Utilisateur peut créer un nouveau projet client et nommer le dossier — v1.0
- ✓ Utilisateur peut lancer le workflow `/start` via l'interface — v1.0
- ✓ Utilisateur peut lancer le workflow `/platform` depuis un projet existant — v1.0
- ✓ Utilisateur peut lancer le workflow `/campaign` depuis un projet existant — v1.0
- ✓ Utilisateur peut lancer le workflow `/site-standalone` — v1.0
- ✓ Utilisateur peut lancer le workflow `/wireframe` depuis un brief site — v1.0
- ✓ Les réponses de l'agent s'affichent en streaming (token par token) — v1.0
- ✓ L'interface de discussion est un chat (messages alternés user/agent) — v1.0
- ✓ Les deux utilisateurs ont accès à tous les projets — v1.0
- ✓ L'état de chaque projet est persisté (reprendre une session) — v1.0

### Active (v1.1)

- [ ] Les fichiers inputs client peuvent être uploadés dans l'interface (PDF, .txt, .md, .docx)
- [ ] Le wiki HTML du projet est affiché dans l'interface (comme GBD-WIKI.html)
- [ ] Les JSON produits (CONTRE-BRIEF.json, PLATFORM.json…) sont sauvegardés en DB
- [ ] Le wireframe HTML est stocké et affiché via iframe
- [ ] Utilisateur peut télécharger les fichiers JSON et HTML produits
- [ ] L'interface adopte un design neutre professionnel (palette cohérente, typographie, états UI)
- [ ] Les composants clés (chat, dashboard, navigation) sont redesignés pour la lisibilité et l'efficacité

### Out of Scope

- Accès client (lien de partage) — pas en v1, peut-être v2
- Inscription publique / SaaS — outil interne uniquement
- Export PDF / Figma — pas en v1
- Workflows `/social`, `/retro`, `/brandbook` — pas encore implémentés en CLI non plus
- Application mobile — web-first

## Current Milestone: v1.1 File Upload + Viewer + UI/UX

**Goal:** Compléter la boucle de production GBD — fichiers in/out gérés dans l'interface, wiki et wireframe consultables, et une UI professionnelle digne d'un outil d'agence.

**Target features:**
- Upload fichiers clients (PDF, .txt, .md, .docx) → Supabase Storage
- Sauvegarde et affichage des JSON outputs par workflow
- Wiki HTML + wireframe HTML en iframe intégrée
- Téléchargement des fichiers produits (JSON, HTML)
- Redesign UI/UX neutre pro (design system, composants, états)

---
*Last updated: 2026-02-26 after v1.1 milestone start*
