# Pitfalls — GET BRANDON Web App

## Vercel / Streaming Timeouts

### Piège : Limite de 10s sur les Hobby plans, 60s sur Pro pour les Serverless Functions
**Piège** : Les routes API Next.js (App Router) sont des Serverless Functions sur Vercel. Par défaut, elles ont un timeout de 10s (Hobby) ou 60s (Pro). Un stream Anthropic qui dure 3-5 minutes dépasse largement ces limites, causant une coupure silencieuse côté serveur alors que le client attend encore.

**Symptôme** : Le stream s'arrête net après 60s sans erreur explicite côté client. La réponse est tronquée. Le client peut rester bloqué en état "chargement". Dans les logs Vercel, on voit `FUNCTION_INVOCATION_TIMEOUT`.

**Solution** : Configurer `maxDuration` dans la route API avec la syntaxe App Router :
```ts
// app/api/stream/route.ts
export const maxDuration = 300; // 5 minutes, nécessite plan Pro ou supérieur
```
Vérifier que le plan Vercel supporte cette durée (Pro = 300s max sur les Edge Functions, 900s sur les Serverless avec Fluid compute). Envisager Vercel Edge Runtime pour les streams longs : les Edge Functions n'ont pas le même modèle de timeout mais ont d'autres contraintes (pas de Node.js natif).

**Phase concernée** : Avant le premier déploiement sur Vercel. À configurer dès la création de la première route de streaming.

---

### Piège : Edge Runtime vs Node.js Runtime — incompatibilité avec le SDK Anthropic
**Piège** : Le SDK `@anthropic-ai/sdk` utilise des APIs Node.js (`Buffer`, streams Node natifs). Si la route est configurée en Edge Runtime (`export const runtime = 'edge'`), certaines versions du SDK lèvent des erreurs à l'import ou au runtime car l'Edge Runtime est une implémentation V8 partielle sans les modules Node.js.

**Symptôme** : Erreur au déploiement ou au premier appel : `Module not found: Can't resolve 'node:stream'` ou `ReferenceError: Buffer is not defined`. Fonctionne en local (Node.js) mais pas sur Vercel Edge.

**Solution** : Rester sur le Node.js Runtime par défaut pour les routes Anthropic. Ne pas ajouter `export const runtime = 'edge'`. Utiliser `maxDuration` pour étendre le timeout plutôt que de basculer sur Edge. Si Edge est requis, utiliser le SDK avec le helper `toReadableStream()` qui produit des Web Streams compatibles Edge, et vérifier la compatibilité de chaque version du SDK.

**Phase concernée** : Première configuration des routes API de streaming.

---

### Piège : La connexion client se ferme mais la Serverless Function continue de tourner (et facturer)
**Piège** : Si l'utilisateur ferme l'onglet ou navigue pendant un stream long, la connexion SSE côté client est coupée. Côté Vercel, la Serverless Function continue de s'exécuter et d'appeler l'API Anthropic jusqu'à la fin ou jusqu'au timeout. Résultat : tokens consommés et compute facturé inutilement.

**Symptôme** : Dans les logs Anthropic, des completions complètes pour des sessions dont l'utilisateur est parti. Factures Vercel et Anthropic élevées sans corrélation avec l'usage réel perçu.

**Solution** : Utiliser le signal d'annulation avec `AbortController` côté serveur, lié au signal de la `Request` :
```ts
export async function POST(req: Request) {
  const stream = await anthropic.messages.stream({
    ...params,
    signal: req.signal, // annulation automatique si le client déconnecte
  });
}
```
L'objet `Request` de l'App Router expose un `signal` qui est aborted quand la connexion client se ferme. Le SDK Anthropic respecte ce signal et annule l'appel HTTP en cours.

**Phase concernée** : Dès l'écriture de la première route de streaming, avant mise en production.

---

## Supabase — Gestion de l'État de Conversation Multi-turns

