/**
 * Appelle l'endpoint inject pour tester les notifs.
 * Usage: npx tsx scripts/test-inject-notifications.ts
 * Charge .env.local pour INBOUND_TEST_SECRET.
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
  console.error('Pas de .env.local — exporte INBOUND_TEST_SECRET manuellement')
}

const BASE = process.env.INJECT_BASE_URL || 'https://app.agence-yam.fr'
const SECRET = process.env.INBOUND_TEST_SECRET

async function main() {
  if (!SECRET) {
    console.error('INBOUND_TEST_SECRET manquant dans .env.local')
    process.exit(1)
  }
  const url = `${BASE}/api/debug/inbound?secret=${SECRET}&action=inject`
  console.log('Appel:', url.replace(SECRET, '***'))
  const res = await fetch(url)
  const data = await res.json().catch(() => ({}))
  console.log('Status:', res.status)
  console.log('Réponse:', JSON.stringify(data, null, 2))
  if (res.ok && data.ok) {
    console.log('\n✓ Données injectées. Rafraîchis la page ou attends le Realtime.')
  }
}

main().catch(console.error)
