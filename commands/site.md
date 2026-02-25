---
name: gbd:site
description: Génère l'architecture et les contenus du site depuis la plateforme de marque
argument-hint: <client-name>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Générer SITE.json — architecture validée + contenus rédigés page par page —
depuis PLATFORM.json. Mettre à jour GBD-WIKI.html à la fin.

Indépendant de la campagne. S'appuie uniquement sur la plateforme.
</objective>

<execution_context>
@/Users/jeremyhervo/.claude/get-brand-done/workflows/site.md
</execution_context>

<context>
Nom client : $ARGUMENTS

Outil utilitaire disponible :
node /Users/jeremyhervo/.claude/get-brand-done/bin/gbd-tools.cjs

Les fichiers du projet sont dans : clients/<client-slug>/
</context>

<process>
Suivre intégralement le workflow site.md.

Phase 1 — Architecture :
1. node gbd-tools.cjs status <client-name> — vérifier PLATFORM.json
2. Proposer l'architecture, valider avec l'utilisateur
3. Générer les fiches de page

Phase 2 — Contenus :
4. Rédiger page par page, titres audacieux
5. Valider home + à propos + contact
6. Écrire SITE.json
7. Régénérer le wiki HTML
</process>
