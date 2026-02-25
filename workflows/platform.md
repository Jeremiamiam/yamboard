<purpose>
Générer la plateforme de marque complète depuis le CONTRE-BRIEF.json.

La plupart des décisions stratégiques sont déjà verrouillées dans le contre-brief.
Ce workflow les développe, les complète, et les met en forme dans un document
de 10 pages prêt à présenter — et dans un JSON structuré pour Figma Slides.

L'agent n'est pas un rédacteur générique. Il écrit comme un stratège de marque
senior qui connaît intimement le client. Chaque formulation doit être
singulière, défendable, impossible à coller sur une autre marque.
</purpose>

<platform_structure>
La plateforme se compose de 10 pages :

| # | Page | Source principale |
|---|------|-------------------|
| 1 | Couverture | meta du projet |
| 2 | Diagnostic de marque | contexte du contre-brief |
| 3 | Raison d'être | raison_detre du contre-brief |
| 4 | Vision & Mission | dérivé de raison_detre + angle |
| 5 | Valeurs | dérivé de personnalite + angle |
| 6 | Cible & Personas | dérivé du dossier client + cible |
| 7 | Positionnement | positionnement du contre-brief |
| 8 | Personnalité & Ton | personnalite + tone_of_voice du contre-brief |
| 9 | Essence & Manifeste | essence du contre-brief + manifeste à générer |
| 10 | Territoire d'expression | dérivé de personnalite + tone_of_voice |

Pages 1, 3, 7, 8 : contenu quasi-direct depuis le contre-brief — à mettre en forme.
Pages 2, 4, 5, 6, 9, 10 : contenu à générer avec validation.
</platform_structure>

<quality_bar>
**Standards de rédaction non négociables :**

- Chaque formulation doit être spécifique à CE client. Test : si on peut remplacer le nom de marque par celui d'un concurrent sans changer un mot, c'est à réécrire.
- Les valeurs ont des preuves concrètes. "Innovation" sans preuve = bullshit. "Nous avons refusé d'accélérer notre process de production malgré la pression des distributeurs" = valeur vécue.
- Le manifeste est de la prose. Pas des bullet points. Pas du jargon corporate. Pas de "Nous sommes fiers de". Il doit pouvoir être lu à voix haute lors d'un lancement.
- Le territoire d'expression est concret : mots-clés par registre, univers à éviter listés.
</quality_bar>

<process>

<step name="initialize">
Charger le projet client.

```
CONTRE-BRIEF = clients/[client-name]/outputs/CONTRE-BRIEF.json
```

Si le fichier n'existe pas :
```
Aucun contre-brief trouvé pour [client-name].
Lance d'abord : /gbd_start [client-name]
```

