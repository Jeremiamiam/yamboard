"use client";

import { useStore } from "@/lib/store";
import { ClientSidebar } from "@/components/ClientSidebar";

import { ClientDetailSidebar } from "@/components/ClientDetailSidebar";
import { useStoreLoaded, useStoreLoading, useSidebarClients, useSidebarProspects, useSidebarArchived } from "@/hooks/useStoreData";

export function ClientSidebarWrapper({
  fallback,
}: {
  fallback: React.ReactNode;
}) {
  const loaded = useStoreLoaded();
  const loading = useStoreLoading();
  const clients = useSidebarClients();
  const prospects = useSidebarProspects();
  const archived = useSidebarArchived();
  const selectedClientId = useStore((s) => s.selectedClientId);
  const currentView = useStore((s) => s.currentView);

  const showDetailSidebar =
    !!selectedClientId && (currentView === "client" || currentView === "project");

  if (!loaded && loading && clients.length === 0 && prospects.length === 0 && archived.length === 0) {
    return <>{fallback}</>;
  }

  return (
    <>
      <ClientSidebar
        clients={clients}
        prospects={prospects}
        archived={archived}
      />
      {showDetailSidebar && <ClientDetailSidebar clientId={selectedClientId} />}
    </>
  );
}
