"use client";

import { usePathname } from "next/navigation";
import { ClientSidebar } from "@/components/ClientSidebar";
import { ClientDetailSidebar } from "@/components/ClientDetailSidebar";
import { useStoreLoaded, useStoreLoading, useSidebarClients, useSidebarProspects, useSidebarArchived } from "@/hooks/useStoreData";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function extractClientId(pathname: string | null): string | null {
  if (!pathname) return null;
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length >= 1 && UUID_RE.test(parts[0])) return parts[0];
  return null;
}

export function ClientSidebarWrapper({
  fallback,
}: {
  fallback: React.ReactNode;
}) {
  const pathname = usePathname();
  const loaded = useStoreLoaded();
  const loading = useStoreLoading();
  const clients = useSidebarClients();
  const prospects = useSidebarProspects();
  const archived = useSidebarArchived();

  const clientId = extractClientId(pathname);

  // Toujours afficher la liste des clients
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
      {clientId && <ClientDetailSidebar clientId={clientId} />}
    </>
  );
}
