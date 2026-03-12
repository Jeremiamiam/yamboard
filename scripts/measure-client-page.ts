/**
 * Script de diagnostic performance — page client
 *
 * Usage: npx tsx scripts/measure-client-page.ts <clientId>
 *
 * Mesure le temps de chaque requête Supabase pour identifier les goulots.
 * Nécessite .env.local avec NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
 */

import { createClient } from "@supabase/supabase-js";

const clientId = process.argv[2];
if (!clientId) {
  console.error("Usage: npx tsx scripts/measure-client-page.ts <clientId>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const ms = Math.round(performance.now() - start);
  console.log(`  ${ms.toString().padStart(5)} ms  ${label}`);
  return result;
}

async function main() {
  console.log("\n=== Mesure page client ===\n");
  console.log("Client ID:", clientId);
  console.log("");

  // Vague 1
  console.log("--- Vague 1 (parallèle) ---");
  const [client, projects, globalDocs, clients, prospects, archived] =
    await Promise.all([
      measure("getClient", () =>
        supabase
          .from("clients")
          .select("*, contacts(*)")
          .eq("id", clientId)
          .single()
      ),
      measure("getClientProjects", () =>
        supabase
          .from("projects")
          .select("*")
          .eq("client_id", clientId)
          .order("created_at", { ascending: true })
      ),
      measure("getClientDocs", () =>
        supabase
          .from("documents")
          .select("*")
          .eq("client_id", clientId)
          .is("project_id", null)
          .order("created_at", { ascending: true })
      ),
      measure("getClients(client)", () =>
        supabase
          .from("clients")
          .select("*, contacts(*)")
          .eq("category", "client")
          .order("created_at", { ascending: true })
      ),
      measure("getClients(prospect)", () =>
        supabase
          .from("clients")
          .select("*, contacts(*)")
          .eq("category", "prospect")
          .order("created_at", { ascending: true })
      ),
      measure("getClients(archived)", () =>
        supabase
          .from("clients")
          .select("*, contacts(*)")
          .eq("category", "archived")
          .order("created_at", { ascending: true })
      ),
    ]);

  const projectIds = (projects.data ?? []).map((p: { id: string }) => p.id);

  // Vague 2 — N requêtes
  console.log("\n--- Vague 2 (budget products) ---");
  const budgetStart = performance.now();
  const budgetResults = await Promise.all(
    projectIds.map((pid, i) =>
      measure(`getBudgetProducts(project ${i + 1})`, () =>
        supabase
          .from("budget_products")
          .select("*")
          .eq("project_id", pid)
          .order("created_at", { ascending: true })
      )
    )
  );
  const budgetTotal = Math.round(performance.now() - budgetStart);
  console.log(`  ${budgetTotal.toString().padStart(5)} ms  TOTAL vague 2 (${projectIds.length} requêtes)`);

  // Alternative : 1 seule requête
  console.log("\n--- Alternative : 1 requête pour tous les budget products ---");
  const altStart = performance.now();
  if (projectIds.length > 0) {
    await supabase
      .from("budget_products")
      .select("*")
      .in("project_id", projectIds)
      .order("created_at", { ascending: true });
  }
  const altMs = Math.round(performance.now() - altStart);
  console.log(`  ${altMs.toString().padStart(5)} ms  getBudgetProductsForProjects (1 requête)`);

  console.log("\n=== Résumé ===");
  console.log(`Projets: ${projectIds.length}`);
  console.log(`Requêtes actuelles: 6 + ${projectIds.length} = ${6 + projectIds.length}`);
  console.log(`Requêtes optimisées: 5 + 1 = 6 (sidebar fusionnée + budget en 1)`);
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
