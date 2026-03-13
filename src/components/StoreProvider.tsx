"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useStore } from "@/lib/store";
import { useDocumentExtractionRealtime } from "@/hooks/useDocumentExtractionRealtime";
import { useEmailActivityRealtime } from "@/hooks/useEmailActivityRealtime";
import { usePendingSuggestionsRealtime } from "@/hooks/usePendingSuggestionsRealtime";

export function StoreProvider({ children, userName }: { children: React.ReactNode; userName?: string }) {
  const loadData = useStore((s) => s.loadData);
  const initTheme = useStore((s) => s.initTheme);
  const setUserName = useStore((s) => s.setUserName);

  useEffect(() => {
    initTheme();
    if (userName) setUserName(userName);
    loadData().catch((err) => {
      console.error('[StoreProvider] loadData failed:', err);
    });
  }, [loadData, initTheme, userName, setUserName]);

  useDocumentExtractionRealtime();
  useEmailActivityRealtime();
  usePendingSuggestionsRealtime();

  return (
    <>
      {children}
      <Toaster
        position="top-right"
        offset={{ top: "5.5rem", right: "1rem" }}
        richColors
        toastOptions={{ className: "shadow-lg border" }}
      />
    </>
  );
}
