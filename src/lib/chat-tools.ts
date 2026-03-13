/**
 * Exécution serveur des outils du chat (tool use).
 * Utilise le client Supabase serveur — pas de store, pas de toast.
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type ToolResult =
  | { ok: true; type: "create_client"; clientId: string; name: string }
  | { ok: true; type: "client_exists"; clientId: string; name: string }
  | { ok: true; type: "create_project"; projectId: string; clientId: string; name: string }
  | { ok: true; type: "create_product"; productId: string; projectId: string; name: string; devisAmount?: number }
  | { ok: true; type: "create_contact"; contactId: string; clientId: string; name: string }
  | { ok: true; type: "contact_exists"; contactId: string; clientId: string; name: string }
  | { ok: true; type: "create_note"; documentId: string; clientId: string; name: string }
  | { ok: true; type: "create_link"; linkId: string; clientId: string; name: string }
  | { ok: true; type: "update_payment_stage"; productId: string; stage: string }
  | { ok: true; type: "add_avancement"; productId: string }
  | { ok: false; error: string };

export function getToolResultMessage(r: ToolResult): string {
  if (!r.ok) return `Erreur : ${r.error}`;
  if (r.type === "create_client") return `Client créé : ${r.name} (id: ${r.clientId})`;
  if (r.type === "client_exists") return `Client déjà existant : ${r.name} (id: ${r.clientId}) — utilise cet ID`;
  if (r.type === "create_project") return `Projet créé : ${r.name} (id: ${r.projectId})`;
  if (r.type === "create_product")
    return `Produit créé : ${r.name} (id: ${r.productId})${r.devisAmount ? ` — devis ${r.devisAmount} €` : ""}`;
  if (r.type === "create_contact") return `Contact ajouté : ${r.name} (client ${r.clientId})`;
  if (r.type === "contact_exists") return `Contact déjà enregistré : ${r.name}`;
  if (r.type === "create_note") return `Note créée : ${r.name} (client ${r.clientId})`;
  if (r.type === "create_link") return `Lien ajouté : ${r.name} (client ${r.clientId})`;
  if (r.type === "update_payment_stage") return `${r.stage} mis à jour (produit ${r.productId})`;
  if (r.type === "add_avancement") return `Avancement ajouté (produit ${r.productId})`;
  return "Erreur inconnue";
}

export async function executeCreateContact(
  supabase: SupabaseClient,
  userId: string,
  params: {
    clientId: string;
    name: string;
    email?: string;
    isPrimary?: boolean;
    /** Si fourni (webhook email), utilise cet owner pour visibilité côté propriétaire du client */
    ownerId?: string;
  }
): Promise<ToolResult> {
  const name = params.name?.trim();
  if (!name) return { ok: false, error: "Le nom du contact est requis." };
  if (!params.clientId) return { ok: false, error: "L'ID du client est requis." };

  const email = params.email?.trim() || null;
  const ownerId = params.ownerId ?? userId;

  // Vérifier si un contact existe déjà (même nom ou même email, insensible à la casse)
  const orConditions = [`name.ilike.${name}`];
  if (email) orConditions.push(`email.ilike.${email}`);

  const { data: existing } = await supabase
    .from("contacts")
    .select("id")
    .eq("client_id", params.clientId)
    .eq("owner_id", ownerId)
    .or(orConditions.join(","))
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      type: "contact_exists",
      contactId: existing.id,
      clientId: params.clientId,
      name,
    };
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      client_id: params.clientId,
      name,
      email,
      is_primary: params.isPrimary ?? false,
      owner_id: ownerId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    type: "create_contact",
    contactId: data.id,
    clientId: params.clientId,
    name,
  };
}

