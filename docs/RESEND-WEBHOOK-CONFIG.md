# Config Resend pour le webhook inbound

## 1. URL du webhook

**Resend Dashboard** → **Receiving** → **Webhooks** → **Add webhook**

- **URL** : `https://get-brandon.netlify.app/api/webhooks/inbound-email`
- **Event** : `email.received`

⚠️ Si l’URL pointe ailleurs (ex. app.agence-yam.fr), les vrais mails ne déclencheront pas le webhook.

## 2. Adresse de réception

L’adresse qui reçoit les mails (ex. `agent@app.agence-yam.fr`) doit être configurée dans Resend > Receiving > Domains.

## 3. Test avec un nouveau mail

Le **Replay** (bouton dans la cloche) utilise un ancien `email_id` et peut ne pas fonctionner correctement.

**Test fiable** : envoie un **nouveau** mail à l’adresse configurée (ex. `agent@app.agence-yam.fr`). Resend enverra le webhook en temps réel.

## 4. Variables Netlify

Sur le site get-brandon, vérifier :

- `NEXT_PUBLIC_SUPABASE_URL` = `https://yavdiggxvchfztncdhdz.supabase.co` (getBrandon)
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_WEBHOOK_SECRET`
- `ANTHROPIC_API_KEY`
- `INBOUND_TEST_SECRET` (pour le Replay)
