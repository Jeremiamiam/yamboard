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
import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAgencyContextForUser } from '@/lib/context-builders'
import {
  executeCreateClient,
  executeCreateProject,
  executeCreateProduct,
  executeCreateNote,
  executeCreateLink,
  executeCreateContact,
  executeUpdatePaymentStage,
  executeAddAvancement,
  getToolResultMessage,
} from '@/lib/chat-tools'
import { insertClientActivity } from '@/lib/activity-log'
import type { ContentBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages/messages'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AGENCY_TOOLS = [
  {
    name: 'create_client',
    description: "Crée un nouveau client ou prospect dans Yam. Par défaut: client.",
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nom du client ou prospect' },
        industry: { type: 'string', description: 'Secteur d\'activité (optionnel)' },
        category: { type: 'string', enum: ['client', 'prospect'], description: 'client ou prospect. Utilise client par défaut sauf si le mail dit explicitement prospect.' },
      },
      required: ['name'],
    },
  },
  {
    name: 'create_project',
    description: 'Crée un nouveau projet pour un client existant.',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientId: { type: 'string', description: 'UUID du client' },
        name: { type: 'string', description: 'Nom du projet' },
        potentialAmount: { type: 'number', description: 'Montant potentiel en € (optionnel)' },
      },
      required: ['clientId', 'name'],
    },
  },
  {
    name: 'create_product',
    description: 'Crée un produit/prestation pour un projet.',
    input_schema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'UUID du projet' },
        name: { type: 'string', description: 'Nom de la prestation' },
        devisAmount: { type: 'number', description: 'Montant du devis en € (optionnel)' },
      },
      required: ['projectId', 'name'],
    },
  },
  {
    name: 'create_note',
    description: 'Ajoute une note/document texte pour un client.',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientId: { type: 'string', description: 'UUID du client' },
        projectId: { type: 'string', description: 'UUID du projet (optionnel)' },
        name: { type: 'string', description: 'Nom du document' },
        content: { type: 'string', description: 'Contenu texte de la note' },
      },
      required: ['clientId', 'name', 'content'],
    },
  },
  {
    name: 'create_link',
    description: 'Ajoute un lien externe pour un client.',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientId: { type: 'string', description: 'UUID du client' },
        projectId: { type: 'string', description: 'UUID du projet (optionnel)' },
        name: { type: 'string', description: 'Nom du lien' },
        url: { type: 'string', description: 'URL complète (https://...)' },
      },
      required: ['clientId', 'name', 'url'],
    },
  },
  {
    name: 'create_contact',
    description: 'Ajoute un contact (nom, email) à un client. Utilise pour l\'expéditeur du mail.',
    input_schema: {
      type: 'object' as const,
      properties: {
        clientId: { type: 'string', description: 'UUID du client' },
        name: { type: 'string', description: 'Nom complet du contact' },
        email: { type: 'string', description: 'Email du contact (optionnel)' },
        role: { type: 'string', description: 'Rôle/fonction (optionnel)' },
        isPrimary: { type: 'boolean', description: 'Contact principal (défaut true si premier)' },
      },
      required: ['clientId', 'name'],
    },
  },
  {
    name: 'update_payment_stage',
    description: 'Met à jour devis, acompte ou solde d\'un produit. Status: pending, sent, paid.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productId: { type: 'string', description: 'UUID du produit' },
        stage: { type: 'string', enum: ['devis', 'acompte', 'solde'], description: 'Étape à mettre à jour' },
        amount: { type: 'number', description: 'Montant en € (optionnel)' },
        status: { type: 'string', enum: ['pending', 'sent', 'paid'], description: 'pending=à faire, sent=envoyé, paid=payé' },
      },
      required: ['productId', 'stage'],
    },
  },
  {
    name: 'add_avancement',
    description: 'Ajoute un avancement (facture intermédiaire) à un produit.',
    input_schema: {
      type: 'object' as const,
      properties: {
        productId: { type: 'string', description: 'UUID du produit' },
        amount: { type: 'number', description: 'Montant en € (optionnel)' },
        status: { type: 'string', enum: ['pending', 'sent', 'paid'], description: 'pending par défaut' },
      },
      required: ['productId'],
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

export async function POST(req: Request) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    const resendApiKey = process.env.RESEND_API_KEY

    if (!webhookSecret || !resendApiKey) {
      console.error('[inbound-email] RESEND_WEBHOOK_SECRET ou RESEND_API_KEY manquant')
      return NextResponse.json({ error: 'Config manquante' }, { status: 500 })
    }

    const rawBody = await req.text()
    let event: { type?: string; data?: { email_id?: string; from?: string; subject?: string } }

    try {
      event = JSON.parse(rawBody) as typeof event
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    if (event.type !== 'email.received') {
      return NextResponse.json({ ok: true }) // Ignorer les autres events
    }

    const emailId = event.data?.email_id
    const from = event.data?.from ?? ''

    if (!emailId) {
      return NextResponse.json({ error: 'email_id manquant' }, { status: 400 })
    }

    // Vérifier la signature Resend (Svix)
    try {
      const wh = new Webhook(webhookSecret)
      wh.verify(rawBody, {
        'svix-id': req.headers.get('svix-id') ?? '',
        'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
        'svix-signature': req.headers.get('svix-signature') ?? '',
      })
    } catch (verifyErr) {
      console.warn('[inbound-email] Signature webhook invalide:', verifyErr)
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
    }

    const senderEmail = extractEmailFromFromField(from)
    if (!senderEmail) {
      console.warn('[inbound-email] Impossible d\'extraire l\'email expéditeur:', from)
      return NextResponse.json({ ok: true }) // 200 pour éviter les retries
    }

    // Trouver l'utilisateur par email
    const admin = createAdminClient()
    const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 })
    const user = listData?.users?.find((u) => u.email?.toLowerCase() === senderEmail)

    if (!user) {
      console.warn('[inbound-email] Aucun utilisateur Yam pour:', senderEmail)
      return NextResponse.json({ ok: true })
    }

    // Récupérer le corps du mail via l'API Resend Receiving
    // Le SDK Resend v4 n'expose pas emails.receiving → appel direct à l'API
    let body = ''
    try {
      const resend = new Resend(resendApiKey)
      const result = await resend.get<{ text?: string; html?: string }>(
        `/emails/receiving/${emailId}`,
      )
      const receivedData = result.data
      const receivedErr = result.error
      if (receivedErr || !receivedData) {
        console.warn('[inbound-email] API receiving échouée, fallback sujet seul:', receivedErr)
        body = `(Corps non récupéré — sujet: ${event.data?.subject ?? ''})`
      } else {
        body = receivedData.text ?? receivedData.html ?? ''
      }
    } catch (apiErr) {
      console.warn('[inbound-email] Exception API receiving:', apiErr)
      body = `(Corps non récupéré — sujet: ${event.data?.subject ?? ''})`
    }

    if (!body.trim()) body = event.data?.subject ?? '(sans contenu)'

    const debugTrace = process.env.INBOUND_DEBUG === '1' ? [] as string[] : null

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
    return NextResponse.json(response)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[inbound-email] Erreur:', msg, stack)
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

  const systemPrompt = await buildAgencyContextForUser(userId)
  trace(debugTrace, `context built, ${systemPrompt.length} chars`)

  const userMessage = `[Email reçu]
Expéditeur: ${from || '(inconnu)'}
Sujet: ${subject}

${body}

---
Traite ce mail :
1. **Contact** : Extrais l'expéditeur (nom, email). Crée client si besoin, puis create_contact.
2. **Résumé** : Pour les notes, rédige un RÉSUMÉ SYNTHÉTIQUE (points clés, décisions, prochaines étapes). Pas le mail brut.
3. **Budget** : Tu peux créer des produits, mettre à jour devis/acompte/solde (amount, status: pending/sent/paid), ajouter des avancements.
4. **"nouveau client"** → category: client.
5. **Interdit** : Aucune suppression (delete). Création et mise à jour uniquement.

Exécute les actions via tes outils. Sois concis.`

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
      return
    }

    const toolUses = lastMessage.content.filter(isToolUseBlock)
    const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = []

    for (const block of toolUses) {
      const input = block.input as Record<string, unknown>
      trace(debugTrace, `tool ${block.name} input=${JSON.stringify(input)}`)
      let result: string
      try {
        if (block.name === 'create_client') {
          const r = await executeCreateClient(admin, userId, {
            name: String(input.name ?? ''),
            industry: input.industry ? String(input.industry) : undefined,
            category: input.category === 'prospect' ? 'prospect' : 'client',
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'create_client') {
            await insertClientActivity(admin, {
              clientId: r.clientId,
              actionType: 'client_created',
              source: 'email',
              summary: `Client créé : ${r.name}`,
              metadata: { name: r.name },
              ownerId: userId,
            })
          }
        } else if (block.name === 'create_project') {
          const clientId = String(input.clientId ?? '')
          const r = await executeCreateProject(admin, userId, {
            clientId,
            name: String(input.name ?? ''),
            potentialAmount: input.potentialAmount != null ? Number(input.potentialAmount) : undefined,
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'create_project') {
            await insertClientActivity(admin, {
              clientId,
              projectId: r.projectId,
              actionType: 'project_created',
              source: 'email',
              summary: `Projet créé : ${r.name}`,
              metadata: { name: r.name, projectId: r.projectId },
              ownerId: userId,
            })
          }
        } else if (block.name === 'create_product') {
          const projectId = String(input.projectId ?? '')
          const r = await executeCreateProduct(admin, userId, {
            projectId,
            name: String(input.name ?? ''),
            devisAmount: input.devisAmount != null ? Number(input.devisAmount) : undefined,
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'create_product') {
            const { data: proj } = await admin.from('projects').select('client_id').eq('id', projectId).single()
            const clientIdFromProject = (proj as { client_id?: string } | null)?.client_id
            if (clientIdFromProject) {
              await insertClientActivity(admin, {
                clientId: clientIdFromProject,
                projectId,
                actionType: 'product_added',
                source: 'email',
                summary: `Produit créé : ${r.name}`,
                metadata: { name: r.name, projectId },
                ownerId: userId,
              })
            }
          }
        } else if (block.name === 'create_note') {
          const clientId = String(input.clientId ?? '')
          const content = String(input.content ?? '')
          const r = await executeCreateNote(admin, userId, {
            clientId,
            projectId: input.projectId ? String(input.projectId) : undefined,
            name: String(input.name ?? ''),
            content,
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'create_note') {
            await insertClientActivity(admin, {
              clientId,
              projectId: input.projectId ? String(input.projectId) : undefined,
              actionType: 'note_added',
              source: 'email',
              summary: `Note ajoutée : ${r.name}`,
              metadata: { name: r.name, content },
              ownerId: userId,
            })
          }
        } else if (block.name === 'create_link') {
          const clientId = String(input.clientId ?? '')
          const r = await executeCreateLink(admin, userId, {
            clientId,
            projectId: input.projectId ? String(input.projectId) : undefined,
            name: String(input.name ?? ''),
            url: String(input.url ?? ''),
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'create_link') {
            await insertClientActivity(admin, {
              clientId,
              actionType: 'link_added',
              source: 'email',
              summary: `Lien ajouté : ${r.name}`,
              metadata: { name: r.name, url: input.url },
              ownerId: userId,
            })
          }
        } else if (block.name === 'create_contact') {
          const clientId = String(input.clientId ?? '')
          const r = await executeCreateContact(admin, userId, {
            clientId,
            name: String(input.name ?? ''),
            email: input.email ? String(input.email) : undefined,
            role: input.role ? String(input.role) : undefined,
            isPrimary: input.isPrimary === true,
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'create_contact') {
            await insertClientActivity(admin, {
              clientId,
              actionType: 'contact_added',
              source: 'email',
              summary: `Contact ajouté : ${r.name}`,
              metadata: { name: r.name },
              ownerId: userId,
            })
          }
        } else if (block.name === 'update_payment_stage') {
          const productId = String(input.productId ?? '')
          const stage = input.stage === 'acompte' ? 'acompte' : input.stage === 'solde' ? 'solde' : 'devis'
          const r = await executeUpdatePaymentStage(admin, userId, {
            productId,
            stage,
            amount: input.amount != null ? Number(input.amount) : undefined,
            status: input.status === 'sent' ? 'sent' : input.status === 'paid' ? 'paid' : undefined,
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'update_payment_stage') {
            const { data: proj } = await admin.from('budget_products').select('project_id').eq('id', productId).single()
            const projectId = (proj as { project_id?: string } | null)?.project_id
            const { data: projRow } = projectId
              ? await admin.from('projects').select('client_id').eq('id', projectId).single()
              : { data: null }
            const clientId = (projRow as { client_id?: string } | null)?.client_id
            if (clientId) {
              await insertClientActivity(admin, {
                clientId,
                projectId: projectId ?? undefined,
                actionType: 'payment_updated',
                source: 'email',
                summary: `${stage} mis à jour`,
                metadata: { productId, stage },
                ownerId: userId,
              })
            }
          }
        } else if (block.name === 'add_avancement') {
          const productId = String(input.productId ?? '')
          const r = await executeAddAvancement(admin, userId, {
            productId,
            amount: input.amount != null ? Number(input.amount) : undefined,
            status: input.status === 'sent' ? 'sent' : input.status === 'paid' ? 'paid' : undefined,
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'add_avancement') {
            const { data: proj } = await admin.from('budget_products').select('project_id').eq('id', productId).single()
            const projectId = (proj as { project_id?: string } | null)?.project_id
            const { data: projRow } = projectId
              ? await admin.from('projects').select('client_id').eq('id', projectId).single()
              : { data: null }
            const clientId = (projRow as { client_id?: string } | null)?.client_id
            if (clientId) {
              await insertClientActivity(admin, {
                clientId,
                projectId: projectId ?? undefined,
                actionType: 'payment_updated',
                source: 'email',
                summary: 'Avancement ajouté',
                metadata: { productId },
                ownerId: userId,
              })
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
