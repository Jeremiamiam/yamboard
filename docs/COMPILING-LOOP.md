# Boucle "Compiling..." en dev

Si Turbopack recompile en boucle (15+ fois très vite), causes probables :

## 1. Dropbox (le plus probable)

Le projet est dans **Dropbox**. La synchro modifie des fichiers (`.next/`, métadonnées) et déclenche le watcher de Turbopack.

**Solutions :**
- Exclure `.next/` de la synchro Dropbox (Smart Sync ou dossier "à ne pas synchroniser")
- Ou déplacer le projet hors de Dropbox pour le dev (ex. `~/Projects/Yamboard`)

## 2. Tester sans Turbopack

Pour vérifier si c’est Turbopack :

```bash
npx next dev --webpack
```

Si la boucle disparaît avec Webpack, c’est un bug connu de Turbopack (notamment avec certains environnements de fichiers).

## 3. Ce n’est pas les SVG

Les SVG inline (dans les composants) ou dans `public/` ne provoquent pas de boucle de compilation. Le watcher réagit aux changements de fichiers sur disque (Dropbox, éditeur, etc.).
