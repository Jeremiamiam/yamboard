# Phase 1: Foundation + Auth - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Auth Supabase (email/mot de passe) + dashboard projets + CRUD projets basique. Un seul utilisateur pour V0.1 — pas de gestion multi-users. Approche MVP strict.

</domain>

<decisions>
## Implementation Decisions

### Utilisateur cible V0.1
- Utilisateur unique (le propriétaire) — pas de gestion multi-users pour l'instant
- Pas besoin d'inscription, juste login avec credentials existants Supabase
- Multi-users différé à une version ultérieure

### Dashboard — layout projets
- Liste simple (pas de cards ni table)
- Chaque ligne affiche : nom du projet + date + compteur texte "X/6 workflows"
- Ordre : dernier modifié en premier (le projet actif remonte automatiquement)
- État vide : message simple "Aucun projet." + bouton "Créer un projet"

### Création de projet
- Modal depuis le dashboard (bouton "Nouveau projet")
- Champ unique obligatoire : nom du projet
- Après création → redirection automatique vers le projet créé
- Suppression possible : bouton supprimer + confirmation simple ("Vous êtes sûr ?")
- Renommage différé à V0.2

### Affichage progression workflows (vue projet)
- Liste des 6 workflows GBD affichés dès Phase 1 (même si la plupart sont verrouillés)
- Pastille de statut par workflow : gris = disponible, vert = complété, verrou = bloqué par dépendance
- Les comportements réels (lancer, dépendances actives) arriveront en Phase 3
- Phase 1 pose uniquement la structure UI statique pour les workflows

### Claude's Discretion
- Design exact de la page login (branding, couleurs, layout)
- Gestion des erreurs auth (messages d'erreur, UX)
- Stack technique (Next.js App Router, Supabase client, middleware de session)
- Schéma DB exact pour les projets et l'état des workflows

</decisions>

<specifics>
## Specific Ideas

- MVP V0.1 — garder simple, pas d'over-engineering
- Les 6 workflows GBD : /start, /platform, /campaign, /site, /site-standalone, /wireframe (ou similaire)
- L'état des workflows par projet est stocké en DB dès Phase 1, même si l'UI pour les lancer arrive en Phase 3

</specifics>

<deferred>
## Deferred Ideas

- Gestion multi-utilisateurs — version ultérieure
- Renommage de projet inline — V0.2
- Description/champs additionnels sur le projet — future phase
- Page login avec branding avancé — polish Phase 5

</deferred>

---

*Phase: 01-foundation-auth*
*Context gathered: 2026-02-25*
