"use client"
import { useEffect, useState } from "react"

export type WikiNavSection = { slug: string; label: string }

interface WikiNavProps {
  sections: WikiNavSection[]
}

export function WikiNav({ sections }: WikiNavProps) {
  const [activeSlug, setActiveSlug] = useState<string>(sections[0]?.slug ?? "")

  useEffect(() => {
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost intersecting entry
        const intersecting = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (intersecting.length > 0) {
          const id = intersecting[0].target.id // "wiki-{slug}"
          const slug = id.replace("wiki-", "")
          setActiveSlug(slug)
        }
      },
      {
        rootMargin: "-10% 0px -80% 0px", // fires when section enters top 10–20% of viewport
        threshold: 0,
      }
    )

    sections.forEach(({ slug }) => {
      const el = document.getElementById(`wiki-${slug}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sections])

  return (
    <nav className="sticky top-8 w-48 flex-shrink-0">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
        Sur cette page
      </p>
      <ul className="space-y-0.5">
        {sections.map(({ slug, label }) => (
          <li key={slug}>
            <a
              href={`#wiki-${slug}`}
              className={[
                "block py-1.5 px-3 rounded text-sm transition-colors",
                activeSlug === slug
                  ? "bg-blue-50 text-blue-700 font-medium"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              ].join(" ")}
            >
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
