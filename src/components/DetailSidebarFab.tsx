"use client";

import { useStore } from "@/lib/store";
import { useClient } from "@/hooks/useStoreData";
import { getContrastTextColor } from "@/lib/color-utils";

/** FAB mobile : icône contacts pour ouvrir, croix pour fermer le panneau */
export function DetailSidebarFab() {
  const selectedClientId = useStore((s) => s.selectedClientId);
  const currentView = useStore((s) => s.currentView);
  const detailSidebarOpen = useStore((s) => s.detailSidebarOpen);
  const toggleDetailSidebar = useStore((s) => s.toggleDetailSidebar);
  const closeDetailSidebar = useStore((s) => s.closeDetailSidebar);
  const client = useClient(selectedClientId ?? undefined);

  const show =
    !!selectedClientId &&
    (currentView === "client" || currentView === "project");

  if (!show) return null;

  const bgColor = detailSidebarOpen ? "#52525b" : (client?.color ?? "#6366f1");

  return (
    <button
      onClick={detailSidebarOpen ? closeDetailSidebar : toggleDetailSidebar}
      className="fixed bottom-6 left-6 z-[9998] w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center cursor-pointer md:hidden"
      style={{ background: bgColor, color: getContrastTextColor(bgColor) }}
      title={detailSidebarOpen ? "Fermer" : "Contacts, liens, documents"}
      aria-label={detailSidebarOpen ? "Fermer" : "Ouvrir contacts et infos"}
    >
      {detailSidebarOpen ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )}
    </button>
  );
}
