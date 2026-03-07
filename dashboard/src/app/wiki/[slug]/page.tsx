import { getSupabase, DashboardClient, DashboardWiki } from "@/lib/supabase";
import { Header } from "@/components/Header";
import { notFound } from "next/navigation";

async function getWiki(slug: string) {
  const supabase = getSupabase();

  const { data: client } = await supabase
    .from("dashboard_clients")
    .select("name, slug")
    .eq("slug", slug)
    .single();

  if (!client) return null;

  const { data: wiki } = await supabase
    .from("dashboard_wikis")
    .select("html_content")
    .eq("client_slug", slug)
    .single();

  return {
    client: client as Pick<DashboardClient, "name" | "slug">,
    html: (wiki as Pick<DashboardWiki, "html_content"> | null)?.html_content ?? null,
  };
}

export default async function WikiPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getWiki(slug);

  if (!data || !data.html) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header type="wiki" clientName={data.client.name} />

      <main className="flex-1 min-h-0">
        <iframe
          srcDoc={data.html}
          title={`Wiki ${data.client.name}`}
          className="w-full h-[calc(100vh-65px)] border-0 bg-white"
          sandbox="allow-same-origin"
        />
      </main>
    </div>
  );
}