### Piège : Stocker les messages complets dans une seule colonne JSONB sans pagination
**Piège** : Modéliser une conversation comme un tableau JSONB dans une seule ligne Supabase (`conversations.messages = [{role, content}, ...]`). Après 20-30 échanges verbeux (typique pour GBD), la colonne dépasse facilement 1-2 MB. Chaque appel recharge l'intégralité de l'historique pour le reconstruire et l'envoyer à Anthropic.

**Symptôme** : Latence croissante des requêtes Supabase. Timeouts sur les conversations longues. Coût réseau élevé entre Vercel et Supabase. Dépassement potentiel des limites de taille de row Supabase (maximum recommandé ~8KB par row pour des performances optimales).

**Solution** : Modéliser avec une table `messages` séparée (1 row = 1 message) :
```sql
messages (
  id uuid primary key,
  conversation_id uuid references conversations(id),
  role text check (role in ('user', 'assistant')),
  content text,
  token_count int,
  created_at timestamptz default now()
)
```
Charger uniquement les N derniers messages pour construire le contexte Anthropic. Implémenter une fenêtre glissante côté serveur pour respecter la limite de context window d'Anthropic (200k tokens pour Claude 3.5) tout en maîtrisant les coûts.

**Phase concernée** : Conception du schéma DB, avant toute écriture de code API.

---

### Piège : Race condition sur l'écriture des messages en streaming
**Piège** : En streaming, on veut sauvegarder le message de l'assistant progressivement (ou à la fin). Si on écrit le message final dans Supabase après le stream, et que le réseau coupe entre la fin du stream Anthropic et l'écriture en DB, le message est perdu. L'utilisateur a vu la réponse à l'écran mais elle n'est pas en base.

**Symptôme** : Historique de conversation incohérent côté DB. L'utilisateur recharge la page et voit des conversations tronquées. Messages manquants qui ne correspondent pas à ce que l'utilisateur a vu.

**Solution** : Écrire le message assistant en deux temps : créer un row `pending` au début du stream, puis le mettre à jour avec le contenu complet à la fin (`on_stream_end`). Si le stream échoue à mi-chemin, le row `pending` peut être détecté et nettoyé. Alternative : utiliser les Supabase Realtime + une table de chunks intermédiaires pour la durabilité.
```ts
// Créer le message vide au début
const { data: msgRow } = await supabase
  .from('messages')
  .insert({ conversation_id, role: 'assistant', content: '', status: 'streaming' })
  .select().single();

// À la fin du stream
await supabase.from('messages')
  .update({ content: fullText, status: 'complete', token_count: usage.output_tokens })
  .eq('id', msgRow.id);
```

**Phase concernée** : Lors de l'intégration Anthropic-Supabase, avant la mise en production.

---

### Piège : Pas de limite sur la reconstruction du contexte envoyé à Anthropic
**Piège** : Recharger tous les messages d'une conversation et les envoyer tels quels à Anthropic sans vérifier la taille totale. Sur des workflows GBD verbeux, le contexte peut dépasser la context window ou générer une facture tokens inattendue.

**Symptôme** : Erreur Anthropic `context_length_exceeded`. Ou absence d'erreur mais factures tokens anormalement élevées. Latence croissante des appels Anthropic au fil de la conversation.

**Solution** : Implémenter une fonction de troncature du contexte côté serveur avant chaque appel Anthropic. Utiliser `token_count` stocké par message pour calculer le total et tronquer les messages les plus anciens en conservant toujours le message système. Envisager de stocker un résumé de conversation périodique (tous les N messages) pour comprimer l'historique sans perdre le contexte métier.

**Phase concernée** : Lors de l'écriture de la logique d'appel Anthropic, avant la première démo utilisateur.

---

## Upload de Fichiers vers Supabase Storage

