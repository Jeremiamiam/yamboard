"use client";

import { useState } from "react";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/Button";
import { InputField, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { IconBox } from "@/components/ui/IconBox";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Progress } from "@/components/ui/Progress";
import { Dialog, Drawer } from "@/components/ui/Dialog";

/* ═══════════════════════════════════════════════════════════════
   STYLEGUIDE — Design System Primitives
   Living showcase of all UI components.
   Change the primitives → change the entire app.
   ═══════════════════════════════════════════════════════════════ */

export default function StyleguidePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogSize, setDialogSize] = useState<"sm" | "md" | "lg">("md");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSize, setDrawerSize] = useState<"sm" | "md" | "lg">("md");

  return (
    <main
      className="min-h-screen bg-zinc-100 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        {/* ─── HEADER ──────────────────────────────────────── */}
        <header className="space-y-3">
          <SectionHeader level="h1" className="text-3xl">
            Design System
          </SectionHeader>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xl">
            Primitifs UI de Yamboard. Chaque composant ici pilote toute l&apos;app.
            Modifier un primitif = modifier partout.
          </p>
        </header>

        {/* ═══ SURFACES ══════════════════════════════════════ */}
        <Section title="Surface" desc="Conteneurs universels — cards, panels, zones.">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Surface variant="card" padding="md" className="space-y-2">
              <SectionHeader level="label">card</SectionHeader>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Surface principale. Fond blanc, bordure, coins arrondis.
              </p>
            </Surface>

            <Surface variant="interactive" padding="md" className="space-y-2">
              <SectionHeader level="label">interactive</SectionHeader>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Comme card + hover sur la bordure. Pour les items cliquables.
              </p>
            </Surface>

            <Surface variant="muted" padding="md" className="space-y-2">
              <SectionHeader level="label">muted</SectionHeader>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Fond attenué. Pour les sections secondaires ou imbriquées.
              </p>
            </Surface>

            <Surface variant="dashed" padding="md" className="space-y-2">
              <SectionHeader level="label">dashed</SectionHeader>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Bordure pointillée. Empty states, drop zones, invitations.
              </p>
            </Surface>

            <Surface variant="alert" padding="md" className="space-y-2">
              <SectionHeader level="label">alert</SectionHeader>
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Attention. Warnings et alertes non-bloquantes.
              </p>
            </Surface>

            <Surface variant="overlay" padding="md" className="rounded-xl space-y-2">
              <SectionHeader level="label">overlay</SectionHeader>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Panels flottants — drawers, modals, popovers.
              </p>
            </Surface>
          </div>
        </Section>

        {/* ═══ BUTTONS ═══════════════════════════════════════ */}
        <Section title="Button" desc="Tous les boutons de l'app. 5 variantes x 4 tailles + icon buttons.">
          {/* Variants */}
          <div className="space-y-4">
            <SectionHeader level="sublabel">Variantes</SectionHeader>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="dashed">Dashed</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-4 mt-8">
            <SectionHeader level="sublabel">Tailles</SectionHeader>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="xs">Extra small</Button>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* Icon buttons */}
          <div className="space-y-4 mt-8">
            <SectionHeader level="sublabel">Icon buttons</SectionHeader>
            <div className="flex flex-wrap gap-3 items-center">
              <Button variant="secondary" size="icon_sm">+</Button>
              <Button variant="secondary" size="icon_md">+</Button>
              <Button variant="ghost" size="icon_md">x</Button>
              <Button variant="danger" size="icon_md">-</Button>
              <Button variant="secondary" size="icon_lg">+</Button>
            </div>
          </div>

          {/* Colored override */}
          <div className="space-y-4 mt-8">
            <SectionHeader level="sublabel">Couleur client (override via className/style)</SectionHeader>
            <div className="flex flex-wrap gap-3 items-center">
              <Button className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-600 dark:text-white">Client A</Button>
              <Button className="bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-500 dark:hover:bg-emerald-600 dark:text-white">Client B</Button>
              <Button style={{ background: "#e67e22" }} className="hover:opacity-90 dark:text-white">Client C</Button>
            </div>
          </div>
        </Section>

        {/* ═══ INPUTS ════════════════════════════════════════ */}
        <Section title="Input & Textarea" desc="Champs de formulaire. 3 variantes, 3 tailles.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <SectionHeader level="sublabel">Default</SectionHeader>
              <InputField placeholder="Nom du client..." />
              <InputField inputSize="sm" placeholder="Small input" />
              <InputField inputSize="lg" placeholder="Large input" />
            </div>
            <div className="space-y-3">
              <SectionHeader level="sublabel">Inline (underline)</SectionHeader>
              <InputField variant="inline" placeholder="Valeur inline..." />
              <SectionHeader level="sublabel" className="mt-4">Ghost</SectionHeader>
              <InputField variant="ghost" placeholder="Ghost until focus..." />
            </div>
          </div>
          <div className="mt-6 space-y-3">
            <SectionHeader level="sublabel">Textarea</SectionHeader>
            <Textarea placeholder="Notes, description, commentaires..." rows={3} />
          </div>
        </Section>

        {/* ═══ BADGES ════════════════════════════════════════ */}
        <Section title="Badge" desc="Status, labels, tags. Avec ou sans dot indicator.">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <Badge>Default</Badge>
              <Badge variant="success">Payé</Badge>
              <Badge variant="warning">En attente</Badge>
              <Badge variant="danger">Erreur</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="subtle">Subtle</Badge>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge dot>Default</Badge>
              <Badge variant="success" dot>En ligne</Badge>
              <Badge variant="warning" dot>Pending</Badge>
              <Badge variant="danger" dot>Offline</Badge>
              <Badge variant="info" dot>Syncing</Badge>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Badge size="xs">XS</Badge>
              <Badge size="sm">SM</Badge>
              <Badge size="md">MD</Badge>
            </div>
          </div>
        </Section>

        {/* ═══ ICONBOX ═══════════════════════════════════════ */}
        <Section title="IconBox" desc="Conteneurs d'icônes et emojis. 5 tailles, 4 variantes.">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="text-center space-y-2">
                <IconBox size="xs">A</IconBox>
                <p className="text-[10px] text-zinc-400">xs</p>
              </div>
              <div className="text-center space-y-2">
                <IconBox size="sm">B</IconBox>
                <p className="text-[10px] text-zinc-400">sm</p>
              </div>
              <div className="text-center space-y-2">
                <IconBox size="md">C</IconBox>
                <p className="text-[10px] text-zinc-400">md</p>
              </div>
              <div className="text-center space-y-2">
                <IconBox size="lg">D</IconBox>
                <p className="text-[10px] text-zinc-400">lg</p>
              </div>
              <div className="text-center space-y-2">
                <IconBox size="xl">E</IconBox>
                <p className="text-[10px] text-zinc-400">xl</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-center">
              <IconBox variant="default" size="lg">*</IconBox>
              <IconBox variant="surface" size="lg">*</IconBox>
              <IconBox variant="tinted" size="lg" style={{ background: "#a78bfa30", color: "#7c3aed" }}>*</IconBox>
              <IconBox variant="ghost" size="lg" className="text-zinc-400">*</IconBox>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION HEADERS ═══════════════════════════════ */}
        <Section title="SectionHeader" desc="Hiérarchie typographique. 5 niveaux sémantiques.">
          <div className="space-y-4">
            <SectionHeader level="h1">H1 — Titre de page</SectionHeader>
            <SectionHeader level="h2">H2 — Titre de section</SectionHeader>
            <SectionHeader level="h3">H3 — Sous-section</SectionHeader>
            <SectionHeader level="label">LABEL — Catégorie uppercase</SectionHeader>
            <SectionHeader level="sublabel">SUBLABEL — Petit label</SectionHeader>
          </div>
        </Section>

        {/* ═══ PROGRESS ══════════════════════════════════════ */}
        <Section title="Progress" desc="Barres de progression. 3 tailles, couleur customisable.">
          <div className="space-y-6 max-w-md">
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Budget consommé</span>
                <span>72%</span>
              </div>
              <Progress value={72} size="sm" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Avancement mission</span>
                <span>45%</span>
              </div>
              <Progress value={45} size="md" color="#7c3aed" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-zinc-500">
                <span>Stockage</span>
                <span>89%</span>
              </div>
              <Progress value={89} size="lg" color="#ef4444" />
            </div>
          </div>
        </Section>

        {/* ═══ DIALOG & DRAWER ═════════════════════════════ */}
        <Section title="Dialog & Drawer" desc="Modales et panneaux latéraux. 3 tailles chacun.">
          <div className="space-y-6">
            <div className="space-y-4">
              <SectionHeader level="sublabel">Dialog (modal centré)</SectionHeader>
              <div className="flex flex-wrap gap-3">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <Button key={s} variant="secondary" size="sm" onClick={() => { setDialogSize(s); setDialogOpen(true); }}>
                    Dialog {s}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <SectionHeader level="sublabel">Drawer (panneau latéral)</SectionHeader>
              <div className="flex flex-wrap gap-3">
                {(["sm", "md", "lg"] as const).map((s) => (
                  <Button key={s} variant="secondary" size="sm" onClick={() => { setDrawerSize(s); setDrawerOpen(true); }}>
                    Drawer {s}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} size={dialogSize}>
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <SectionHeader level="h2" as="h2">Dialog — {dialogSize}</SectionHeader>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Escape ou clic hors zone pour fermer.</p>
            </div>
            <div className="p-6">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Contenu du dialog. Taille <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{dialogSize}</code>.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button variant="primary" size="sm" onClick={() => setDialogOpen(false)}>Confirmer</Button>
            </div>
          </Dialog>

          <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} size={drawerSize}>
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <SectionHeader level="h2" as="h2">Drawer — {drawerSize}</SectionHeader>
              <Button variant="ghost" size="icon_sm" onClick={() => setDrawerOpen(false)}>✕</Button>
            </div>
            <div className="flex-1 p-6 overflow-y-auto">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Panneau latéral. Taille <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{drawerSize}</code>.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800">
              <Button variant="primary" size="sm" className="w-full" onClick={() => setDrawerOpen(false)}>Fermer</Button>
            </div>
          </Drawer>
        </Section>

        {/* ═══ COMPOSITION ═══════════════════════════════════ */}
        <Section title="Composition" desc="Exemple de primitifs combinés — comme dans l'app réelle.">
          <Surface variant="card" padding="md" className="space-y-4 max-w-md">
            <div className="flex items-center gap-3">
              <IconBox variant="tinted" size="md" style={{ background: "#3b82f620", color: "#3b82f6" }}>M</IconBox>
              <div className="flex-1 min-w-0">
                <SectionHeader level="h3">Mission Refonte</SectionHeader>
                <p className="text-xs text-zinc-500 dark:text-zinc-500">Agence Yam &middot; Web design</p>
              </div>
              <Badge variant="success" size="sm" dot>Active</Badge>
            </div>
            <Progress value={65} color="#3b82f6" />
            <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-500">
              <span>Budget: 12 500 &euro;</span>
              <span>65% consommé</span>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="primary" className="flex-1">Voir détails</Button>
              <Button size="sm" variant="secondary">Modifier</Button>
            </div>
          </Surface>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mt-6 max-w-md">
            {[
              { label: "REVENUS", value: "€124K", color: "#10b981", pct: 72 },
              { label: "PROJETS", value: "18", color: "#6366f1", pct: 45 },
              { label: "CROISSANCE", value: "+23%", color: "#f59e0b", pct: 88 },
            ].map((s) => (
              <Surface key={s.label} variant="card" padding="md" className="text-center">
                <SectionHeader level="sublabel" className="mb-1">{s.label}</SectionHeader>
                <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums">{s.value}</p>
                <Progress value={s.pct} size="sm" color={s.color} className="mt-2" />
              </Surface>
            ))}
          </div>
        </Section>

        {/* ─── FOOTER ──────────────────────────────────────── */}
        <footer className="pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            Yamboard Design System — 9 primitifs, 1 source de vérité
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ─── Section wrapper ──────────────────────────────────────── */
function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div>
        <SectionHeader level="h2" className="text-xl">{title}</SectionHeader>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{desc}</p>
      </div>
      {children}
    </section>
  );
}
