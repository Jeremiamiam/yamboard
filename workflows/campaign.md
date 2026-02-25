<purpose>
Générer le concept de campagne depuis PLATFORM.json.

L'objectif est de trouver la big idea — le concept créatif central qui traduit
la plateforme de marque en campagne. L'agent travaille au niveau stratégique
et conceptuel. Il ne prescrit pas la direction artistique, les formats de
production, ni le style graphique. C'est la prérogative du DA.

Une bonne big idea est :
- Ancrée dans la vérité différenciante de la plateforme
- Mémorable en une phrase ou un mot
- Déclinable sur plusieurs supports sans perdre sa cohérence
- Impossible à attribuer à une autre marque du secteur
</purpose>

<big_idea_standard>
**Ce qu'est une big idea :**
Un angle créatif central depuis lequel tout le reste découle naturellement.
Elle peut prendre la forme d'un concept ("Real Beauty" — Dove),
d'un insight retourné ("Just Do It" — Nike), d'une tension exploitée
("Think Different" — Apple), ou d'un territoire propriétaire
("Belong Anywhere" — Airbnb).

**Ce qu'elle n'est pas :**
- Un tagline (c'est une conséquence de la big idea)
- Un message publicitaire (c'est une déclinaison)
- Une description de la marque (c'est de la communication institutionnelle)
- Un brief créatif (c'est l'input du DA, pas l'output stratégique)
</big_idea_standard>

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
 GBD ► CAMPAGNE : [CLIENT-NAME]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Plateforme chargée.
Essence : [essence]
Discriminant : [positionnement.discriminant]

Recherche de la big idea...
```
</step>

<step name="identify_creative_tension">
Avant de proposer des concepts, l'agent identifie la tension créative.

La tension créative = l'écart entre ce que le monde est et ce que la marque
veut qu'il soit. C'est le moteur émotionnel de la campagne.

Dériver depuis :
- plateforme.raison_detre
- plateforme.positionnement.discriminant
- pages[9].contenu.essence (insight consommateur)
- angle_strategique.verite_differenciante (depuis CONTRE-BRIEF si disponible)

Formuler la tension comme : "Le monde [état actuel] — [marque] dit [état désiré]."

Afficher brièvement :
```
La tension créative que je vois :
[formulation en 1-2 lignes]

À partir de là, voici 2-3 pistes de big idea.
```
</step>

<step name="propose_big_ideas">
Proposer 2-3 concepts créatifs centraux.

**Format de présentation pour chaque concept :**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Concept [N] — [Titre du concept]**

L'idée : [Le concept en 1 phrase — ce qui fait que toute la campagne tient]

Ce que ça dit au monde : [L'angle de prise de parole — comment la marque
entre dans la conversation]

Exemple de manifestation : [1 exemple concret de comment ce concept
se déploie — pas une direction artistique, une idée de contenu ou de
dispositif]

Pourquoi ça marche pour [client] : [Lien avec la vérité différenciante
de la plateforme]

Risque : [Ce qui peut foirer si mal exécuté]
```

Après les 3 concepts :
```
Lequel te parle ? Tu peux aussi me donner une direction hybride,
ou me dire ce qui te manque dans ces propositions.
```

Attendre la réponse. Intégrer les ajustements si besoin avant de continuer.
</step>

<step name="develop_concept">
Une fois le concept validé, le développer en 3 blocs.

---

### Bloc 1 — Le concept développé

- **Concept statement** : 3-5 lignes qui expliquent l'idée en profondeur
- **Ce que la campagne affirme** : la thèse centrale, formulée comme une prise de position
- **Tagline candidate(s)** : 2-3 propositions de signature de campagne (pas de marque)
- **Wording affichage** : pour chaque tagline, écrire l'accroche + la bodycopy comme si c'était une affiche 4x3. L'accroche = 1 ligne qui arrête. La bodycopy = 2-4 lignes max, ton de la marque, pas de jargon.

---

### Bloc 2 — Messages clés par cible

Pour chaque persona défini dans la plateforme :
- Le message principal (ce qu'on veut que cette personne retienne)
- L'angle d'entrée (par quoi on l'accroche spécifiquement)
- Le ton adapté à cette cible (sans trahir la personnalité de marque)

---

### Bloc 3 — Recommandations canaux

Proposer une logique de déploiement par canaux — pas un plan média détaillé,
mais une hiérarchie stratégique : où la campagne doit vivre en priorité
et pourquoi, en fonction de la cible et du concept.

Format :
```
Canal prioritaire : [canal] — parce que [raison liée au concept + cible]
Canaux secondaires : [canaux] — pour [rôle spécifique dans le dispositif]
À considérer selon budget : [canaux opportunistes]
```

Note : L'agent ne prescrit pas les formats de production, le style graphique,
ni les directions visuelles. C'est la prérogative du DA.
</step>

<step name="write_campaign_json">
Écrire CAMPAIGN.json dans `clients/[client-name]/outputs/`.

```json
{
  "meta": {
    "client": "",
    "date": "",
    "version": "1.0",
    "statut": "Prêt pour production"
  },

  "tension_creative": "",

  "concept": {
    "titre": "",
    "statement": "",
    "prise_de_position": "",
    "taglines": [],
    "wording": [
      {
        "tagline": "",
        "accroche": "",
        "bodycopy": ""
      }
    ]
  },

  "messages": [
    {
      "persona": "",
      "message_principal": "",
      "angle_entree": "",
      "ton": ""
    }
  ],

  "canaux": {
    "prioritaire": {
      "canal": "",
      "raison": ""
    },
    "secondaires": [
      {
        "canal": "",
        "role": ""
      }
    ],
    "selon_budget": []
  },

  "concepts_ecartes": [
    {
      "titre": "",
      "raison": ""
    }
  ]
}
```
</step>

<step name="confirm">
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GBD ► CAMPAGNE CRÉÉE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

clients/[client-name]/outputs/CAMPAIGN.json

Concept retenu : [titre]
[statement en 1 ligne]

Tagline(s) : [liste]

---

▶ Prochaine étape

/gbd_site [client-name]
Architecture et contenus du site depuis la plateforme et la campagne.

---
```
</step>

</process>

<success_criteria>
- Tension créative identifiée et formulée
- 2-3 big ideas distinctes, ancrées dans la plateforme
- Concept validé par l'utilisateur
- Messages différenciés par persona
- Logique canaux cohérente avec le concept et la cible
- Aucune prescription de direction artistique ou de style graphique
- CAMPAIGN.json structuré et exploitable
</success_criteria>
