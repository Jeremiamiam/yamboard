<purpose>
Générer GBD-WIKI.html — le livrable humain du projet client.

Un fichier HTML statique avec navigation latérale, résumés exécutifs (TL;DR),
et le contenu complet de chaque livrable. Ouvrable dans n'importe quel browser,
partageable par email ou Dropbox. Aucune dépendance externe.

Ce workflow est appelé automatiquement à la fin de chaque commande GBD,
et disponible manuellement via /gbd_wiki [client-name].

Le wiki n'est pas un rapport — c'est un outil de travail et de présentation.
Le TL;DR est conçu pour quelqu'un qui refuse de lire. Le contenu complet
est là pour ceux qui veulent creuser.
</purpose>

<html_design>
**Principes visuels :**
- Fond blanc, typographie noire — sobre et pro
- Sidebar fixe à gauche (220px), contenu scrollable à droite
- Navigation : logo GBD + nom client en haut, liens par section
- Chaque section commence par un TL;DR en encadré coloré
- Titres clairs, hiérarchie lisible, espace blanc généreux
- Pas de framework externe. CSS inline dans le `<style>` du fichier.
- Responsive basique : sidebar se replie en top nav sous 768px

**Palette :**
- Accent : #1a1a1a (presque noir)
- TL;DR background : #f5f5f0 (crème léger)
- Séparateurs : #e5e5e5
- Texte principal : #333
- Texte secondaire : #777
</html_design>

<process>

<step name="initialize">
Identifier les JSONs disponibles dans `clients/[client-name]/outputs/`.

Charger ceux qui existent parmi :
- CONTRE-BRIEF.json
- PLATFORM.json
- CAMPAIGN.json
- SITE.json

Si aucun JSON disponible :
```
Aucun livrable trouvé pour [client-name].
Lance d'abord : /gbd_start [client-name]
```

Construire la liste des sections à inclure selon ce qui est disponible.
</step>

<step name="build_html">
Générer le fichier HTML complet.

