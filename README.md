# getBrandon Dashboard (standalone)

Vue clients + wikis en app Next.js séparée. **Recommandé :** utiliser la webapp (`../webapp`) qui intègre déjà cette vue — les clés sont dans `webapp/.env.local`.

## Setup (si utilisé en standalone)

1. Copie `.env.local.example` en `.env.local` avec les clés Supabase.
2. `npm run sync-dashboard` depuis la racine getBrandon (lit `webapp/.env.local`).
3. `npm run dev`
