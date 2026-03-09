# Audit performance — app entière

## Vue d'ensemble par page

| Page | Requêtes | Problèmes |
|------|----------|-----------|
| `/` (home) | 1 | OK — redirect immédiat |
| `/[clientId]` | 6 + N | Waterfall, N+1 budget, 3× getClients |
| `/[clientId]/[projectId]` | 8 | 3× getClients pour sidebar |
| `/compta` | 5 | 3× getClients, getAllProjects, getAllBudgetProducts (tout le DB !) |
| **Chat Brandon** (context-builders) | 4 à 2N+4 | Selon scope : agency 4, client 1+1+2N, project 5 |

---

## Problèmes systémiques (toutes les pages)

### 1. **getClients × 3 — partout**

Sur **chaque page** qui affiche la sidebar (client, projet, compta) :

```ts
getClients('client')
getClients('prospect')
getClients('archived')
```

→ **3 round-trips** pour la même table, juste pour filtrer par catégorie.

**Impact** : répété sur client page, project page, compta page.

---

### 2. **Waterfall + N+1 — page client**

```
Vague 1 : 6 requêtes (dont 3× getClients)
Vague 2 : N requêtes getBudgetProducts (1 par projet)
```

Avec 5 projets = **11 requêtes**. La vague 2 attend la vague 1.

---

### 3. **Compta : fetch de TOUT le DB**

```ts
getAllProjects()        // TOUS les projets de tous les clients
getAllBudgetProducts()  // TOUS les produits de tous les projets
```

Charge l'intégralité des projets et budget_products.  
Avec 50 projets et 200 produits → **énorme payload** à chaque visite compta.

---

### 4. **Context-builders (Chat Brandon) — N+1**

**buildClientContext** (chat scope client) :
```
1. getClient(clientId)
2. getClientProjects(clientId)
3. getClientDocsWithPinned(clientId) + [getBudgetProducts(p.id), getProjectDocs(p.id)] × N projets
```
→ **3 + 2N requêtes** (waterfall : client → projects → le reste)

**buildAgencyContext** (chat scope agence) :
```
getClients('client') + getClients('prospect') + getAllProjects() + getAllBudgetProducts()
```
→ **4 requêtes**, mais getAllProjects + getAllBudgetProducts = tout le DB.

---

### 5. **Double auth — toutes les requêtes**

- **Middleware** : `getUser()` sur chaque requête (sauf login, static)
- **Layout dashboard** : `getUser()` à nouveau

→ **2 round-trips auth** avant même que la page charge ses données.

---

### 6. **Documents : select('*') avec content**

`getClientDocs`, `getClientDocsWithPinned`, `getProjectDocs` font `select('*')` → chargent le champ `content` (TEXT, potentiellement gros) pour chaque doc.

Pour les listes/chips, on n'a besoin que des métadonnées. Le content sert uniquement dans le viewer.

---

## Synthèse des requêtes par parcours

| Parcours | Requêtes actuelles | Requêtes optimisées |
|----------|--------------------|---------------------|
| Ouvrir page client (5 projets) | 6 + 5 = **11** | **5** |
| Ouvrir page projet | **8** | **5** |
| Ouvrir compta | **5** (dont 2 "tout") | **2** |
| Chat Brandon scope client (5 projets) | 3 + 10 = **13** | **4** |
| Chat Brandon scope agence | **4** | **2** |

---

## Recommandations par priorité

| Priorité | Action | Impact |
|----------|--------|--------|
| **P0** | `getClientsAll()` : 1 requête pour client+prospect+archived | -2 req sur client/project/compta |
| **P0** | `getBudgetProductsForProjects(ids)` : 1 requête au lieu de N | -N req sur page client |
| **P0** | Intégrer budget dans vague 1 (page client) | Supprime waterfall |
| **P1** | Compta : requête filtrée (projects + products par client) au lieu de getAll | Réduit payload drastiquement |
| **P1** | Context-builders : mêmes optimisations (getClientsAll, batch budget) | Chat plus rapide |
| **P1** | Documents : select sans `content` pour les listes | Moins de données |
| **P2** | Éviter double getUser (middleware vs layout) | -1 round-trip |
| **P2** | Layout : cache/suspense pour sidebar (données partagées) | Éviter refetch si déjà en cache |

---

## Script de mesure

```bash
npx tsx scripts/measure-client-page.ts <clientId>
```
