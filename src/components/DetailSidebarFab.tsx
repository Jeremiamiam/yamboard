"use client";

import { useStore } from "@/lib/store";
import { useClient } from "@/hooks/useStoreData";
import { getContrastTextColor } from "@/lib/color-utils";

/** FAB mobile pour ouvrir le panneau Contacts/Liens/Documents en plein écran */
export function DetailSidebarFab() {
  const selectedClientId = useStore((s) => s.selectedClientId);
  const currentView = useStore((s) => s.currentView);
  const detailSidebarOpen = useStore((s) => s.detailSidebarOpen);
  const toggleDetailSidebar = useStore((s) => s.toggleDetailSidebar);
  const client = useClient(selectedClientId ?? undefined);

  const show =
    !!selectedClientId &&
    (currentView === "client" || currentView === "project") &&
    !detailSidebarOpen;

  if (!show) return null;

  const bgColor = client?.color ?? "#6366f1";

  return (
    <button
      onClick={toggleDetailSidebar}
      className="fixed bottom-6 left-6 z-[9998] w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center cursor-pointer md:hidden"
      style={{ background: bgColor, color: getContrastTextColor(bgColor) }}
      title="Contacts, liens, documents"
      aria-label="Ouvrir contacts et infos"
    >
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    </button>
  );
}
