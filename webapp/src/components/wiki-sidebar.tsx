export type WikiSidebarSection = { slug: string; label: string }

interface WikiSidebarProps {
  sections: WikiSidebarSection[]
}

export function WikiSidebar({ sections }: WikiSidebarProps) {
  return (
    <nav className="sticky top-8 w-48 flex-shrink-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Sur cette page
      </p>
      <ul className="space-y-0.5">
        {sections.map((section) => (
          <li key={section.slug}>
            <a
              href={`#wiki-${section.slug}`}
              data-slug={section.slug}
              className="block py-1.5 px-3 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors text-sm"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