export async function executeCreateClient(
  supabase: SupabaseClient,
  userId: string,
  params: { name: string; category?: "client" }
): Promise<ToolResult> {
  const name = params.name?.trim();
  if (!name) return { ok: false, error: "Le nom du client est requis." };

  // Vérifier si un client avec le même nom existe déjà (insensible à la casse)
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();

  if (existing) {
    return {
      ok: true,
      type: "client_exists",
      clientId: existing.id,
      name,
    };
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      name,
      category: params.category ?? "client",
      status: "active",
      color: null,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return { ok: true, type: "create_client", clientId: data.id, name };
}

export async function executeCreateProject(
  supabase: SupabaseClient,
  userId: string,
  params: { clientId: string; name: string; potentialAmount?: number }
): Promise<ToolResult> {
  const name = params.name?.trim();
  if (!name) return { ok: false, error: "Le nom du projet est requis." };
  if (!params.clientId) return { ok: false, error: "L'ID du client est requis." };

  const { data, error } = await supabase
    .from("projects")
    .insert({
      client_id: params.clientId,
      name,
      type: "other",
      status: "active",
      description: null,
      potential_amount: params.potentialAmount ?? null,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    type: "create_project",
    projectId: data.id,
    clientId: params.clientId,
    name,
  };
}

export async function executeCreateProduct(
  supabase: SupabaseClient,
  userId: string,
  params: { projectId: string; name: string; devisAmount?: number }
): Promise<ToolResult> {
  const name = params.name?.trim();
  if (!name) return { ok: false, error: "Le nom du produit est requis." };
  if (!params.projectId) return { ok: false, error: "L'ID du projet est requis." };

  const devisAmount = params.devisAmount != null ? Number(params.devisAmount) : undefined;
  const totalAmount = devisAmount ?? 0;
  const devis =
    devisAmount != null && devisAmount > 0
      ? { amount: devisAmount, status: "pending" as const }
      : null;

  const { data, error } = await supabase
    .from("budget_products")
    .insert({
      project_id: params.projectId,
      name,
      total_amount: totalAmount,
      devis,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    type: "create_product",
    productId: data.id,
    projectId: params.projectId,
    name,
    devisAmount: devisAmount ?? undefined,
  };
}

export async function executeCreateNote(
  supabase: SupabaseClient,
  userId: string,
  params: {
    clientId: string;
    projectId?: string;
    name: string;
    content: string;
    /** Si fourni (webhook email), utilise cet owner pour visibilité côté propriétaire du client */
    ownerId?: string;
  }
): Promise<ToolResult> {
  const name = params.name?.trim();
  const content = params.content?.trim() ?? "";
  if (!name) return { ok: false, error: "Le nom de la note est requis." };
  if (!params.clientId) return { ok: false, error: "L'ID du client est requis." };

  const ownerId = params.ownerId ?? userId;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      client_id: params.clientId,
      project_id: params.projectId ?? null,
      name,
      type: "other",
      storage_path: null,
      content,
      owner_id: ownerId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    type: "create_note",
    documentId: data.id,
    clientId: params.clientId,
    name,
  };
}

export async function executeCreateLink(
  supabase: SupabaseClient,
  userId: string,
  params: { clientId: string; projectId?: string; name: string; url: string }
): Promise<ToolResult> {
  const name = params.name?.trim();
  const url = params.url?.trim() ?? "";
  if (!name) return { ok: false, error: "Le nom du lien est requis." };
  if (!url) return { ok: false, error: "L'URL est requise." };
  if (!params.clientId) return { ok: false, error: "L'ID du client est requis." };

  const { data, error } = await supabase
    .from("client_links")
    .insert({
      client_id: params.clientId,
      label: name,
      url,
      owner_id: userId,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    type: "create_link",
    linkId: data.id,
    clientId: params.clientId,
    name,
  };
}

type PaymentStage = { amount?: number; date?: string; status: "pending" | "sent" | "paid" };

export async function executeUpdatePaymentStage(
  supabase: SupabaseClient,
  userId: string,
  params: {
    productId: string;
    stage: "devis" | "acompte" | "solde";
    amount?: number;
    status?: "pending" | "sent" | "paid";
  }
): Promise<ToolResult> {
  const { productId, stage, amount, status } = params;
  if (!productId) return { ok: false, error: "productId requis." };

  const { data: product } = await supabase
    .from("budget_products")
    .select("id, devis, acompte, solde")
    .eq("id", productId)
    .eq("owner_id", userId)
    .single();

  if (!product) return { ok: false, error: "Produit non trouvé." };

  const current = ((product as Record<string, unknown>)[stage] as PaymentStage | null) ?? {};
  const value: Record<string, unknown> = {
    ...current,
    ...(amount != null && { amount }),
    ...(status && { status }),
  };
  if (!value.status) value.status = "pending";

  const { error } = await supabase
    .from("budget_products")
    .update({ [stage]: value })
    .eq("id", productId)
    .eq("owner_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, type: "update_payment_stage", productId, stage };
}

export async function executeAddAvancement(
  supabase: SupabaseClient,
  userId: string,
  params: { productId: string; amount?: number; status?: "pending" | "sent" | "paid" }
): Promise<ToolResult> {
  const { productId, amount, status } = params;
  if (!productId) return { ok: false, error: "productId requis." };

  const { data: product } = await supabase
    .from("budget_products")
    .select("id, avancement")
    .eq("id", productId)
    .eq("owner_id", userId)
    .single();

  if (!product) return { ok: false, error: "Produit non trouvé." };

  const current = Array.isArray(product.avancement) ? product.avancement : product.avancement ? [product.avancement] : [];
  const newStage: PaymentStage = { amount: amount ?? 0, status: status ?? "pending" };
  const avancements = [...(current as PaymentStage[]), newStage];

  const { error } = await supabase
    .from("budget_products")
    .update({ avancement: avancements })
    .eq("id", productId)
    .eq("owner_id", userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true, type: "add_avancement", productId };
}
