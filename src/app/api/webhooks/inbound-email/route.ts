/**
 * Webhook Resend Inbound — Email → Agent Yam
 *
 * FLUX (Resend n'envoie rien à l'agent directement) :
 * 1. Resend reçoit le mail → POST ce webhook (payload = metadata seulement : from, subject, email_id)
 * 2. On récupère le corps via API Resend GET /emails/receiving/{email_id}
 * 3. On identifie l'utilisateur par l'email expéditeur (Supabase Auth)
 * 4. On envoie (subject + body) à Claude (Anthropic) en mode "agency"
 * 5. Claude utilise les outils (create_client, create_project, etc.) → écrit dans Supabase
 *
 * "Agent" = Claude (claude-haiku-4-5) avec les outils Yam. L'orchestration est dans ce fichier.
 *
 * Config Resend : Receiving → Webhook → URL = https://ton-app.com/api/webhooks/inbound-email
 * Event = email.received
 */
import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { Webhook, WebhookVerificationError } from 'svix'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAgencyContextForUser } from '@/lib/context-builders'
import { insertWebhookError } from '@/lib/webhook-errors'
import type { ContentBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages/messages'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AGENCY_TOOLS = [
  {
    name: 'suggest_contact',
    description: 'Propose un contact à ajouter (l\'utilisateur validera via la cloche). OBLIGATOIRE pour chaque expéditeur externe du mail.',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientId: { type: 'string', description: 'UUID du client' },
        name: { type: 'string', description: 'Nom complet du contact' },
        email: { type: 'string', description: 'Email du contact — TOUJOURS le remplir si disponible dans le mail' },
        isPrimary: { type: 'boolean', description: 'Contact principal (défaut true si premier)' },
      },
      required: ['clientId', 'name'],
    },
  },
  {
    name: 'suggest_note',
    description: 'Propose un résumé des échanges (l\'utilisateur validera via la cloche). Points clés, décisions, prochaines étapes. 5-10 lignes synthétiques.',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientId: { type: 'string', description: 'UUID du client' },
        projectId: { type: 'string', description: 'UUID du projet (optionnel)' },
        name: { type: 'string', description: 'Titre (ex: "Échange - Sujet du mail")' },
        content: { type: 'string', description: 'RÉSUMÉ SYNTHÉTIQUE des échanges (5-10 lignes). Obligatoire.' },
      },
      required: ['clientId', 'name', 'content'],
    },
  },
]

function isToolUseBlock(block: ContentBlock): block is ToolUseBlock {
  return block.type === 'tool_use'
}

function extractEmailFromFromField(from: string): string | null {
  // Format: "Name <email@domain.com>" ou "email@domain.com"
  const match = from.match(/<([^>]+)>/)
  if (match) return match[1].trim().toLowerCase()
  if (from.includes('@')) return from.trim().toLowerCase()
  return null
}

function extractSenderName(from: string): string {
  // "Jérémy Hervo <jeremy@agence-yam.fr>" → "Jérémy"
  // "jeremy@agence-yam.fr" → "jeremy"
  const nameMatch = from.match(/^([^<]+)</)
  if (nameMatch) return nameMatch[1].trim().split(/\s+/)[0]
  const email = from.trim().split('@')[0]
  return email.charAt(0).toUpperCase() + email.slice(1)
}

/** Vérifie la signature Svix sans contrôle du timestamp (pour replay Resend). */
function verifyWebhookReplay(
  rawBody: string,
  secret: string,
  headers: { 'svix-id': string; 'svix-timestamp': string; 'svix-signature': string }
): void {
  const msgId = headers['svix-id'] ?? ''
  const timestamp = headers['svix-timestamp'] ?? ''
  const sigHeader = headers['svix-signature'] ?? ''
  if (!msgId || !timestamp || !sigHeader) {
    throw new WebhookVerificationError('Missing required headers')
  }
  const secretBase64 = secret.startsWith('whsec_') ? secret.slice(6) : secret
  const key = Buffer.from(secretBase64, 'base64')
  const toSign = `${msgId}.${timestamp}.${rawBody}`
  const expected = 'v1,' + createHmac('sha256', key).update(toSign).digest('base64')
  const passed = sigHeader.split(' ').some((s) => s.startsWith('v1,') && s === expected)
  if (!passed) throw new WebhookVerificationError('No matching signature found')
}

