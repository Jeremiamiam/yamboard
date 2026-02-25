---
name: gbd:campaign
description: Génère le concept de campagne depuis la plateforme de marque
argument-hint: <client-name>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Générer CAMPAIGN.json — big idea, messages par cible, recommandations canaux —
depuis PLATFORM.json. Mettre à jour GBD-WIKI.html à la fin.
</objective>

<execution_context>
@/Users/jeremyhervo/.claude/get-brand-done/workflows/campaign.md
</execution_context>

<context>
Nom client : $ARGUMENTS

Outil utilitaire disponible :
node /Users/jeremyhervo/.claude/get-brand-done/bin/gbd-tools.cjs

Les fichiers du projet sont dans : clients/<client-slug>/
</context>

<process>
Suivre intégralement le workflow campaign.md.

Étapes clés :
1. node gbd-tools.cjs status <client-name> — vérifier que PLATFORM.json existe
2. Lire PLATFORM.json depuis clients/<slug>/outputs/
3. Identifier la tension créative, proposer 2-3 big ideas
4. Co-construire le concept choisi
5. Écrire CAMPAIGN.json
6. Régénérer le wiki HTML
</process>
