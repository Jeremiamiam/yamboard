# Déploiement getBrandon sur Netlify

## 1. Prérequis

- Compte Netlify
- Repo Git (GitHub, GitLab ou Bitbucket) avec la webapp
- Projet Supabase getBrandon configuré

## 2. Connexion du repo

1. Va sur [app.netlify.com](https://app.netlify.com)
2. **Add new site** → **Import an existing project**
3. Connecte ton provider Git et sélectionne le repo contenant la **webapp**
4. **Important :** Si le repo contient getBrandon + webapp, configure :
   - **Base directory :** `webapp` (ou le chemin vers le dossier webapp)
   - **Build command :** `npm run build`
   - **Publish directory :** `.next`

## 3. Variables d'environnement

Dans Netlify : **Site settings** → **Environment variables** → **Add variable** / **Import from .env`

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Oui | URL du projet Supabase getBrandon |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Oui | Clé anon (publishable) Supabase |
| `ANTHROPIC_API_KEY` | Oui | Clé API Anthropic pour le chat |

## 4. Premier déploiement

1. Sauvegarde les variables
2. **Deploy site** (ou push sur la branche connectée)
3. Netlify build et déploie automatiquement

## 5. Sync des clients (CLI → Supabase)

Le dashboard clients lit depuis Supabase. Pour mettre à jour :

```bash
cd getBrandon
npm run sync-dashboard
```

Le script lit `webapp/.env.local` (ou `.env`). En local, assure-toi d’avoir `SUPABASE_SERVICE_ROLE_KEY` pour le sync.

## 6. Points d’attention

- **Timeout chat :** L’API `/api/chat` a `maxDuration = 300` (5 min). Netlify limite par défaut à 60 s. Si les workflows dépassent, envisager Netlify Pro ou une autre stratégie (Background Functions, etc.).
- **Auth Supabase :** Vérifie que l’URL du site Netlify est dans les URLs autorisées (Supabase → Authentication → URL Configuration).
- **Base directory :** Si webapp est dans un sous-dossier, configure-le dans les paramètres de build Netlify.