export async function POST(req: Request) {
  const log = (msg: string, data?: unknown) => {
    console.log('[inbound-email]', msg, data ?? '')
  }

  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    const resendApiKey = process.env.RESEND_API_KEY

    if (!webhookSecret || !resendApiKey) {
      log('ERREUR: RESEND_WEBHOOK_SECRET ou RESEND_API_KEY manquant')
      return NextResponse.json({ error: 'Config manquante' }, { status: 500 })
    }

    const rawBody = await req.text()
    let event: { type?: string; data?: { email_id?: string; from?: string; subject?: string }; __test?: boolean }

    try {
      event = JSON.parse(rawBody) as typeof event
    } catch {
      log('ERREUR: Invalid JSON')
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const isTest = event.__test === true && process.env.INBOUND_TEST_SECRET && req.headers.get('x-test-secret') === process.env.INBOUND_TEST_SECRET

    log('Event reçu', { type: event.type, emailId: event.data?.email_id, from: event.data?.from, isTest })

    if (event.type !== 'email.received') {
      log('Ignoré: type != email.received')
      return NextResponse.json({ ok: true })
    }

    const emailId = event.data?.email_id
    const from = event.data?.from ?? ''

    if (!emailId) {
      log('ERREUR: email_id manquant')
      return NextResponse.json({ error: 'email_id manquant' }, { status: 400 })
    }

    // Vérifier la signature Resend (Svix) — sauf en mode test
    if (!isTest) {
      const svixHeaders = {
        'svix-id': req.headers.get('svix-id') ?? '',
        'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
        'svix-signature': req.headers.get('svix-signature') ?? '',
      }
      try {
        const wh = new Webhook(webhookSecret)
        wh.verify(rawBody, svixHeaders)
      } catch (verifyErr) {
        const msg = verifyErr instanceof Error ? verifyErr.message : String(verifyErr)
        if (msg.includes('timestamp too old')) {
          try {
            verifyWebhookReplay(rawBody, webhookSecret, svixHeaders)
            log('Replay Resend accepté (signature OK, timestamp ignoré)')
          } catch (replayErr) {
            log('ERREUR: Replay — signature invalide', replayErr)
            return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
          }
        } else {
          log('ERREUR: Signature webhook invalide', verifyErr)
          return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
        }
      }
    } else {
      log('Mode test: signature ignorée')
    }

    const senderEmail = extractEmailFromFromField(from)
    if (!senderEmail) {
      log('ERREUR: Impossible d\'extraire l\'email expéditeur', from)
      return NextResponse.json({ ok: true })
    }

    log('Recherche utilisateur', senderEmail)

    // Trouver l'utilisateur par email (exact, puis fallback domaine @agence-yam.fr)
    const admin = createAdminClient()
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const allUsers = listData?.users ?? []
    log('Users Supabase', allUsers.map((u) => u.email))

    let user = allUsers.find((u) => u.email?.toLowerCase() === senderEmail)
    if (!user && senderEmail.endsWith('@agence-yam.fr')) {
      // Fallback domaine : prend le premier user @agence-yam.fr (même s'il y en a plusieurs)
      // Préférence : le plus ancien (présumé owner principal de l'agence)
      const domainUsers = allUsers
        .filter((u) => u.email?.toLowerCase().endsWith('@agence-yam.fr'))
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      if (domainUsers.length > 0) {
        user = domainUsers[0]
        log('Fallback domaine @agence-yam.fr → premier user créé', user.email)
      }
    }
    if (!user) {
      log('ERREUR: Aucun utilisateur Yam pour', { from, senderEmail })
      return NextResponse.json({ ok: true })
    }

    log('Utilisateur trouvé', { userId: user.id, email: user.email })

    // Récupérer le corps du mail via l'API Resend Receiving
    let body = ''
    try {
      const resend = new Resend(resendApiKey)
      const result = await resend.get<{ text?: string; html?: string }>(
        `/emails/receiving/${emailId}`,
      )
      const receivedData = result.data
      const receivedErr = result.error
      if (receivedErr || !receivedData) {
        log('API receiving échouée, fallback sujet seul', receivedErr)
        body = `(Corps non récupéré — sujet: ${event.data?.subject ?? ''})`
      } else {
        body = receivedData.text ?? receivedData.html ?? ''
      }
    } catch (apiErr) {
      log('Exception API receiving', apiErr)
      body = `(Corps non récupéré — sujet: ${event.data?.subject ?? ''})`
    }

    if (!body.trim()) body = event.data?.subject ?? '(sans contenu)'
    log('Corps mail', { bodyLen: body.length, preview: body.slice(0, 80) })

    const debugTrace = process.env.INBOUND_DEBUG === '1' ? [] as string[] : null

    // Diagnostic: vérifier que l'admin peut lire les clients
    if (debugTrace) {
      const { data: diagClients, error: diagErr } = await admin
        .from('clients')
        .select('id, name, category')
        .in('category', ['client'])
        .limit(3)
      debugTrace.push(`diag clients: count=${diagClients?.length ?? 0} error=${diagErr?.message ?? 'null'} sample=${JSON.stringify(diagClients?.map((c: { name: string }) => c.name) ?? [])}`)
    }

    await processEmailWithAgent(
      user.id,
      event.data?.subject ?? '(sans sujet)',
      body,
      event.data?.from ?? '',
      debugTrace,
    )

    const response: {
      ok: boolean
      debug?: { bodyLength: number; bodyPreview?: string; agentTrace?: string[] }
    } = { ok: true }
    if (process.env.INBOUND_DEBUG === '1') {
      response.debug = {
        bodyLength: body.length,
        bodyPreview: body.slice(0, 150),
        agentTrace: debugTrace ?? [],
      }
    }
    log('Traitement terminé')
    return NextResponse.json(response)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[inbound-email] Erreur:', msg, stack)
    try {
      const admin = createAdminClient()
      await insertWebhookError(admin, {
        source: 'inbound_email',
        errorMessage: msg,
        details: { stack: stack ?? undefined },
      })
    } catch (e) {
      console.error('[inbound-email] Impossible de persister l\'erreur:', e)
    }
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        debug: process.env.INBOUND_DEBUG === '1' ? msg : undefined,
      },
      { status: 500 },
    )
  }
}

