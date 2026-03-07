"use client";

import { useEffect } from "react";
import { DOC_TYPE_LABEL, DOC_TYPE_COLOR, type Document } from "@/lib/mock";
import { PLATFORM_CONTENT, BRIEF_CONTENT, type PlatformDoc, type BriefDoc } from "@/lib/doc-content";

// ─── Component ───────────────────────────────────────────────
export function DocumentViewer({
  doc,
  onClose,
}: {
  doc: Document | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!doc) return null;

  const typeLabel = DOC_TYPE_LABEL[doc.type];
  const typeColor = DOC_TYPE_COLOR[doc.type];

  const platformContent = doc.type === "platform" ? PLATFORM_CONTENT[doc.id] : null;
  const briefContent = doc.type === "brief" ? BRIEF_CONTENT[doc.id] : null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />

      <div className="fixed top-0 right-0 bottom-0 z-50 w-[70vw] min-w-[320px] flex flex-col bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <p className={`text-[11px] font-semibold uppercase tracking-widest mb-1 ${typeColor}`}>
              {typeLabel}
            </p>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">{doc.name}</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-0.5">
              Mis à jour le {doc.updatedAt} · {doc.size}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <button className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
              ↓ Exporter
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {platformContent ? (
            <PlatformContent content={platformContent} />
          ) : briefContent ? (
            <BriefContent content={briefContent} />
          ) : (
            <GenericDocContent doc={doc} />
          )}
        </div>
      </div>
    </>
  );
}

// ─── Platform content ─────────────────────────────────────────
function PlatformContent({ content }: { content: PlatformDoc }) {
  return (
    <div className="space-y-8">
      <Section title="Raison d'être">
        <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-700 pl-4 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed italic">
          {content.raison}
        </blockquote>
      </Section>

      <Section title="Essence de marque">
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight mb-2">
            {content.essence}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
            {content.essenceDesc}
          </p>
        </div>
      </Section>

      <Section title="Valeurs">
        <div className="space-y-3">
          {content.valeurs.map((v, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-600 mt-0.5 shrink-0 w-4">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{v.titre}</p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{v.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Manifeste">
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-loose whitespace-pre-line">{content.manifeste}</p>
        </div>
      </Section>

      <Section title="Ton & voix">
        <div className="grid grid-cols-3 gap-3">
          {content.ton.map((t, i) => (
            <div key={i} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">{t.registre}</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Persona principal">
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0 text-lg">
              👤
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{content.persona.nom}</p>
              <p className="text-xs text-zinc-500">{content.persona.age}</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-3 leading-relaxed">{content.persona.profil}</p>
              <div className="mt-3 p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-1">Ce qu&apos;il attend</p>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{content.persona.attente}</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

// ─── Brief content ────────────────────────────────────────────
function BriefContent({ content }: { content: BriefDoc }) {
  return (
    <div className="space-y-8">
      <Section title="Contexte">
        <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">{content.contexte}</p>
      </Section>

      <Section title="Enjeux identifiés">
        <ul className="space-y-2">
          {content.enjeux.map((e, i) => (
            <li key={i} className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="text-zinc-500 dark:text-zinc-700 shrink-0 mt-0.5">→</span>
              {e}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Angle stratégique retenu">
        <div className="p-5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">{content.angle}</p>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{content.angleDesc}</p>
        </div>
      </Section>

      <Section title="Angles écartés">
        <div className="space-y-3">
          {content.ecart.map((e, i) => (
            <div key={i} className="flex gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 dark:text-zinc-700 shrink-0 mt-0.5 text-sm">✗</span>
              <div>
                <p className="text-xs font-semibold text-zinc-500 line-through">{e.angle}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 leading-relaxed">{e.raison}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ─── Generic doc ──────────────────────────────────────────────
function GenericDocContent({ doc }: { doc: Document }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-20">
      <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 text-2xl">
        📄
      </div>
      <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{doc.name}</p>
      <p className="text-xs text-zinc-500 dark:text-zinc-600 mt-1 mb-6">
        {doc.size} · {doc.updatedAt}
      </p>
      <button className="px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-sm text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white transition-colors">
        ↓ Ouvrir le fichier
      </button>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 dark:text-zinc-600 mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}
