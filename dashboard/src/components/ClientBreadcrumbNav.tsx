"use client";

import Link from "next/link";
import { ClientAvatar } from "@/components/ClientAvatar";
import type { Client, Project } from "@/lib/types";

type Props = {
  client: Client;
  project?: Project | null;
  clientId: string;
  rightSlot?: React.ReactNode;
};

/**
 * Navigation top commune avec fil d'Ariane pour les vues client et projet.
 * Remplace le doublon sidebar "Retour + client" + header projet.
 */
export function ClientBreadcrumbNav({ client, project, clientId, rightSlot }: Props) {
  return (
    <header
      className="fixed right-0 flex items-center justify-between gap-4 px-6 py-4 border-b"
      style={{
        top: "var(--nav-h)",
        left: "var(--sidebar-w)",
        right: 0,
        height: "var(--breadcrumb-h)",
        background: "var(--color-foreground)",
        borderColor: "var(--color-mist)",
      }}
    >
      <nav className="flex items-center gap-2 min-w-0 flex-1" aria-label="Fil d'Ariane">
        <Link
          href={`/${clientId}`}
          className="flex items-center gap-2 shrink-0 hover:opacity-90 transition-opacity"
          style={{ color: "var(--color-text)" }}
        >
          <ClientAvatar client={client} size="sm" rounded="lg" />
          <span className="font-medium">{client.name}</span>
        </Link>
        {project && (
          <>
            <span className="shrink-0" style={{ color: "var(--color-text-supporting)" }}>/</span>
            <Link
              href={`/${clientId}/${project.id}`}
              className="font-medium truncate hover:opacity-90 transition-opacity"
              style={{ color: "var(--color-text)" }}
            >
              {project.name}
            </Link>
          </>
        )}
      </nav>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}