### Piège : Uploader les fichiers via la route API Next.js au lieu d'un upload direct client-side
**Piège** : Faire transiter les fichiers (PDFs, docs) par la Serverless Function Next.js avant de les envoyer à Supabase Storage. Un PDF de 10 MB transite deux fois sur le réseau (client → Vercel → Supabase) et consomme la mémoire de la fonction (limite à 1GB sur Vercel, mais le parsing mémoire + le timeout sont des risques réels).

**Symptôme** : Timeouts sur l'upload de gros fichiers. Erreurs `PayloadTooLargeError` (Next.js limite le body à 4MB par défaut). Mémoire Serverless Function saturée sur des PDFs lourds.

**Solution** : Utiliser les uploads directs depuis le client via les signed URLs Supabase. La route API génère uniquement une signed URL, le client upload directement vers Supabase Storage :
```ts
// Route API : générer la signed URL
const { data } = await supabase.storage
  .from('documents')
  .createSignedUploadUrl(`${userId}/${filename}`);
return Response.json({ signedUrl: data.signedUrl, path: data.path });

// Client : upload direct
await fetch(signedUrl, { method: 'PUT', body: file });
```
Si le passage par l'API est nécessaire (validation, virus scan), augmenter `bodySizeLimit` dans `next.config.js` et configurer `maxDuration` sur la route d'upload.

**Phase concernée** : Lors de l'implémentation de la fonctionnalité d'upload, avant tout test avec de vrais fichiers.

---

### Piège : Absence de validation du type MIME côté serveur
**Piège** : Valider uniquement l'extension du fichier côté client. Un fichier malveillant renommé `.pdf` peut être uploadé vers Supabase Storage et ensuite passé à Anthropic (via l'API Files ou en extrayant le contenu). Anthropic peut rejeter le fichier ou, pire, un exécutable est stocké dans le bucket.

**Symptôme** : Erreurs Anthropic inattendues lors du traitement de documents. Potentielle accumulation de fichiers invalides dans le storage. Risque de sécurité si le bucket est mal configuré.

**Solution** : Valider le magic number (premiers octets) du fichier côté serveur avant de générer la signed URL ou après l'upload via un Supabase Storage trigger/webhook. Pour les PDFs : vérifier que les premiers 4 bytes sont `%PDF`. Configurer les RLS policies Supabase Storage pour restreindre les Content-Types acceptés. Limiter la taille maximale des fichiers dans les bucket policies.

**Phase concernée** : Lors de l'implémentation de l'upload, avant ouverture aux utilisateurs.

---