Afficher :
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GBD ► PLATEFORME DE MARQUE : [CLIENT-NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Contre-brief chargé.
Angle retenu : [angle_strategique.titre]
Mode agence : [meta.mode_agence]

Génération en cours...
```

Vérifier que les champs critiques sont présents dans le contre-brief :
- plateforme.raison_detre
- plateforme.positionnement.phrase_complete
- plateforme.personnalite.traits
- plateforme.essence

Si un champ critique est vide : signaler et demander de compléter le contre-brief avant de continuer.
</step>

<step name="generate_pages">
Générer les 10 pages dans l'ordre. Pour chaque page, produire :
1. Le contenu textuel (pour le document)
2. Les champs JSON (pour Figma Slides)

---

### PAGE 1 — Couverture
*Source : meta*

Champs JSON :
```json
{
  "numero": 1,
  "titre_page": "Couverture",
  "contenu": {
    "nom_marque": "[client]",
    "document": "Plateforme de marque",
    "version": "1.0",
    "date": "[mois année]",
    "mention": "Document de fondation stratégique — Usage interne"
  }
}
```

---

### PAGE 2 — Diagnostic de marque
*Source : contexte du contre-brief → développer en narration*

À partir de : concurrents_redoutes, repoussoirs, angle_strategique, dossier client.

Générer 4 paragraphes :
1. **Le marché** : état du secteur, tendances, ce qui a changé
2. **Le paysage concurrentiel** : qui occupe quoi, les angles saturés
3. **L'espace blanc** : ce que personne ne revendique avec légitimité
4. **L'insight consommateur** : la vérité humaine profonde, formulée comme une tension (Je veux X, mais Y m'en empêche)

L'insight est la phrase la plus importante de cette page. Il doit être spécifique, humain, et créer le pont vers la raison d'être.

---

### PAGE 3 — Raison d'être
*Source : plateforme.raison_detre (direct depuis contre-brief)*

Mettre en forme :
- La phrase de raison d'être en grand format typographique
- Un paragraphe de développement (3-5 lignes) qui ancre cette raison d'être dans le réel

---

### PAGE 4 — Vision & Mission
*Source : à dériver de raison_detre + angle_strategique*

**Vision** : L'état du monde que la marque contribue à créer. Tournée vers l'avenir, inspirante, à horizon 5-10 ans. 1 phrase.

**Mission** : Ce que la marque fait concrètement, pour qui, comment. Schéma : "Nous [action] pour [cible] en [moyen différenciant]". 2-3 phrases.

Distinction critique : la vision est aspirationnelle et intemporelle, la mission est opérationnelle et spécifique.

---

### PAGE 5 — Valeurs
*Source : à dériver de personnalite.traits + angle_strategique*

Générer 3 à 5 valeurs. Chaque valeur :
- Un mot ou groupe de mots qui lui appartient (pas un mot du dictionnaire)
- Une définition propre à la marque (1-2 phrases — ce que ce mot signifie ICI)
- 2-3 comportements concrets qui la prouvent (actions réelles ou attendues)

Test : chaque valeur doit être inapplicable mot pour mot à un concurrent direct.

---

### PAGE 6 — Cible & Personas
*Source : à dériver du dossier client + positionnement.cible*

Générer 1 à 2 personas. Chaque persona :
- Prénom, âge, ville, situation
- Ce qui l'anime (motivations profondes)
- Ce qui la bloque (frustrations réelles)
- Comment elle se raconte sa propre vie (aspiration identitaire)
- Son rapport à la catégorie de marque

Les personas ne sont pas des tableaux démographiques. Ce sont des portraits vivants. Le lecteur doit reconnaître quelqu'un qu'il connaît.

---

### PAGE 7 — Positionnement
*Source : plateforme.positionnement (direct depuis contre-brief)*

Mettre en forme :
1. La phrase de positionnement complète
2. Le discriminant en évidence (le facteur de différenciation le plus décisif)
3. Les piliers (3 max) avec leurs preuves

---

### PAGE 8 — Personnalité & Ton
*Source : plateforme.personnalite + plateforme.tone_of_voice (direct depuis contre-brief)*

Mettre en forme :
1. Les traits de personnalité avec leurs descripteurs
2. Tableau We are / We are never
3. L'archétype
4. Les 3 dimensions tonales avec exemples bien/mal

---

### PAGE 9 — Essence & Manifeste
*Source : plateforme.essence (direct) + manifeste à générer*

**Essence** : telle quelle depuis le contre-brief. Mise en forme typographique forte.

**Manifeste** : à générer. C'est la page la plus exigeante.

Règles d'écriture du manifeste :
- Prose courte. 10 à 15 lignes maximum.
- Rythme varié. Phrases courtes qui frappent, phrases longues qui développent.
- Pas de "Nous sommes fiers", pas de "passion", pas de "excellence".
- Peut commencer par une observation sur le monde, pas sur la marque.
- Doit pouvoir être lu à voix haute lors d'un lancement interne.
- La marque apparaît à la fin, pas au début.
- Ancré dans la vérité différenciante de l'angle retenu.

Référence de niveau : manifeste Airbnb (plateforme-de-marque-light-10pages.md).

---

### PAGE 10 — Territoire d'expression
*Source : à dériver de personnalite + tone_of_voice + angle_strategique*

Générer 2 blocs :
1. **Champs sémantiques** : tableau de mots-clés par registre (3-4 registres)
2. **À éviter** : mots, expressions, clichés du secteur à bannir

Cette page est le pont entre la stratégie et la création. Le DA doit pouvoir s'en emparer le lendemain matin.

</step>

<step name="validate_key_pages">
Après génération, soumettre à validation les 3 pages les plus subjectives.

**Valeurs (page 5) :**
```
Voici les [N] valeurs que je propose pour [client] :

[Valeur 1] — [définition courte]
Preuves : [liste]

[Valeur 2] — ...

Tu veux modifier une formulation, ajouter une valeur, en retirer une ?
```

**Manifeste (page 9) :**
```
Voici le manifeste :

[texte complet]

C'est la vérité telle que je la lis. Tu veux qu'on ajuste le ton,
qu'on mette l'accent ailleurs, qu'on réécrive certaines lignes ?
```

**Territoire d'expression (page 10) :**
```
Voici le territoire d'expression :

[contenu complet]

Des références qui sonnent faux ? Des ambiances à corriger ?
Des mots-clés qui manquent ou qui ne te parlent pas ?
```

Intégrer les retours et mettre à jour le contenu avant d'écrire le JSON final.
</step>

<step name="write_platform_json">
Écrire PLATFORM.json dans `clients/[client-name]/outputs/`.

**Structure :**

```json
{
  "meta": {
    "client": "",
    "document": "Plateforme de marque",
    "version": "1.0",
    "date": "",
    "statut": "Prêt pour brand book"
  },

  "pages": [
    {
      "numero": 1,
      "titre_page": "Couverture",
      "contenu": {
        "nom_marque": "",
        "document": "Plateforme de marque",
        "version": "",
        "date": "",
        "mention": ""
      }
    },
    {
      "numero": 2,
      "titre_page": "Diagnostic de marque",
      "titre_slide": "Où nous en sommes",
      "contenu": {
        "marche": "",
        "paysage_concurrentiel": "",
        "espace_blanc": "",
        "insight_consommateur": ""
      }
    },
    {
      "numero": 3,
      "titre_page": "Raison d'être",
      "titre_slide": "Pourquoi nous existons",
      "contenu": {
        "raison_detre": "",
        "developpement": ""
      }
    },
    {
      "numero": 4,
      "titre_page": "Vision & Mission",
      "titre_slide": "Là où nous allons. Ce que nous faisons.",
      "contenu": {
        "vision": "",
        "mission": ""
      }
    },
    {
      "numero": 5,
      "titre_page": "Valeurs",
      "titre_slide": "Ce en quoi nous croyons",
      "contenu": {
        "valeurs": [
          {
            "titre": "",
            "definition": "",
            "preuves": []
          }
        ]
      }
    },
    {
      "numero": 6,
      "titre_page": "Cible & Personas",
      "titre_slide": "À qui nous parlons",
      "contenu": {
        "personas": [
          {
            "prenom": "",
            "age": "",
            "ville": "",
            "situation": "",
            "motivations": "",
            "frustrations": "",
            "aspiration": "",
            "rapport_categorie": ""
          }
        ]
      }
    },
    {
      "numero": 7,
      "titre_page": "Positionnement",
      "titre_slide": "Notre place dans le monde",
      "contenu": {
        "phrase_complete": "",
        "cible": "",
        "promesse": "",
        "discriminant": "",
        "piliers": [
          {
            "titre": "",
            "description": "",
            "preuve": ""
          }
        ]
      }
    },
    {
      "numero": 8,
      "titre_page": "Personnalité & Ton",
      "titre_slide": "Comment nous nous exprimons",
      "contenu": {
        "traits": [],
        "we_are": [],
        "we_are_never": [],
        "archetype": "",
        "dimensions_ton": [
          {
            "axe": "",
            "description": "",
            "exemple_bien": "",
            "exemple_mal": ""
          }
        ]
      }
    },
    {
      "numero": 9,
      "titre_page": "Essence & Manifeste",
      "titre_slide": "Notre âme en quelques mots",
      "contenu": {
        "essence": "",
        "manifeste": ""
      }
    },
    {
      "numero": 10,
      "titre_page": "Territoire d'expression",
      "titre_slide": "L'univers que nous habitons",
      "contenu": {
        "champs_semantiques": [
          {
            "territoire": "",
            "mots_cles": []
          }
        ],
        "a_eviter": []
      }
    }
  ]
}
```
</step>

<step name="confirm">
Afficher le résumé :

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GBD ► PLATEFORME CRÉÉE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

clients/[client-name]/outputs/PLATFORM.json

10 pages générées :
✓ Couverture
✓ Diagnostic de marque
✓ Raison d'être
✓ Vision & Mission
✓ Valeurs ([N] valeurs)
✓ Cible & Personas ([N] persona(s))
✓ Positionnement
✓ Personnalité & Ton
✓ Essence & Manifeste
✓ Territoire d'expression

---

▶ Prochaine étape

/gbd_brandbook [client-name]
Génère les guidelines visuelles depuis la plateforme.

---
```
</step>

</process>

<success_criteria>
- CONTRE-BRIEF.json chargé et validé
- 10 pages générées sans contenu générique
- Chaque formulation passe le test : inapplicable mot pour mot à un concurrent
- Valeurs, manifeste et territoire validés par l'utilisateur
- PLATFORM.json structuré, copy-pastable dans Figma Slides
- L'utilisateur peut présenter ce document le lendemain matin
</success_criteria>
