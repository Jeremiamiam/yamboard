"use client";

import { useState, useEffect } from "react";
import { getClientLogoSignedUrl } from "@/app/(dashboard)/actions/clients";
import { getContrastForTintedBg } from "@/lib/color-utils";
import { useTheme } from "@/context/ThemeContext";
import type { Client } from "@/lib/types";

const LOGO_CACHE_KEY = "yam:logo_urls";
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 min (signed URL expires in 1h)

function getCachedLogoUrl(logoPath: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LOGO_CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as Record<string, { url: string; expiresAt: number }>;
    const entry = cache[logoPath];
    if (!entry || Date.now() > entry.expiresAt) return null;
    return entry.url;
  } catch {
    return null;
  }
}

function setCachedLogoUrl(logoPath: string, url: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = sessionStorage.getItem(LOGO_CACHE_KEY);
    const cache = (raw ? JSON.parse(raw) : {}) as Record<string, { url: string; expiresAt: number }>;
    cache[logoPath] = { url, expiresAt: Date.now() + CACHE_TTL_MS };
    sessionStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // quota or parse error — ignore
  }
}

/** Invalide le cache logo (après upload/suppression) */
export function invalidateLogoCache(logoPath?: string): void {
  if (typeof window === "undefined") return;
  try {
    if (!logoPath) {
      sessionStorage.removeItem(LOGO_CACHE_KEY);
      return;
    }
    const raw = sessionStorage.getItem(LOGO_CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw) as Record<string, unknown>;
    delete cache[logoPath];
    sessionStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

type Props = {
  client: Client;
  size?: "sm" | "md" | "lg";
  rounded?: "lg" | "xl";
  className?: string;
  active?: boolean;
};

const SIZE_CLASS = {
  sm: "w-8 h-8 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-11 h-11 text-base",
};

export function ClientAvatar({ client, size = "md", rounded = "xl", className = "", active }: Props) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const cached = client.logoPath ? getCachedLogoUrl(client.logoPath) : null;
  const [logoUrl, setLogoUrl] = useState<string | null>(cached);
  const [loading, setLoading] = useState(!!client.logoPath && !cached);

  useEffect(() => {
    if (!client.logoPath) return;
    const cached = getCachedLogoUrl(client.logoPath);
    if (cached) {
      setLogoUrl(cached);
      setLoading(false);
      return;
    }
    getClientLogoSignedUrl(client.logoPath).then((result) => {
      setLoading(false);
      if ("signedUrl" in result && client.logoPath) {
        setLogoUrl(result.signedUrl);
        setCachedLogoUrl(client.logoPath, result.signedUrl);
      }
    });
  }, [client.logoPath]);

  const initials =
    client.name.slice(0, 1).toUpperCase() + client.name.slice(1, 2).toLowerCase();

  const roundedClass = rounded === "lg" ? "rounded-lg" : "rounded-xl";
  const baseClass = `${roundedClass} flex items-center justify-center font-bold shrink-0 ${SIZE_CLASS[size]} ${className}`;
  const bgTint = active ? "35" : "25";
  const contrastColor = getContrastForTintedBg(client.color, bgTint, isDark);
  const style = active
    ? {
        background: client.color + "35",
        color: contrastColor,
        borderColor: client.color + "60",
        boxShadow: `0 0 0 2px ${client.color}50`,
      }
    : {
        background: client.color + "25",
        color: contrastColor,
        border: `1px solid ${client.color}35`,
      };

  if (logoUrl && !loading) {
    return (
      <div
        className={`${baseClass} overflow-hidden border`}
        style={style as React.CSSProperties}
      >
        <img
          src={logoUrl}
          alt={client.name}
          className="w-full h-full object-contain p-1.5"
        />
      </div>
    );
  }

  return (
    <div className={`${baseClass} border`} style={style as React.CSSProperties}>
      {initials}
    </div>
  );
}
