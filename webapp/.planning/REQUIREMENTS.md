# Requirements: GET BRANDON — Web App

**Defined:** 2026-02-26
**Milestone:** v1.1 — File Upload + Wiki + UI/UX
**Core Value:** N'importe quel membre de l'équipe peut démarrer et piloter un projet GBD sans passer par le CLI.

## v1.1 Requirements

### UPLOAD — Fichiers clients

- [x] **UPLD-01** : Utilisateur peut uploader un ou plusieurs fichiers (PDF, .txt, .md, .docx) dans un projet
- [x] **UPLD-02** : Les fichiers uploadés sont stockés dans Supabase Storage, associés au projet
- [x] **UPLD-03** : Utilisateur peut voir la liste des fichiers uploadés pour un projet
- [x] **UPLD-04** : Utilisateur peut supprimer un fichier uploadé
- [x] **UPLD-05** : Les fichiers uploadés d'un projet (PDF, .txt, .md) sont injectés dans le contexte de l'agent lors de chaque message du workflow

### OUTPUT — Sauvegarde des JSON produits

- [x] **OUTP-01** : Le JSON produit par chaque workflow est extrait du stream et sauvegardé en DB
- [x] **OUTP-02** : Utilisateur peut voir les JSON outputs disponibles pour chaque workflow complété
- [x] **OUTP-03** : Utilisateur peut télécharger un JSON output

### WIKI — Page wiki native par projet

- [x] **WIKI-01** : Utilisateur peut accéder à la page wiki du projet (/projects/[id]/wiki)
- [x] **WIKI-02** : La page wiki affiche les sections disponibles selon les workflows complétés (Contre-brief, Plateforme, Campagne, Site)
- [x] **WIKI-03** : Chaque section affiche un TL;DR + le contenu structuré du JSON correspondant
- [x] **WIKI-04** : La navigation wiki est synchronisée avec le scroll (scroll-spy sidebar)

### DESIGN — UI/UX Redesign

- [x] **DSGN-01** : L'app utilise un design system cohérent (palette, typographie, espacement via tokens Tailwind)
- [x] **DSGN-02** : Les composants dashboard, workflow cards et navigation sont redesignés
- [x] **DSGN-03** : L'interface chat est redesignée (bulles, header, footer input)
- [x] **DSGN-04** : Les états UX sont implémentés (loading, erreur, succès, vide)

## v2 Requirements (deferred)

### VIEWER — Wireframe HTML

- **VIEW-01** : Le wireframe HTML généré par /wireframe est stocké et affiché dans l'interface (iframe)
- **VIEW-02** : Utilisateur peut télécharger le wireframe HTML

### PARTAGE

- **SHAR-01** : Lien de partage client (accès limité en lecture seule) — v2

## Out of Scope

| Feature | Reason |
|---------|--------|
| Accès client (lien de partage) | Pas en v1, peut-être v2 |
| Inscription publique / SaaS | Outil interne uniquement |
| Export PDF / Figma | Pas en v1 |
| Workflows `/social`, `/retro`, `/brandbook` | Pas encore implémentés en CLI non plus |
| Application mobile | Web-first |
| Identité visuelle GBD dans l'app | Design neutre pro — branding interne seulement |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| UPLD-01 | Phase 4 | Complete |
| UPLD-02 | Phase 4 | Complete |
| UPLD-03 | Phase 4 | Complete |
| UPLD-04 | Phase 4 | Complete |
| UPLD-05 | Phase 5 (hotfix) | Complete |
| OUTP-01 | Phase 4 | Complete |
| OUTP-02 | Phase 4 | Complete |
| OUTP-03 | Phase 4 | Complete |
| WIKI-01 | Phase 5 | Complete |
| WIKI-02 | Phase 5 | Complete |
| WIKI-03 | Phase 5 | Complete |
| WIKI-04 | Phase 5 | Complete |
| DSGN-01 | Phase 6 | Complete |
| DSGN-02 | Phase 6 | Complete |
| DSGN-03 | Phase 6 | Complete |
| DSGN-04 | Phase 6 | Complete |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 16
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-26*
*Roadmap created: 2026-02-26 — v1.1 Phases 4-6*