### Piège : Gestion des fichiers Anthropic vs Supabase Storage — double stockage incohérent
**Piège** : Uploader un fichier dans Supabase Storage (pour persistence et affichage dans l'UI) ET l'uploader séparément via l'API Files d'Anthropic (pour le passer à `messages` avec `type: "document"`). Les deux références peuvent se désynchroniser : le fichier Anthropic expire (Files API a une durée de vie de 30 jours) mais la référence Supabase persiste, ou vice versa.

**Symptôme** : Erreurs `file_not_found` lors de la réutilisation d'un document dans une nouvelle conversation. Confusion entre l'ID Supabase Storage et l'ID Anthropic File. Retraitement inutile de fichiers déjà uploadés.

**Solution** : Stocker l'`anthropic_file_id` dans la table `documents` de Supabase avec sa date d'expiration. Avant de référencer un fichier dans un appel Anthropic, vérifier si l'ID est encore valide. Si expiré, re-uploader vers l'API Files et mettre à jour l'enregistrement Supabase :
```sql
documents (
  id uuid primary key,
  user_id uuid references auth.users(id),
  storage_path text,          -- chemin Supabase Storage
  anthropic_file_id text,     -- ID de l'API Files Anthropic
  anthropic_expires_at timestamptz,
  created_at timestamptz
)
```

**Phase concernée** : Conception du schéma DB dès que la fonctionnalité de documents est planifiée.

---

## Auth Supabase dans App Router

### Piège : Utiliser le client Supabase browser-side dans un Server Component
**Piège** : Importer `createClient` de `@supabase/supabase-js` directement dans un Server Component et appeler `supabase.auth.getUser()`. Ce client utilise `localStorage` pour les tokens, qui n'existe pas côté serveur. Le token n'est pas transmis, la session est toujours `null`.

**Symptôme** : `session` et `user` toujours `null` dans les Server Components malgré un utilisateur connecté. Redirections inattendues vers la page de login. Pas d'erreur explicite, juste un comportement silencieusement incorrect.

**Solution** : Utiliser `@supabase/ssr` qui lit les tokens depuis les cookies HTTP (disponibles côté serveur) :
```ts
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: (c) => c.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } }
  );
}
```
Maintenir deux factories séparées : `createClient()` pour les Server Components/Routes, et `createBrowserClient()` pour les Client Components.

**Phase concernée** : Mise en place de l'architecture auth, avant tout développement de fonctionnalités protégées.

---

### Piège : Middleware Supabase mal configuré — sessions non rafraîchies
**Piège** : Oublier de configurer le middleware Next.js pour rafraîchir automatiquement les tokens Supabase. Les JWT Supabase expirent au bout d'1 heure. Sans middleware qui appelle `supabase.auth.getUser()` à chaque requête, les sessions expirent silencieusement. Les Server Components voient un utilisateur connecté (cookie présent) mais les appels Supabase DB échouent avec `JWT expired`.

**Symptôme** : Après ~1h d'inactivité, les requêtes Supabase commencent à échouer avec `401 Unauthorized` ou `JWT expired`. L'utilisateur semble connecté dans l'UI (cookie encore présent) mais les données ne chargent plus.

**Solution** : Configurer `middleware.ts` à la racine du projet Next.js avec le helper `updateSession` de `@supabase/ssr` :
```ts
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

export async function middleware(request: Request) {
  // updateSession rafraîchit le token si nécessaire et met à jour les cookies
  return await updateSession(request);
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
```

**Phase concernée** : Mise en place initiale de l'auth, avant tout test de session.

---

### Piège : Exposer des données sensibles via un Server Component sans vérifier l'autorisation
**Piège** : Dans l'App Router, les Server Components ont accès direct à la DB. Il est tentant de faire `supabase.from('conversations').select('*')` sans clause `.eq('user_id', user.id)`. Les RLS Supabase protègent si elles sont activées, mais si elles ne le sont pas (ou sont mal configurées), un utilisateur peut accéder aux données d'un autre.

**Symptôme** : Avec 2 utilisateurs internes, le risque est faible mais réel. Pas de symptôme visible jusqu'au premier incident. En audit : requêtes DB qui ne filtrent pas sur `user_id`.

**Solution** : Activer RLS sur toutes les tables et créer des policies restrictives dès le départ :
```sql
alter table conversations enable row level security;
create policy "Users own their conversations" on conversations
  for all using (auth.uid() = user_id);
```
Ne jamais désactiver RLS même pour des "tests rapides". Utiliser le Supabase Dashboard pour auditer les tables sans RLS activé.

**Phase concernée** : Création du schéma DB, avant toute donnée en production.

---

## Contrôle des Coûts Tokens

### Piège : System prompt copié intégralement à chaque appel de la session
**Piège** : Envoyer le system prompt complet à chaque message de la conversation. Sur des workflows GBD avec un system prompt de 2000+ tokens et 20 échanges par session, le system prompt représente potentiellement 40k tokens d'input juste pour lui seul. Anthropic facture chaque token input à chaque appel.

**Symptôme** : Coût par session disproportionnellement élevé. Dans les logs Anthropic, `input_tokens` élevés même pour des messages utilisateur courts. Ratio input/output tokens anormalement élevé.

**Solution** : Utiliser le cache de prompt Anthropic (prompt caching) avec `cache_control: { type: "ephemeral" }` sur le system prompt. Les blocs marqués sont mis en cache pendant 5 minutes et ne sont rechargés qu'une fois par cache miss :
```ts
const response = await anthropic.messages.create({
  system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
  messages: conversationHistory,
  // ...
});
```
Stocker `cache_read_input_tokens` et `cache_creation_input_tokens` depuis `response.usage` pour monitorer l'efficacité du cache.

**Phase concernée** : Lors de l'écriture de la logique d'appel Anthropic, avant le premier vrai workflow GBD.

---

### Piège : Absence de comptage et stockage des tokens par appel
**Piège** : Ne pas enregistrer `usage.input_tokens` et `usage.output_tokens` retournés par l'API Anthropic dans Supabase. Sans cette donnée, impossible d'auditer les coûts, de détecter les dérapages, ou d'implémenter des limites par utilisateur/session.

**Symptôme** : Facture Anthropic mensuelle sans possibilité de l'attribuer à des sessions ou des fonctionnalités spécifiques. Impossible de savoir quelle partie du workflow GBD est la plus coûteuse.

**Solution** : Stocker systématiquement l'usage dans la table `messages` ou une table `api_calls` dédiée :
```sql
api_calls (
  id uuid primary key,
  message_id uuid references messages(id),
  model text,
  input_tokens int,
  output_tokens int,
  cache_read_tokens int,
  cache_creation_tokens int,
  cost_usd numeric(10,6),
  created_at timestamptz default now()
)
```
Créer une vue Supabase pour agréger les coûts par session et par utilisateur. Mettre en place une alerte (webhook ou cron) si le coût journalier dépasse un seuil.

**Phase concernée** : Dès le premier appel Anthropic réel, en production comme en staging.

---

### Piège : Passer des images ou PDFs non compressés à Anthropic
**Piège** : Envoyer des images haute résolution ou des PDFs non optimisés via l'API Anthropic. Une image 4K envoyée en `image/png` est tokenisée selon sa résolution (Claude charge plus de tokens pour les grandes images). Un PDF de 50 pages non optimisé génère un coût d'input massif.

**Symptôme** : `input_tokens` anormalement élevés sur les appels avec documents. Latence élevée sur les appels avec images. Coût par conversation avec documents 5-10x supérieur aux conversations texte.

**Solution** : Redimensionner les images avant envoi (max 1568px sur le côté le plus long pour Claude). Utiliser `sharp` côté serveur pour compresser et redimensionner. Pour les PDFs, extraire uniquement les pages pertinentes plutôt que le document entier. Stocker la version optimisée dans Supabase Storage et l'utiliser pour les appels Anthropic.

**Phase concernée** : Lors de l'implémentation du traitement de documents, avant tout test avec de vrais fichiers métier.

---

## UX sur des Réponses IA Longues

### Piège : Pas de mécanisme de reconnexion automatique si le stream SSE s'interrompt
**Piège** : Implémenter un SSE basique sans gestion de reconnexion. Si la connexion réseau de l'utilisateur fluctue (WiFi instable, VPN, proxy d'entreprise) pendant un stream de 3 minutes, le stream casse et l'utilisateur voit une réponse tronquée avec un spinner bloqué. Sans reconnexion, il doit relancer manuellement.

