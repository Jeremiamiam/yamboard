# YamBoard

## What This Is

YamBoard est le dashboard de gestion interne de l'agence de communication Yam. Il centralise clients, prospects, projets, produits, documents et facturation — et y greffe des agents IA contextuels qui connaissent chaque client et chaque projet. L'outil est conçu pour un usage solo (le fondateur) avec une ouverture possible à un collaborateur ou client dans une version future.

## Core Value

Voir en un coup d'œil où en est chaque projet et sa facturation — sans jongler entre des outils disparates.

## Requirements

### Validated

- ✓ Architecture UI v2 (Next.js 16 + Tailwind v4) — existant dans `dashboard/`
- ✓ Navigation 3 niveaux : Agence → Clients → Projets — existant
- ✓ Sidebar avec tabs Clients / Prospects / Archives — existant
- ✓ Vue projet avec produits + étapes de paiement (mock) — existant
- ✓ DocumentViewer slide-over avec contenu riche — existant
- ✓ 3 scopes d'agents IA (Yam / Client / Projet) avec streaming Anthropic — existant
- ✓ Champ note libre sur les documents (injecté dans le contexte agent) — existant
- ✓ Données mock uniquement (aucun backend réel) — existant

### Active

- [ ] Persistance réelle des données via Supabase (clients, projets, produits, docs, notes)
- [ ] CRUD complet clients — créer, éditer, archiver, supprimer, passer prospect → client
- [ ] CRUD complet projets — créer, éditer, fermer, supprimer
- [ ] CRUD complet produits dans chaque projet
- [ ] Gestion des documents — upload PDF, note texte, lien externe, doc IA généré
- [ ] Pinning de documents projet → niveau client (doc visible dans le contexte client)
- [ ] Suivi facturation par projet — états : Devis / Acompte / Avancement(s) / Solde
- [ ] Contacts associés aux clients (nom, rôle, email, téléphone)
- [ ] Agents IA alimentés par les vraies données Supabase (pas le mock)
- [ ] Authentification (accès solo sécurisé, invitation collaborateur future)

### Out of Scope

- brandon-vocal — projet distinct, exclu de ce périmètre
- webapp (v1) — remplacée par le dashboard v2, non maintenue
- Multi-utilisateurs temps réel — prévu v2+, pas v1
- Génération automatique de factures PDF — hors scope v1
- CRM avancé (pipeline commercial, scoring) — hors scope v1
- Application mobile — web-first uniquement

## Context

Le `dashboard/` (branche git `v2`) est une interface Next.js 16 complète avec données mock. L'objectif est de brancher cette UI sur un vrai backend Supabase plutôt que de reconstruire l'interface. La stack est arrêtée : Next.js 16, Tailwind v4, Anthropic SDK pour les agents, Supabase pour la persistance et l'auth.

La hiérarchie des données :
- **Agence Yam** → niveau global
  - **Clients** (actifs) / **Prospects** (à convertir) / **Archives**
    - Données client : notes, contacts, liens externes
    - **Documents de marque** (niveau client — certains sont "pinnés" depuis un projet)
    - **Projets**
      - **Produits** (ex: logo, naming, charte graphique)
      - **Documents** de projet (brief, livrables, notes)
      - **Facturation** : Devis → Acompte → Avancement(s) → Solde

Les 3 contextes agents :
- `agency` — tous les clients + projets + budgets (pas tous les docs)
- `client` — projets + docs du client en question
- `project` — projet en question + docs client pinnés

## Constraints

- **Stack** : Next.js 16, Tailwind v4, Supabase, Anthropic SDK — déjà arrêtés, pas de remise en question
- **UI** : L'interface v2 existante est la base — on branche, on n'reconstruit pas
- **Solo** : Pas de gestion multi-user complexe en v1 — auth simple Supabase
- **Supabase** : Repartir d'un schéma propre — les anciennes tables (v1/webapp) sont à supprimer

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Garder l'UI v2 mock comme base | Évite de reconstruire l'interface, focus sur le backend | — Pending |
| Supabase pour la persistance | Déjà dans l'écosystème, auth + BDD + storage intégrés | — Pending |
| Repartir d'un schéma Supabase propre | Les tables v1 ne correspondent pas à la nouvelle hiérarchie | — Pending |
| Agents Anthropic (claude-opus-4-5) | Déjà intégré et fonctionnel avec streaming | ✓ Good |
| Pinning doc projet → client | Les docs de marque globaux (plateforme de marque) doivent remonter au niveau client | — Pending |

---
*Last updated: 2026-03-08 after initialization*
