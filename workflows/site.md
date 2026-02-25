<purpose>
Générer l'architecture et les contenus du site depuis PLATFORM.json.

Le site est un livrable indépendant — il n'est pas lié à la campagne.
Il s'appuie uniquement sur la plateforme de marque.

Deux phases distinctes :
1. Architecture — structure de navigation, pages, intention de chaque page
2. Contenus — textes rédigés page par page, prêts à intégrer

La phase 1 est validée avant de passer à la phase 2.

Le site est le prolongement de la plateforme de marque — pas une brochure produit.
Chaque page doit incarner la personnalité et le ton de la marque, pas seulement
informer. Le visiteur doit ressentir la marque avant même de lire le contenu.
</purpose>

<writing_standards>
**Standards de rédaction pour les contenus site :**

- Titres (H1, titres de section) : audacieux, dans le ton de la marque — jamais descriptifs.
  Un titre ne dit pas ce qu'est la page, il crée une émotion ou une tension.
  Mauvais : "Nos services". Bien : "Ce qu'on fait, et pourquoi ça change tout."
- Sous-titres : développent l'élan du titre, pas un résumé — une promesse ou une provocation douce
- Corps de texte : voix active, phrases courtes, zéro jargon corporate
- CTAs : dans le ton. Pas "En savoir plus", pas "Découvrir". Quelque chose qui sonne comme la marque.
- Chaque page a un objectif unique : informer OU émouvoir OU convertir — pas les trois à la fois

**Test de cohérence :** Chaque texte doit sonner comme cette marque-là.
Si on peut le coller sur le site d'un concurrent sans changer un mot, c'est à réécrire.
</writing_standards>

<process>

<step name="initialize">
Charger les fichiers du projet :

```
PLATFORM = clients/[client-name]/outputs/PLATFORM.json
```

Si PLATFORM.json absent :
```
Aucune plateforme trouvée pour [client-name].
Lance d'abord : /gbd_platform [client-name]
```

Afficher :
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GBD ► SITE : [CLIENT-NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1 : Architecture
Phase 2 : Contenus

Démarrage par l'architecture...
```
</step>

<step name="phase1_architecture">
## PHASE 1 — Architecture

### Analyser le contexte

Depuis PLATFORM.json, extraire :
- L'essence et la raison d'être (ce que le site doit incarner)
- Les personas (qui visite, avec quel besoin)
- Le positionnement (ce que le site doit prouver)
- La personnalité et le tone of voice (comment le site doit parler)
- Le territoire d'expression (les mots-clés, les ambiances, les références)

### Proposer l'architecture

Générer une proposition de structure de site :
- Navigation principale (5-7 items max)
- Pages secondaires si nécessaires
- Pour chaque page : titre, rôle, objectif, public cible principal

**Format de présentation :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ARCHITECTURE PROPOSÉE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Navigation principale :
[Nom de page] → [Rôle en 1 ligne]
[Nom de page] → [Rôle en 1 ligne]
...

Pages secondaires :
[Nom] → [Rôle]
...

Logique de parcours :
[Comment un visiteur qui arrive depuis la home devrait se déplacer
et pourquoi — la narrative du site]
```

Utiliser AskUserQuestion :
- header: "Architecture"
- question: "L'architecture te convient ? Tu veux ajouter, retirer ou renommer des pages ?"
- options:
  - "Elle me convient" → passer à la génération des intentions
  - "Modifier" → appliquer les modifications demandées et reproposer
  - "Partir de zéro" → l'utilisateur dicte sa propre structure

### Générer les intentions de page

Pour chaque page validée, produire une fiche :

```json
{
  "page": "[nom]",
  "url_slug": "/[slug]",
  "role": "[ce que cette page fait pour la marque]",
  "objectif_visiteur": "[ce que le visiteur doit faire/ressentir/comprendre]",
  "public_principal": "[persona ou type de visiteur]",
  "ton_specifique": "[ajustement de ton pour cette page si applicable]",
  "elements_cles": ["élément 1", "élément 2", "..."]
}
```

Valider l'ensemble des fiches avec l'utilisateur avant de passer à la phase 2.

```
Architecture finalisée : [N] pages

→ "Générer les contenus" pour passer à la phase 2
→ "Modifier une fiche" pour ajuster une page
```
</step>

<step name="phase2_contents">
## PHASE 2 — Contenus

Générer les contenus page par page, dans l'ordre de la navigation.

**Pour chaque page, produire :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PAGE : [NOM]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TITRE PRINCIPAL (H1)
[Texte — audacieux, pas descriptif]

SOUS-TITRE
[Texte — prolonge l'élan du titre, crée l'envie de lire]

SECTION 1 — [Nom de la section]
Titre de section : [texte]
Corps : [texte]

SECTION 2 — [Nom de la section]
Titre de section : [texte]
Corps : [texte]

CTA PRINCIPAL
[Texte du bouton] → [Destination]

CTA SECONDAIRE (si applicable)
[Texte du bouton] → [Destination]
```

Après chaque page ou groupe de pages cohérent, vérification :
```
Pages [X] et [Y] rédigées.
Tu veux ajuster quelque chose avant de continuer ?
→ "Continuer" / "Modifier [page]"
```

### Pages prioritaires à valider

Ces pages sont les plus critiques — les soumettre explicitement à validation :
- **Home** : c'est la première impression, elle doit incarner l'essence
- **À propos / Manifeste** : c'est l'expression la plus directe de la raison d'être
- **Page de contact** : le ton sur cette page révèle beaucoup de la personnalité
</step>

<step name="write_site_json">
Écrire SITE.json dans `clients/[client-name]/outputs/`.

```json
{
  "meta": {
    "client": "",
    "date": "",
    "version": "1.0",
    "statut": "Prêt pour intégration"
  },

  "architecture": {
    "navigation_principale": [
      {
        "page": "",
        "url_slug": "",
        "role": "",
        "objectif_visiteur": "",
        "public_principal": "",
        "ton_specifique": "",
        "elements_cles": []
      }
    ],
    "pages_secondaires": [
      {
        "page": "",
        "url_slug": "",
        "role": ""
      }
    ],
    "logique_parcours": ""
  },

  "contenus": [
    {
      "page": "",
      "url_slug": "",
      "sections": [
        {
          "nom": "",
          "h1": "",
          "sous_titre": "",
          "corps": "",
          "cta_principal": {
            "texte": "",
            "destination": ""
          },
          "cta_secondaire": {
            "texte": "",
            "destination": ""
          }
        }
      ]
    }
  ]
}
```
</step>

<step name="confirm">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GBD ► SITE CRÉÉ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

clients/[client-name]/outputs/SITE.json

Architecture : [N] pages
Contenus : [N] pages rédigées

Pages principales :
[liste des pages avec leur slug]

---

▶ Livrables disponibles

clients/[client-name]/outputs/
  CONTRE-BRIEF.json
  PLATFORM.json
  CAMPAIGN.json
  SITE.json

Tous les JSONs sont prêts pour tes templates Figma Slides.

---
```
</step>

</process>

<success_criteria>
- Architecture validée avant de passer aux contenus
- Chaque page a un rôle unique et défini
- Titres audacieux — jamais descriptifs, toujours dans le ton de la marque
- Les contenus sonnent comme la marque — pas comme un site générique
- Home, À propos et Contact validés explicitement
- SITE.json structuré et copy-pastable dans Figma
</success_criteria>
