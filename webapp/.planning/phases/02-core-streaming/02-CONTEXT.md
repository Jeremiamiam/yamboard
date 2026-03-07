# Phase 2: Core Streaming - Context

**Gathered:** 2026-02-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Route Handler streaming Anthropic + hook client + interface de chat minimale fonctionnelle. Un workflow GBD peut être lancé depuis une page dédiée et sa réponse s'affiche token par token sans timeout. Le sélecteur de workflow complet, les dépendances entre workflows, et le bouton stop sont hors scope (Phase 3+).

</domain>

<decisions>
## Implementation Decisions

### Apparence du fil de chat
- Bulles alignées : messages utilisateur à droite, messages agent à gauche
- Largeur maximale centrée ≈ 700px
- Markdown rendu visuellement dans les réponses agent (gras, listes, code blocks)
- Pas de timestamp affiché sur les messages (Phase 2)

### Comportement du streaming
- Indicateur de latence initiale : bulle agent avec points animés (...) avant le 1er token
- Auto-scroll vers le bas pendant la génération
- Pas de bouton stop (hors scope Phase 2)
- Input utilisateur désactivé (disabled) pendant le stream

### Déclenchement du workflow
- Page dédiée `/projects/[id]/chat`
- Input texte libre — l'utilisateur tape n'importe quel message ou commande (/start, etc.)
- Tout message est transmis à l'agent GBD (pas de validation de commandes)
- Une seule conversation active par projet (pas de multi-sessions)

### Reconnexion SSE
- Bannière discrète "Reconnexion..." qui disparaît une fois reconnecté
- Après reconnexion : historique rechargé depuis DB et affiché instantanément
- 3 tentatives avec backoff exponentiel (1s, 2s, 4s) avant d'arrêter
- Échec final : message d'erreur + bouton "Réessayer manuellement"

### Claude's Discretion
- Design exact des bulles (padding, border-radius, couleurs)
- Animation des points (...) pendant la latence
- Style exact de la bannière de reconnexion
- Gestion des erreurs HTTP (500, 429, etc.)

</decisions>

<specifics>
## Specific Ideas

- L'expérience doit ressembler à un chat classique (iMessage/Claude.ai) — familier et immédiat
- Phase 2 est un proof-of-concept streaming : priorité à la fiabilité sur l'esthétique

</specifics>

<deferred>
## Deferred Ideas

- Bouton stop pour interrompre un workflow — Phase 3+
- Sélecteur de workflow graphique avec dépendances visuelles — Phase 3
- Plusieurs sessions de conversation par projet — backlog
- Timestamps sur les messages — Phase 3+ ou polish
- Filtrage/recherche dans l'historique — backlog

</deferred>

---

*Phase: 02-core-streaming*
*Context gathered: 2026-02-25*
