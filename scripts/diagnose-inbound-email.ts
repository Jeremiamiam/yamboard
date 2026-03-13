/**
 * Script de diagnostic pour le webhook inbound email.
 * Usage: npx tsx scripts/diagnose-inbound-email.ts
 *        ou: node --env-file=.env.local --import tsx scripts/diagnose-inbound-email.ts
 *
 * Vérifie:
 * - corentin@agence-yam.fr existe dans Supabase Auth
 * - Les clients sont bien chargés pour le contexte
 * - L'API Resend receiving retourne le corps du mail
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
try {
  const envPath = resolve(process.cwd(), '.env.local')
  const env = readFileSync(envPath, 'utf-8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {
  // .env.local optionnel
}

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!
const RESEND_API_KEY = process.env.RESEND_API_KEY!

async function main() {
  console.log('=== Diagnostic Inbound Email ===\n')

  // 1. Vérifier que corentin@agence-yam.fr existe
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
  const corentin = listData?.users?.find(
    (u) => u.email?.toLowerCase() === 'corentin@agence-yam.fr'
  )
  if (!corentin) {
    console.log('❌ corentin@agence-yam.fr NON TROUVÉ dans Supabase Auth')
    console.log('   → Ajoute cet utilisateur (invite) pour que le webhook traite ses mails.\n')
  } else {
    console.log('✓ corentin@agence-yam.fr trouvé (userId:', corentin.id, ')\n')
  }

  // 2. Lister les clients (tous, comme le contexte email)
  const { data: clients } = await admin
    .from('clients')
    .select('id, name, owner_id')
    .in('category', ['client'])
    .order('created_at', { ascending: true })

  console.log('Clients dans le contexte email:', clients?.length ?? 0)
  clients?.slice(0, 5).forEach((c) => {
    console.log('  -', c.name, '(id:', c.id, ', owner:', c.owner_id?.slice(0, 8) + '...)')
  })
  if ((clients?.length ?? 0) > 5) console.log('  ...')
  console.log('')

  // 3. Tester l'API Resend receiving (si email_id fourni en arg)
  const emailId = process.argv[2]
  if (emailId && RESEND_API_KEY) {
    console.log('Test API Resend receiving pour:', emailId)
    try {
      const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
        headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
      })
      const data = await res.json()
      if (res.ok) {
        console.log('✓ Corps récupéré:', (data.text || data.html || '(vide)').slice(0, 200) + '...')
      } else {
        console.log('❌ Erreur Resend:', res.status, data)
      }
    } catch (e) {
      console.log('❌ Exception:', e)
    }
  } else if (!emailId) {
    console.log('Pour tester l\'API Resend: npx tsx scripts/diagnose-inbound-email.ts <email_id>')
  }
}

main().catch(console.error)
