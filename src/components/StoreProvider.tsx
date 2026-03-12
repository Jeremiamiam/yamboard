"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";
import { useStore } from "@/lib/store";
import { useDocumentExtractionRealtime } from "@/hooks/useDocumentExtractionRealtime";
import { useEmailActivityRealtime } from "@/hooks/useEmailActivityRealtime";

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const loadData = useStore((s) => s.loadData);
  const initTheme = useStore((s) => s.initTheme);

  useEffect(() => {
    initTheme();
    loadData().catch((err) => {
      console.error('[StoreProvider] loadData failed:', err);
    });
  }, [loadData, initTheme]);

  useDocumentExtractionRealtime();
  useEmailActivityRealtime();

  return (
    <>
      {children}
      <Toaster position="bottom-right" richColors />
    </>
  );
}
