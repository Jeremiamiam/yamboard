import { getSupabase, DashboardClient } from "@/lib/supabase";
import { Header } from "@/components/Header";
import Link from "next/link";

async function getClients(): Promise<DashboardClient[]> {
  const { data, error } = await getSupabase()
    .from("dashboard_clients")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as DashboardClient[];
}

const STEP_LABELS: Record<string, string> = {
  brief_strategique: "Brief",
  platform: "Plateforme",
  campaign: "Campagne",
  site: "Site",
  wiki: "Wiki",
};

export default async function DashboardPage() {
  const clients = await getClients();

  return (
    <div className="min-h-screen">
      <Header type="dashboard" count={clients.length} />

      <main className="max-w-5xl mx-auto px-6 py-12">
        {clients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--border)] p-16 text-center">
            <p className="text-zinc-500 mb-2">Aucun client synchronisé</p>
            <p className="text-sm text-zinc-600">
              Lance <code className="font-mono text-zinc-400">node scripts/sync-dashboard.mjs</code> depuis la racine du projet
            </p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {clients.map((client) => {
              const outputs = (client.outputs ?? {}) as Record<string, boolean>;
              const hasWiki = outputs.wiki === true;

              return (
                <li key={client.id}>
                  <Link
                    href={hasWiki ? `/wiki/${client.slug}` : "#"}
                    className={`block rounded-xl border border-[var(--border)] p-5 transition-all hover:border-zinc-600 hover:bg-white/[0.02] ${
                      !hasWiki ? "opacity-60 cursor-not-allowed" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="font-semibold text-lg text-white">
                          {client.name}
                        </h2>
                        <p className="text-sm text-zinc-500 font-mono mt-0.5">
                          {client.slug}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-zinc-500">
                          {client.progress ?? "0/5"}
                        </span>
                        {hasWiki && (
                          <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                            Wiki
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {Object.entries(STEP_LABELS).map(([key, label]) => (
                        <span
                          key={key}
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-mono ${
                            outputs[key]
                              ? "bg-emerald-500/15 text-emerald-400"
                              : "bg-zinc-800/50 text-zinc-600"
                          }`}
                        >
                          {label}
                        </span>
                      ))}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
