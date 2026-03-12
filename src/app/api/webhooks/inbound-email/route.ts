/**
 * Webhook Resend Inbound — Email → Agent Yam
 *
 * Quand tu envoies un mail à ton adresse agent (ex: agent@ton-domaine.com),
 * Resend reçoit le mail et POST ce webhook. On identifie l'utilisateur par
 * l'email expéditeur, puis on envoie le contenu à Claude en mode agency
 * avec les outils (create_client, create_project, create_note, etc.).
 *
 * Config Resend : Receiving → Webhook → URL = https://ton-app.com/api/webhooks/inbound-email
 * Event = email.received
 */
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildAgencyContextForUser } from '@/lib/context-builders'
import {
  executeCreateClient,
  executeCreateProject,
  executeCreateProduct,
  executeCreateNote,
  executeCreateLink,
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
    description: "Crée un nouveau client ou prospect dans Yam.",
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Nom du client ou prospect' },
        industry: { type: 'string', description: 'Secteur d\'activité (optionnel)' },
        category: { type: 'string', enum: ['client', 'prospect'], description: 'client ou prospect' },
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
      const resend = new Resend(resendApiKey)
      resend.webhooks.verify({
        payload: rawBody,
        headers: {
          id: req.headers.get('svix-id') ?? '',
          timestamp: req.headers.get('svix-timestamp') ?? '',
          signature: req.headers.get('svix-signature') ?? '',
        },
        webhookSecret,
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
    const resend = new Resend(resendApiKey)
    const { data: receivedData, error: receivedErr } = await resend.emails.receiving.get(emailId)

    if (receivedErr || !receivedData) {
      console.error('[inbound-email] Impossible de récupérer le corps:', receivedErr)
      return NextResponse.json({ ok: true })
    }

    const body = receivedData.text ?? receivedData.html ?? ''
    await processEmailWithAgent(user.id, event.data?.subject ?? '(sans sujet)', body)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[inbound-email] Erreur:', err)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

async function processEmailWithAgent(userId: string, subject: string, body: string): Promise<void> {
  const systemPrompt = await buildAgencyContextForUser(userId)
  const userMessage = `[Email reçu — Sujet: ${subject}]

${body}

---
Traite ce mail : exécute les actions demandées (ajouter un client, un doc, une note, un lien, etc.) via tes outils. Sois concis.`

  const admin = createAdminClient()

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[inbound-email] ANTHROPIC_API_KEY manquante')
    return
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const apiMessages: Array<
    | { role: 'user'; content: string }
    | { role: 'user'; content: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> }
    | { role: 'assistant'; content: string | Array<{ type: 'text'; text: string } | { type: 'tool_use'; id: string; name: string; input: unknown }> }
  > = [{ role: 'user', content: userMessage }]

  let lastMessage: Awaited<ReturnType<typeof anthropic.messages.create>>

  while (true) {
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
      console.log('[inbound-email] Réponse agent:', text)
      return
    }

    const toolUses = lastMessage.content.filter(isToolUseBlock)
    const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = []

    for (const block of toolUses) {
      const input = block.input as Record<string, unknown>
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
          const r = await executeCreateNote(admin, userId, {
            clientId,
            projectId: input.projectId ? String(input.projectId) : undefined,
            name: String(input.name ?? ''),
            content: String(input.content ?? ''),
          })
          result = getToolResultMessage(r)
          if (r.ok && r.type === 'create_note') {
            await insertClientActivity(admin, {
              clientId,
              projectId: input.projectId ? String(input.projectId) : undefined,
              actionType: 'note_added',
              source: 'email',
              summary: `Note ajoutée : ${r.name}`,
              metadata: { name: r.name },
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
        } else {
          result = `Outil inconnu : ${block.name}`
        }
      } catch (err) {
        result = `Erreur : ${err instanceof Error ? err.message : 'Erreur inconnue'}`
      }
      toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: result })
      console.log('[inbound-email] Tool', block.name, '→', result)
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
