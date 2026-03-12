/**
 * Utilitaires couleur pour accessibilité (contraste texte/fond).
 * Basé sur la luminance relative WCAG pour choisir automatiquement
 * texte clair ou sombre selon le fond.
 */

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.replace(/^#/, "").match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) {
    // Essai format court #rgb
    const short = hex.replace(/^#/, "").match(/^([a-f\d])([a-f\d])([a-f\d])$/i);
    if (short) {
      return {
        r: parseInt(short[1] + short[1], 16),
        g: parseInt(short[2] + short[2], 16),
        b: parseInt(short[3] + short[3], 16),
      };
    }
    return null;
  }
  return {
    r: parseInt(m[1], 16),
    g: parseInt(m[2], 16),
    b: parseInt(m[3], 16),
  };
}

/**
 * Luminance relative (WCAG) — 0 = noir, 1 = blanc.
 * https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0.5; // fallback neutre

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Retourne "white" ou "black" (ou équivalent) pour un contraste optimal
 * sur le fond donné. Seuil ~0.4 : au-dessus = fond clair → texte sombre.
 */
export function getContrastColor(backgroundColor: string): "white" | "black" {
  const luminance = getLuminance(backgroundColor);
  return luminance > 0.4 ? "black" : "white";
}

/**
 * Retourne la classe Tailwind pour le texte/icône sur un fond dynamique.
 */
export function getContrastTextClass(backgroundColor: string): string {
  return getContrastColor(backgroundColor) === "white"
    ? "text-white"
    : "text-zinc-900";
}

/**
 * Retourne la couleur CSS pour style inline (ex. color: ...).
 */
export function getContrastTextColor(backgroundColor: string): string {
  return getContrastColor(backgroundColor) === "white" ? "#ffffff" : "#18181b";
}

/**
 * Simule un fond avec opacité (ex. color + "20" en Tailwind).
 * Retourne la couleur hex résultante après blend avec la couleur de fond.
 */
function blendWithBg(hex: string, alphaHex: string, bgHex: string): string {
  const rgb = hexToRgb(hex);
  const bg = hexToRgb(bgHex);
  if (!rgb || !bg) return bgHex;
  const alpha = parseInt(alphaHex, 16) / 255;
  const r = Math.round((1 - alpha) * bg.r + alpha * rgb.r);
  const g = Math.round((1 - alpha) * bg.g + alpha * rgb.g);
  const b = Math.round((1 - alpha) * bg.b + alpha * rgb.b);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

const LIGHT_BG = "#ffffff";
const DARK_BG = "#09090b"; // zinc-950

/**
 * Pour un fond du type "color" + suffixe opacité (ex. #8B9B3C + "20"),
 * retourne la couleur de contraste pour le texte/icône.
 * @param isDark - true en dark mode (blend avec fond sombre → texte clair)
 */
export function getContrastForTintedBg(
  baseColor: string,
  opacitySuffix: string,
  isDark = false
): string {
  const bg = isDark ? DARK_BG : LIGHT_BG;
  const blended = blendWithBg(baseColor, opacitySuffix, bg);
  return getContrastTextColor(blended);
}
