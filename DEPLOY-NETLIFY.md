# Netlify — déploiement auto

Le repo est en monorepo : CLI + webapp.

## Connecter Netlify à Git

1. [Netlify](https://app.netlify.com/projects/get-brandon) → **Site configuration** → **Build & deploy** → **Link site to Git**
2. Connecte **GitHub** → sélectionne `Jeremiamiam/get-brandon`
3. **Build settings :**
   - **Base directory :** `webapp`
   - **Build command :** `npm run build`
   - **Branch :** `main`
4. Les variables d'environnement sont déjà configurées.

Après ça, chaque push sur `main` déclenche un déploiement auto.

## Déploiement manuel

```bash
cd webapp && npx netlify deploy --build --prod --site c45fd042-031b-47a6-bdad-7a4175106210
```
