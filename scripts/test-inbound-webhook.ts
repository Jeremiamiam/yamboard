/**
 * Script de diagnostic pour le webhook inbound Resend.
 * Simule un POST vers /api/webhooks/inbound-email.
 *
 * Usage: npx tsx scripts/test-inbound-webhook.ts
 * (lance d'abord `npm run dev` dans un autre terminal)
 *
 * Les variables sont lues depuis .env.local si tu les exportes :
 *   export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/test-inbound-webhook.ts
 */

const WEBHOOK_URL = process.env.TEST_WEBHOOK_URL ?? 'http://localhost:3000/api/webhooks/inbound-email'

const payload = {
  type: 'email.received',
  created_at: new Date().toISOString(),
  data: {
    email_id: 'c84eb5ff-fec9-4261-af1a-6c1738e6e2e6',
    from: 'jeremy@agence-yam.fr',
    subject: 'nouveau client',
    to: ['agent@app.agence-yam.fr'],
    bcc: [],
    cc: [],
    attachments: [],
    message_id: '<test>',
    created_at: new Date().toISOString(),
  },
}

async function main() {
  console.log('Variables env:', {
    RESEND_API_KEY: process.env.RESEND_API_KEY ? '✓' : '✗',
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET ? '✓' : '✗',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ? '✓' : '✗',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
  })

  // Pour tester sans signature (dev uniquement), on peut skip la vérif
  // En prod Resend envoie les headers Svix
  const body = JSON.stringify(payload)
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // Si on a le secret, on peut signer avec Svix (optionnel pour ce script)
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (secret) {
    try {
      const { Webhook } = await import('svix')
      const wh = new Webhook(secret)
      const msgId = 'msg_test_' + Date.now()
      const timestamp = new Date()
      const sig = wh.sign(msgId, timestamp, body)
      headers['svix-id'] = msgId
      headers['svix-timestamp'] = Math.floor(timestamp.getTime() / 1000).toString()
      headers['svix-signature'] = sig
    } catch (e) {
      console.warn('Signature Svix ignorée:', e)
    }
  }

  console.log('\nPOST', WEBHOOK_URL)
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers,
    body,
  })

  const text = await res.text()
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    json = text
  }

  console.log('Status:', res.status)
  console.log('Response:', JSON.stringify(json, null, 2))

  if (!res.ok) {
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
