"use client";

import { useSidebarClients, useStoreLoaded } from "@/hooks/useStoreData";
import Link from "next/link";

export default function Home() {
  const clients = useSidebarClients();
  const loaded = useStoreLoaded();

  return (
    <div
      className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
          Accueil
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-600 text-center max-w-md">
          {loaded
            ? clients.length === 0
              ? "Aucun client. Créez-en un depuis la sidebar."
              : `${clients.length} client${clients.length > 1 ? "s" : ""} actif${clients.length > 1 ? "s" : ""}. Sélectionne un client dans la sidebar.`
            : "Chargement…"}
        </p>
        {loaded && clients.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2 justify-center">
            {clients.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/${c.id}`}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: c.color + "20",
                  color: c.color,
                  border: `1px solid ${c.color}40`,
                }}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