**Symptôme** : Plaintes utilisateur sur des réponses qui "s'arrêtent au milieu". État de l'UI bloqué sur "chargement" sans timeout visible. Réponses partiellement affichées et non récupérables.

**Solution** : Implémenter la reconnexion SSE avec `EventSource` et le header `Last-Event-ID`. Chaque chunk SSE reçoit un ID incrémental. En cas de déconnexion, le client se reconnecte en envoyant le dernier ID reçu, et le serveur reprend depuis ce point (nécessite de stocker les chunks intermédiaires en DB ou cache) :
```ts
// Client
const es = new EventSource('/api/stream?sessionId=xxx');
es.onerror = () => {
  setTimeout(() => reconnect(lastEventId), 2000); // retry avec backoff
};

// Alternative plus simple : stocker la réponse complète en cours dans Supabase
// et permettre au client de la récupérer via polling si le SSE échoue
```
Pour GBD avec seulement 2 utilisateurs, la solution de fallback polling est plus robuste et simple à implémenter.

**Phase concernée** : Lors de l'implémentation de la couche SSE, avant toute démo utilisateur.

---

### Piège : UI bloquée sans feedback pendant les phases "thinking" d'Anthropic
**Piège** : Anthropic peut avoir une latence de plusieurs secondes entre le début de l'appel et le premier token streamé (notamment avec des documents longs à analyser ou des modèles plus lents). Sans feedback visuel spécifique pour cette phase de "latence initiale", l'utilisateur pense que l'application est bloquée.

