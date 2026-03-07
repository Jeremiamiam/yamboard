function extractTldr(outputJson: Record<string, unknown>): string {
  const keys = ["summary", "titre", "title", "big_idea", "positionnement"] as const
  for (const key of keys) {
    const val = outputJson[key]
    if (typeof val === "string" && val.trim()) return val
  }
  // Fall back to first string value of the first key
  const firstKey = Object.keys(outputJson)[0]
  if (firstKey !== undefined) {
    const val = outputJson[firstKey]
    if (typeof val === "string" && val.trim()) return val
  }
  return "—"
}

interface WikiSectionProps {
  id: string
  slug: string
  label: string
  outputJson: Record<string, unknown>
  createdAt: string
}

export function WikiSection({ id, label, outputJson, createdAt }: WikiSectionProps) {
  const tldr = extractTldr(outputJson)
  const formattedDate = new Date(createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return (
    <section id={id} className="mb-12 scroll-mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        {label}
      </h2>
      <p className="text-xs text-gray-400 mb-4">{formattedDate}</p>

      <div className="bg-blue-50 border-l-4 border-blue-400 px-4 py-3 rounded-r-lg mb-6">
        <p className="text-sm font-medium text-blue-800 mb-1">TL;DR</p>
        <p className="text-sm text-blue-900 leading-relaxed">{tldr}</p>
      </div>

      <dl>
        {Object.entries(outputJson).map(([key, value]) => (
          <div key={key} className="mb-4">
            <dt className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {key.replace(/_/g, " ")}
            </dt>
            <dd className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {typeof value === "string" ? value : JSON.stringify(value, null, 2)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
