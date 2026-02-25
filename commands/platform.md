---
name: gbd:platform
description: Génère la plateforme de marque 10 pages depuis le contre-brief
argument-hint: <client-name>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Générer PLATFORM.json — plateforme de marque complète en 10 pages — depuis CONTRE-BRIEF.json.
Mettre à jour GBD-WIKI.html à la fin.
</objective>

<execution_context>
@/Users/jeremyhervo/.claude/get-brand-done/workflows/platform.md
</execution_context>

<context>
Nom client : $ARGUMENTS

Outil utilitaire disponible :
node /Users/jeremyhervo/.claude/get-brand-done/bin/gbd-tools.cjs

Les fichiers du projet sont dans : clients/<client-slug>/
</context>

<process>
Suivre intégralement le workflow platform.md.

Étapes clés :
1. node gbd-tools.cjs status <client-name> — vérifier que CONTRE-BRIEF.json existe
2. Lire CONTRE-BRIEF.json depuis clients/<slug>/outputs/
3. Générer les 10 pages, valider valeurs + manifeste + territoire
4. Écrire PLATFORM.json
5. Régénérer le wiki HTML
</process>