**Symptôme** : Utilisateur qui clique plusieurs fois sur "Envoyer" pensant que ça n'a pas marché. Duplications de requêtes. Frustration sur des workflows de 3-5 minutes sans indication de progression.

**Solution** : Distinguer trois états visuels dans l'UI :
1. "En attente de réponse" (entre l'envoi et le premier token) — spinner ou animation "thinking"
2. "En cours de génération" (streaming actif) — texte qui s'affiche progressivement + indicateur de vitesse
3. "Terminé" — bouton de copie, actions disponibles

Désactiver le bouton d'envoi et afficher un compteur de tokens en temps réel pendant le streaming. Ajouter un timeout côté client (ex: 30s sans premier token) qui propose de réessayer.

**Phase concernée** : Lors du développement des composants UI de chat, avant la première démo.

---

### Piège : Markdown non rendu pendant le streaming — affichage brut du texte
**Piège** : Afficher le stream de texte brut dans un `<div>` ou `<textarea>` sans rendu Markdown progressif. Les réponses GBD utilisent probablement des listes, titres, code blocks. L'utilisateur voit du `**texte en gras**` et des `# Titres` bruts pendant le stream, puis un rendu final qui "saute" visuellement.

**Symptôme** : Expérience visuelle dégradée pendant le streaming. Le rendu final est correct mais le processus est visuellement chaotique. Particulièrement visible sur des réponses longues avec beaucoup de Markdown.

**Solution** : Utiliser une bibliothèque de rendu Markdown incrémental comme `react-markdown` avec `rehype-highlight` pour le code. Rendre le Markdown à chaque chunk reçu. Attention aux re-renders : mémoriser le composant ou utiliser `useMemo` sur le contenu parsé. Pour les tables et blocs de code, attendre la fermeture du bloc avant de rendre (détecter les balises ouvertes incomplètes) :
```tsx
// Rendu incrémental avec react-markdown
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {streamingContent}
</ReactMarkdown>
```

**Phase concernée** : Lors du développement du composant de message, avant toute démo.

---

### Piège : Pas de persistance du stream en cas de rechargement de page
**Piège** : Si l'utilisateur recharge accidentellement la page pendant un stream, la réponse en cours est perdue. L'état n'est stocké que dans le state React client. Pour un workflow GBD de 4 minutes, cela signifie repayer l'intégralité du coût tokens et perdre 4 minutes de travail.

**Symptôme** : Rechargement de page = réponse perdue. Utilisateur obligé de relancer. Coût tokens doublé pour les sessions avec rechargements accidentels.

**Solution** : Écrire les chunks du stream en temps réel dans Supabase (table `message_chunks` ou dans le champ `content` du message avec des updates fréquents). Au chargement de la page, vérifier si une conversation a un message en état `streaming`. Si oui, afficher le contenu déjà reçu et permettre à l'utilisateur de continuer ou de relancer. Utiliser `Supabase Realtime` pour synchroniser l'état entre onglets si nécessaire.

**Phase concernée** : Lors de l'intégration Supabase-streaming, avant mise en production.