**Structure HTML :**

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GBD — [Client Name]</title>
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 15px;
      line-height: 1.7;
      color: #333;
      background: #fff;
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      width: 220px;
      min-width: 220px;
      background: #fafafa;
      border-right: 1px solid #e5e5e5;
      padding: 32px 20px;
      position: fixed;
      top: 0; left: 0;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar-brand {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 4px;
    }

    .sidebar-client {
      font-size: 17px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 32px;
      line-height: 1.3;
    }

    .sidebar-nav { list-style: none; }

    .sidebar-nav li { margin-bottom: 4px; }

    .sidebar-nav a {
      display: block;
      padding: 6px 10px;
      border-radius: 6px;
      color: #555;
      text-decoration: none;
      font-size: 13px;
      transition: background 0.15s, color 0.15s;
    }

    .sidebar-nav a:hover,
    .sidebar-nav a.active {
      background: #efefef;
      color: #1a1a1a;
    }

    .sidebar-nav .nav-section-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #bbb;
      padding: 16px 10px 4px;
    }

    /* Main content */
    .main {
      margin-left: 220px;
      flex: 1;
      padding: 60px 64px;
      max-width: 860px;
    }

    /* Section */
    .section {
      margin-bottom: 80px;
      padding-bottom: 80px;
      border-bottom: 1px solid #e5e5e5;
    }

    .section:last-child { border-bottom: none; }

    .section-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #bbb;
      margin-bottom: 8px;
    }

    .section-title {
      font-size: 26px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 24px;
      line-height: 1.3;
    }

    /* TL;DR */
    .tldr {
      background: #f5f5f0;
      border-left: 3px solid #1a1a1a;
      border-radius: 0 8px 8px 0;
      padding: 20px 24px;
      margin-bottom: 40px;
    }

    .tldr-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #999;
      margin-bottom: 10px;
    }

    .tldr ul { list-style: none; }

    .tldr ul li {
      font-size: 14px;
      color: #333;
      padding: 4px 0;
      padding-left: 16px;
      position: relative;
    }

    .tldr ul li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #999;
    }

    /* Content blocks */
    .block { margin-bottom: 32px; }

    .block-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #999;
      margin-bottom: 8px;
    }

    .block-content {
      font-size: 15px;
      color: #333;
      line-height: 1.7;
    }

    .block-content p { margin-bottom: 12px; }

    /* Tags / Pills */
    .tags { display: flex; flex-wrap: wrap; gap: 8px; }

    .tag {
      background: #f0f0f0;
      border-radius: 4px;
      padding: 4px 10px;
      font-size: 13px;
      color: #555;
    }

    .tag.negative {
      background: #fff0f0;
      color: #c00;
    }

    /* We are / We are never table */
    .we-table { width: 100%; border-collapse: collapse; }

    .we-table th {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #999;
      padding: 8px 12px;
      text-align: left;
      border-bottom: 1px solid #e5e5e5;
    }

    .we-table td {
      padding: 10px 12px;
      font-size: 14px;
      border-bottom: 1px solid #f0f0f0;
    }

    .we-table td:first-child { color: #1a1a1a; }
    .we-table td:last-child { color: #c00; }

    /* Pilier / Valeur card */
    .card {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 12px;
    }

    .card-title {
      font-weight: 700;
      font-size: 15px;
      margin-bottom: 6px;
      color: #1a1a1a;
    }

    .card-sub {
      font-size: 13px;
      color: #777;
      margin-bottom: 8px;
    }

    .card-proof {
      font-size: 12px;
      color: #999;
      font-style: italic;
    }

    /* Essence */
    .essence-block {
      text-align: center;
      padding: 48px;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      margin: 32px 0;
    }

    .essence-text {
      font-size: 36px;
      font-weight: 800;
      color: #1a1a1a;
      letter-spacing: -0.02em;
    }

    /* Manifeste */
    .manifeste {
      font-size: 16px;
      line-height: 2;
      color: #333;
      font-style: italic;
      border-left: 2px solid #e5e5e5;
      padding-left: 24px;
      margin: 24px 0;
    }

    /* Generated date */
    .footer {
      margin-top: 80px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #bbb;
    }

    /* Responsive */
    @media (max-width: 768px) {
      body { flex-direction: column; }
      .sidebar {
        position: relative;
        width: 100%;
        height: auto;
        border-right: none;
        border-bottom: 1px solid #e5e5e5;
      }
      .main { margin-left: 0; padding: 32px 24px; }
    }
  </style>
</head>
<body>

  <aside class="sidebar">
    <div class="sidebar-brand">GBD</div>
    <div class="sidebar-client">[CLIENT NAME]</div>
    <ul class="sidebar-nav">
      <li class="nav-section-label">Livrables</li>
      <!-- Générer un lien par section disponible -->
      [SI CONTRE-BRIEF] <li><a href="#contre-brief">Contre-brief</a></li>
      [SI PLATFORM] <li><a href="#plateforme">Plateforme de marque</a></li>
      [SI CAMPAIGN] <li><a href="#campagne">Campagne</a></li>
      [SI SITE] <li><a href="#site">Site web</a></li>
    </ul>
  </aside>

  <main class="main">

    <!-- SECTION CONTRE-BRIEF (si disponible) -->
    <section class="section" id="contre-brief">
      <div class="section-label">Livrable 1</div>
      <h1 class="section-title">Contre-brief</h1>

      <!-- TL;DR -->
      <div class="tldr">
        <div class="tldr-label">TL;DR — 30 secondes</div>
        <ul>
          <!-- 4-5 points max, extraits des données clés du contre-brief -->
          <li>[Déclencheur en 1 ligne]</li>
          <li>[Angle retenu en 1 ligne]</li>
          <li>[Discriminant en 1 ligne]</li>
          <li>[Essence en 1 ligne]</li>
          <li>[1 chose à ne surtout pas faire]</li>
        </ul>
      </div>

      <!-- Contenu complet -->
      <div class="block">
        <div class="block-title">Angle stratégique retenu</div>
        <div class="block-content">
          <p><strong>[angle.titre]</strong></p>
          <p>[angle.verite_differenciante]</p>
          <p>[angle.territoire]</p>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Angles écartés</div>
        <div class="block-content">
          <!-- Pour chaque angle écarté -->
          <p><strong>[titre]</strong> — [raison]</p>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Concurrents redoutés</div>
        <div class="tags">
          <!-- Pour chaque concurrent redouté -->
          <span class="tag">[concurrent]</span>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Repoussoirs — ce que la marque ne doit jamais être</div>
        <div class="tags">
          <!-- Pour chaque repoussoir -->
          <span class="tag negative">[repoussoir]</span>
        </div>
      </div>

    </section>

    <!-- SECTION PLATEFORME DE MARQUE (si disponible) -->
    <section class="section" id="plateforme">
      <div class="section-label">Livrable 2</div>
      <h1 class="section-title">Plateforme de marque</h1>

      <!-- TL;DR -->
      <div class="tldr">
        <div class="tldr-label">TL;DR — 30 secondes</div>
        <ul>
          <li>[Raison d'être en 1 ligne]</li>
          <li>[Vision en 1 ligne]</li>
          <li>[Discriminant de positionnement]</li>
          <li>[Archétype + 2 traits de personnalité]</li>
          <li>[Essence]</li>
        </ul>
      </div>

      <div class="block">
        <div class="block-title">Raison d'être</div>
        <div class="block-content"><p>[raison_detre]</p></div>
      </div>

      <div class="block">
        <div class="block-title">Vision</div>
        <div class="block-content"><p>[vision]</p></div>
      </div>

      <div class="block">
        <div class="block-title">Mission</div>
        <div class="block-content"><p>[mission]</p></div>
      </div>

      <div class="block">
        <div class="block-title">Valeurs</div>
        <!-- Pour chaque valeur -->
        <div class="card">
          <div class="card-title">[valeur.titre]</div>
          <div class="card-sub">[valeur.definition]</div>
          <div class="card-proof">Preuves : [valeur.preuves joints par " · "]</div>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Positionnement</div>
        <div class="block-content">
          <p><em>[phrase_complete]</em></p>
          <p><strong>Discriminant :</strong> [discriminant]</p>
        </div>
        <!-- Piliers -->
        <div class="card">
          <div class="card-title">[pilier.titre]</div>
          <div class="card-sub">[pilier.description]</div>
          <div class="card-proof">[pilier.preuve]</div>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Personnalité</div>
        <table class="we-table">
          <thead>
            <tr><th>We are</th><th>We are never</th></tr>
          </thead>
          <tbody>
            <!-- Pour chaque paire -->
            <tr><td>[we_are]</td><td>[we_are_never]</td></tr>
          </tbody>
        </table>
      </div>

      <div class="essence-block">
        <div class="essence-text">[essence]</div>
      </div>

      <div class="block">
        <div class="block-title">Manifeste</div>
        <div class="manifeste">[manifeste — avec <br> pour les sauts de ligne]</div>
      </div>

    </section>

    <!-- SECTION CAMPAGNE (si disponible) -->
    <section class="section" id="campagne">
      <div class="section-label">Livrable 3</div>
      <h1 class="section-title">Campagne</h1>

      <div class="tldr">
        <div class="tldr-label">TL;DR — 30 secondes</div>
        <ul>
          <li>[Tension créative en 1 ligne]</li>
          <li>[Concept en 1 ligne]</li>
          <li>[Tagline principale]</li>
          <li>[Canal prioritaire + raison]</li>
        </ul>
      </div>

      <div class="block">
        <div class="block-title">Tension créative</div>
        <div class="block-content"><p>[tension_creative]</p></div>
      </div>

      <div class="block">
        <div class="block-title">Concept central — [concept.titre]</div>
        <div class="block-content">
          <p>[concept.statement]</p>
          <p><strong>Prise de position :</strong> [concept.prise_de_position]</p>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Taglines</div>
        <div class="tags">
          <!-- Pour chaque tagline -->
          <span class="tag">[tagline]</span>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Messages par persona</div>
        <!-- Pour chaque message -->
        <div class="card">
          <div class="card-title">[persona]</div>
          <div class="card-sub">[message_principal]</div>
          <div class="card-proof">Angle d'entrée : [angle_entree]</div>
        </div>
      </div>

      <div class="block">
        <div class="block-title">Canaux</div>
        <div class="block-content">
          <p><strong>Prioritaire :</strong> [canal.canal] — [canal.raison]</p>
          <!-- Canaux secondaires -->
          <p><strong>Secondaires :</strong> [liste]</p>
        </div>
      </div>

    </section>

    <!-- SECTION SITE WEB (si disponible) -->
    <section class="section" id="site">
      <div class="section-label">Livrable 4</div>
      <h1 class="section-title">Site web</h1>

      <div class="tldr">
        <div class="tldr-label">TL;DR — 30 secondes</div>
        <ul>
          <li>[N] pages — [liste des pages principales]</li>
          <li>[Logique de parcours en 1 ligne]</li>
          <li>[Titre H1 de la home]</li>
        </ul>
      </div>

      <div class="block">
        <div class="block-title">Architecture</div>
        <!-- Pour chaque page principale -->
        <div class="card">
          <div class="card-title">[page.page] <span style="font-weight:400;color:#999">[page.url_slug]</span></div>
          <div class="card-sub">[page.role]</div>
          <div class="card-proof">[page.objectif_visiteur]</div>
        </div>
      </div>

      <!-- Pour CHAQUE page dans contenus, générer un bloc -->
      <!-- Boucle sur SITE.json contenus[] -->
      <div class="block">
        <div class="block-title">Contenus — [page.page]</div>
        <div class="block-content">
          <p><strong>H1 :</strong> [section.h1]</p>
          <p><strong>Sous-titre :</strong> [section.sous_titre]</p>
          <p>[section.corps]</p>
          <!-- CTA si présent -->
          <p><strong>CTA :</strong> [section.cta_principal.texte]</p>
        </div>
      </div>
      <!-- Répéter pour chaque page -->

    </section>

    <div class="footer">
      Généré par GBD le [date] · [client-name]
    </div>

  </main>

  <script>
    // Highlight active nav item on scroll
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.sidebar-nav a');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => link.classList.remove('active'));
          const activeLink = document.querySelector(`.sidebar-nav a[href="#${entry.target.id}"]`);
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, { threshold: 0.3 });

    sections.forEach(section => observer.observe(section));
  </script>

</body>
</html>
```

**Règles de génération :**
- Chaque champ JSON est injecté à sa place dans le template HTML
- Les listes (traits, piliers, valeurs) génèrent autant de blocs/cards que nécessaire
- Le TL;DR est généré par l'agent (pas copié depuis les JSONs) — 4-5 points distillés, formulés comme des phrases d'action
- Les sections absentes (pas de JSON disponible) ne s'affichent pas
- Le manifeste : chaque saut de ligne dans le JSON devient un `<br>` dans le HTML
</step>

<step name="write_file">
Écrire le fichier :
```
clients/[client-name]/outputs/GBD-WIKI.html
```

Afficher :
```
Wiki mis à jour : clients/[client-name]/outputs/GBD-WIKI.html
Ouvre le fichier dans ton browser pour voir le résultat.
```
</step>

</process>

<success_criteria>
- Le wiki s'ouvre dans n'importe quel browser sans installation
- Chaque livrable disponible a sa section avec TL;DR
- TL;DR = 4-5 bullets max, lisible en 30 secondes
- Sidebar de navigation fonctionnelle
- L'essence est mise en valeur visuellement
- Le manifeste est lisible, mis en forme
- Le fichier est autonome (pas de dépendances externes, pas de CDN)
</success_criteria>
