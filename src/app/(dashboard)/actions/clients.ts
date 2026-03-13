"use server";

import { createClient as createSupabaseClient } from "@/lib/supabase/server";

// ─── Extraction couleur depuis SVG ───────────────────────────────
const SKIP_COLORS = new Set([
  "transparent", "none", "currentColor",
  "#fff", "#ffffff", "#FFF", "#FFFFFF",
  "#000", "#000000", "#00000000",
  "#f0f0f0", "#f5f5f5", "#fafafa", "#e5e5e5",
  "#fff0", "#ffff", "#0000",
]);

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return null;
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

function isTooLightOrDark(rgb: { r: number; g: number; b: number }): boolean {
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.85 || luminance < 0.08;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
}

/** Extrait la première couleur significative d'un SVG (fill, stroke, stop-color, style). */
function extractColorFromSvg(svgContent: string): string | null {
  const normalized = svgContent.replace(/\s+/g, " ");
  let fallback: string | null = null; // première couleur non-skippée, même si trop claire/sombre
  const tryHex = (hex: string): string | null => {
    const lower = hex.toLowerCase();
    if (SKIP_COLORS.has(lower)) return null;
    const rgb = hexToRgb(hex);
    if (!rgb) return null;
    if (!fallback) fallback = lower;
    if (!isTooLightOrDark(rgb)) return lower;
    return null;
  };
  // Hex 6: #rrggbb (fill="#...", stroke="#...", style="fill:#...")
  const hex6 = normalized.match(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g);
  if (hex6) {
    for (const h of hex6) {
      const result = tryHex(h);
      if (result) return result;
    }
  }
  // Hex 3: #rgb
  const hex3 = normalized.match(/#[0-9a-fA-F]{3}(?![0-9a-fA-F])/g);
  if (hex3) {
    for (const h of hex3) {
      const expanded = "#" + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
      const result = tryHex(expanded);
      if (result) return result;
    }
  }
  // rgb(r,g,b)
  const rgbMatch = normalized.match(/rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g);
  if (rgbMatch) {
    for (const m of rgbMatch) {
      const parts = m.match(/(\d+)/g);
      if (!parts || parts.length !== 3) continue;
      const [r, g, b] = parts.map(Number);
      if (isTooLightOrDark({ r, g, b })) continue;
      return rgbToHex(r, g, b);
    }
  }
  return fallback;
}

/**
 * Remplace toutes les couleurs significatives du SVG par currentColor.
 * Les couleurs skippées (blanc, noir, transparent) restent intactes.
 */
function recolorSvgToCurrentColor(svgContent: string): string {
  let result = svgContent;
  // fill="<hex>" et stroke="<hex>" → currentColor (sauf skipped)
  result = result.replace(
    /(fill|stroke)\s*=\s*"(#[0-9a-fA-F]{3,8})"/g,
    (match, attr, hex) => {
      const lower = hex.toLowerCase();
      if (SKIP_COLORS.has(lower) || lower === "none") return match;
      return `${attr}="currentColor"`;
    }
  );
  // style="fill:#xxx" ou style="stroke:#xxx"
  result = result.replace(
    /(fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8})/g,
    (match, attr, hex) => {
      const lower = hex.toLowerCase();
      if (SKIP_COLORS.has(lower) || lower === "none") return match;
      return `${attr}:currentColor`;
    }
  );
  // rgb(r,g,b) dans fill/stroke attrs
  result = result.replace(
    /(fill|stroke)\s*=\s*"rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)"/g,
    (_, attr) => `${attr}="currentColor"`
  );
  return result;
}

// ─── createClientLogoUploadUrl ───────────────────────────────────
// Génère une signed URL d'upload pour le logo client (SVG uniquement).
// Path: {uid}/client-logos/{clientId}/logo.svg
export async function createClientLogoUploadUrl(
  clientId: string
): Promise<{ path: string; token: string } | { error: string }> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Non authentifié" };
  }

  const path = `${user.id}/client-logos/${clientId}/logo.svg`;

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUploadUrl(path);

  if (error || !data) {
    return { error: error?.message ?? "Échec de la création de l'URL d'upload" };
  }

  return { path: data.path, token: data.token };
}

// ─── saveClientLogo ──────────────────────────────────────────────
// Met à jour clients.logo_path après upload réussi.
// Extrait la couleur dominante du SVG et met à jour client.color si trouvée.
export async function saveClientLogo(
  clientId: string,
  storagePath: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Non authentifié" };
  }

  let extractedColor: string | null = null;
  try {
    const { data: blob, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);
    if (!downloadError && blob) {
      const text = await blob.text();
      extractedColor = extractColorFromSvg(text);
    }
  } catch {
    // Ignore — on garde la couleur existante
  }

  const updates: Record<string, unknown> = { logo_path: storagePath };
  if (extractedColor) updates.color = extractedColor;

  const { error } = await supabase
    .from("clients")
    .update(updates)
    .eq("id", clientId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return { error: null };
}

// ─── getClientLogoSignedUrl ─────────────────────────────────────
// Génère une signed URL de lecture pour le logo (TTL 1h).
export async function getClientLogoSignedUrl(
  logoPath: string
): Promise<{ signedUrl: string } | { error: string }> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Non authentifié" };
  }

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(logoPath, 3600);

  if (error || !data) {
    return { error: error?.message ?? "Échec de la génération de l'URL" };
  }

  return { signedUrl: data.signedUrl };
}

// ─── getClientLogoForDownload ─────────────────────────────────────
// Récupère le contenu SVG du logo pour téléchargement.
export async function getClientLogoForDownload(
  logoPath: string
): Promise<{ content: string } | { error: string }> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Non authentifié" };
  }

  const { data: blob, error } = await supabase.storage
    .from("documents")
    .download(logoPath);

  if (error || !blob) {
    return { error: error?.message ?? "Logo introuvable" };
  }

  const content = await blob.text();
  return { content };
}

// ─── removeClientLogo ─────────────────────────────────────────────
// Supprime le logo (DB + Storage).
export async function removeClientLogo(
  clientId: string
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Non authentifié" };
  }

  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("logo_path")
    .eq("id", clientId)
    .eq("owner_id", user.id)
    .single();

  if (fetchError || !client?.logo_path) {
    const { error } = await supabase
      .from("clients")
      .update({ logo_path: null, color: "#71717a" })
      .eq("id", clientId)
      .eq("owner_id", user.id);
    return error ? { error: error.message } : { error: null };
  }

  const { error: storageError } = await supabase.storage
    .from("documents")
    .remove([client.logo_path]);

  if (storageError) return { error: storageError.message };

  const { error } = await supabase
    .from("clients")
    .update({ logo_path: null, color: "#71717a" })
    .eq("id", clientId)
    .eq("owner_id", user.id);

  if (error) return { error: error.message };
  return { error: null };
}