function trace(debugTrace: string[] | null, msg: string): void {
  if (debugTrace) debugTrace.push(msg)
  console.log('[inbound-email]', msg)
}

async function processEmailWithAgent(
  userId: string,
  subject: string,
  body: string,
  from: string,
  debugTrace: string[] | null,
): Promise<void> {
  trace(debugTrace, `input → userId=${userId} subject="${subject}" bodyLen=${body.length}`)

  const systemPrompt = await buildAgencyContextForUser(userId, debugTrace)
  trace(debugTrace, `context built, ${systemPrompt.length} chars`)

  const userMessage = `[Email reçu]
Expéditeur: ${from || '(inconnu)'}
Sujet: ${subject}

${body}

---
RÈGLES :
1. **Identifie le client** : Le sujet et le corps du mail indiquent souvent le client (ex: "deck light", "Light et pro" → client "Deck Light" ou similaire). Cherche dans le contexte la correspondance la plus probable.
2. **NE JAMAIS créer de client** : Utilise UNIQUEMENT les IDs des clients présents dans le contexte. Si le nom dans le mail correspond à un client existant (ex: Forge, FORGE, forge = même client), utilise cet ID.
3. **suggest_contact** : Propose un contact pour CHAQUE personne mentionnée dans le mail (expéditeur, interlocuteurs dans le thread, signatures). Cherche les emails dans tout le corps du mail (champs "De:", signatures, threads forwarded). L'email est OBLIGATOIRE si visible quelque part dans le mail.
4. **suggest_note** : En PLUS du contact, propose un RÉSUMÉ STRUCTURÉ en markdown des échanges. Format attendu :
   - **Contexte** : 1 phrase situant l'échange
   - **Points clés** : liste à puces des infos importantes (chiffres, noms, décisions)
   - **Actions / Prochaines étapes** : liste à puces des TODO ou livrables attendus
   Le contenu sera rendu en markdown dans l'app. Sois synthétique (8-15 lignes max).
5. Ordre : suggest_contact (expéditeur) → suggest_note (résumé des échanges).
6. Si aucun client ne correspond, choisis le plus pertinent ou le premier du contexte.

Exécute les actions. Sois concis.`

  const senderName = extractSenderName(from)
  const admin = createAdminClient()

  if (!process.env.ANTHROPIC_API_KEY) {
    trace(debugTrace, 'ERROR: ANTHROPIC_API_KEY manquante')
    return
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const apiMessages: Array<
    | { role: 'user'; content: string }
    | { role: 'user'; content: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> }
    | { role: 'assistant'; content: string | Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown }> }
  > = [{ role: 'user', content: userMessage }]

  let lastMessage: Awaited<ReturnType<typeof anthropic.messages.create>>
  let turn = 0

  while (true) {
    turn++
    trace(debugTrace, `claude turn ${turn} (${apiMessages.length} messages)`)
    lastMessage = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: systemPrompt,
      messages: apiMessages,
      tools: AGENCY_TOOLS,
      stream: false,
    })

    if (lastMessage.stop_reason !== 'tool_use') {
      const text = lastMessage.content
        .filter((b) => b.type === 'text')
        .map((b) => ('text' in b ? b.text : ''))
        .join('')
      trace(debugTrace, `agent done → "${text.slice(0, 200)}"`)
      console.log('[inbound-email] Agent terminé sans tool_use:', text.slice(0, 300))
      return
    }

    const toolUses = lastMessage.content.filter(isToolUseBlock)
    const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = []

    for (const block of toolUses) {
      const input = block.input as Record<string, unknown>
      trace(debugTrace, `tool ${block.name} input=${JSON.stringify(input)}`)
      let result: string
      try {
        if (block.name === 'suggest_note') {
          const clientId = String(input.clientId ?? '')
          const content = String(input.content ?? '')
          const name = String(input.name ?? 'Résumé échange')
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pending_email_suggestions pas encore dans les types générés
          const { error: insertErr } = await (admin as any).from('pending_email_suggestions').insert({
            client_id: clientId,
            project_id: input.projectId ? String(input.projectId) : null,
            type: 'note',
            data: { name, content },
            from_email: from,
            subject,
            sender_name: senderName,
          })
          if (insertErr) {
            result = `Erreur : ${insertErr.message}`
          } else {
            result = `Suggestion note créée : ${name} — l'utilisateur validera via la cloche`
          }
        } else if (block.name === 'suggest_contact') {
          const contactEmail = input.email ? String(input.email).trim().toLowerCase() : ''
          if (contactEmail.endsWith('@agence-yam.fr')) {
            result = 'Contact @agence-yam.fr ignoré (équipe interne)'
          } else {
            const clientId = String(input.clientId ?? '')
            const name = String(input.name ?? '')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- pending_email_suggestions pas encore dans les types générés
            const { error: insertErr } = await (admin as any).from('pending_email_suggestions').insert({
              client_id: clientId,
              project_id: null,
              type: 'contact',
              data: {
                name,
                email: input.email ? String(input.email) : undefined,
                isPrimary: input.isPrimary === true,
              },
              from_email: from,
              subject,
              sender_name: senderName,
            })
            if (insertErr) {
              result = `Erreur : ${insertErr.message}`
            } else {
              result = `Suggestion contact créée : ${name} — l'utilisateur validera via la cloche`
            }
          }
        } else {
          result = `Outil inconnu : ${block.name}`
        }
      } catch (err) {
        result = `Erreur : ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
      trace(debugTrace, `tool ${block.name} → ${result}`)
      if (block.name === 'suggest_contact' || block.name === 'suggest_note') {
        console.log('[inbound-email]', block.name, '→', result)
      }
    }

    const assistantContent = lastMessage.content
      .filter((b) => b.type === 'text' || b.type === 'tool_use')
      .map((b) => {
        if (b.type === 'text') return { type: 'text' as const, text: 'text' in b ? b.text : '' }
        if (b.type === 'tool_use') return { type: 'tool_use' as const, id: b.id, name: b.name, input: b.input }
        return null
      })
      .filter(Boolean) as Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown }>

    apiMessages.push({ role: 'assistant', content: assistantContent })
    apiMessages.push({ role: 'user', content: toolResults })
  }
}
