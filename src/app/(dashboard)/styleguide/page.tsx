"use client";

/* ═══════════════════════════════════════════════════════════════
   STYLEGUIDE — Claude Frontend Design Plugin — 11 Aesthetics
   Each section is a self-contained showcase of one style.
   ═══════════════════════════════════════════════════════════════ */

export default function StyleguidePage() {
  return (
    <main
      className="min-h-screen bg-zinc-100 dark:bg-zinc-950"
      style={{ paddingLeft: "var(--sidebar-w)", paddingTop: "var(--nav-h)" }}
    >
      <div className="max-w-6xl mx-auto px-6 py-12 space-y-20">
        {/* ─── HEADER ──────────────────────────────────────── */}
        <header className="text-center space-y-4">
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Claude Frontend Design
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Les 11 directions esthétiques du plugin frontend-design.
            Chaque bloc est un mini-composant autonome dans le style correspondant.
          </p>
        </header>

        {/* ═══ 1. BRUTALIST / RAW ══════════════════════════════ */}
        <StyleSection num={1} title="Brutalist / Raw" desc="Structural honesty. Unpolished. Monospaced. Harsh borders. No decoration.">
          <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-0">
            <div className="border-b-4 border-black dark:border-white p-4 flex justify-between items-center">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-black dark:text-white">BRUT.SYSTEM</span>
              <span className="font-mono text-xs text-black dark:text-white">[2026]</span>
            </div>
            <div className="grid grid-cols-3">
              <div className="border-r-4 border-b-4 border-black dark:border-white p-6">
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">001</span>
                <p className="font-mono text-3xl font-black mt-2 text-black dark:text-white leading-none">FORM<br/>FOLLOWS<br/>FUNCTION</p>
              </div>
              <div className="col-span-2 border-b-4 border-black dark:border-white p-6 bg-black dark:bg-white">
                <p className="font-mono text-sm text-white dark:text-black leading-relaxed">
                  Raw aesthetics. No border-radius.<br/>
                  No shadows. No gradients.<br/>
                  Just structure and content.
                </p>
                <button className="mt-4 px-6 py-2 border-2 border-white dark:border-black text-white dark:text-black font-mono text-xs uppercase tracking-widest hover:bg-white hover:text-black dark:hover:bg-black dark:hover:text-white transition-colors">
                  Execute →
                </button>
              </div>
              <div className="col-span-3 p-4 flex gap-4">
                {["ABOUT", "WORK", "CONTACT"].map((l) => (
                  <span key={l} className="font-mono text-xs uppercase tracking-[0.2em] text-black dark:text-white border-b-2 border-black dark:border-white pb-1 cursor-pointer hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black px-2 transition-colors">{l}</span>
                ))}
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 2. GLASSMORPHISM ═════════════════════════════════ */}
        <StyleSection num={2} title="Glassmorphism" desc="Frosted glass. Backdrop blur. Transparency. Soft borders. Depth through layers.">
          <div className="relative rounded-3xl overflow-hidden p-8 min-h-[320px]"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)" }}>
            {/* Floating blobs */}
            <div className="absolute top-8 right-12 w-40 h-40 rounded-full opacity-60" style={{ background: "#f093fb", filter: "blur(40px)" }} />
            <div className="absolute bottom-8 left-16 w-32 h-32 rounded-full opacity-50" style={{ background: "#667eea", filter: "blur(30px)" }} />

            {/* Glass card */}
            <div className="relative rounded-2xl p-6 space-y-4 max-w-sm"
              style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.25)", boxShadow: "0 8px 32px rgba(0,0,0,0.1)" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "rgba(255,255,255,0.25)" }}>
                  <span className="text-white">✦</span>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Glass Component</p>
                  <p className="text-white/60 text-xs">Frosted interface</p>
                </div>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                Backdrop blur + semi-transparent backgrounds. Best on vibrant gradients with floating shapes.
              </p>
              <div className="flex gap-2">
                <button className="px-4 py-2 rounded-xl text-xs font-medium text-white" style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                  Action
                </button>
                <button className="px-4 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white transition-colors">
                  Learn more
                </button>
              </div>
            </div>

            {/* Second mini glass */}
            <div className="absolute bottom-8 right-8 rounded-xl p-4 hidden md:block"
              style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.2)" }}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white/80 text-xs font-medium">En ligne</span>
              </div>
              <p className="text-white text-2xl font-bold mt-1">3,842</p>
              <p className="text-white/50 text-[10px]">utilisateurs actifs</p>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 3. NEUMORPHISM ══════════════════════════════════ */}
        <StyleSection num={3} title="Neumorphism" desc="Soft UI. Extruded surfaces. Inner & outer shadows. Monochromatic. Tactile feel.">
          <div className="rounded-3xl p-8" style={{ background: "#e0e5ec" }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card neumorphic */}
              <div className="rounded-2xl p-6 space-y-4" style={{ background: "#e0e5ec", boxShadow: "8px 8px 16px #b8bec7, -8px -8px 16px #ffffff" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "#e0e5ec", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}>
                  <span className="text-lg" style={{ color: "#6b7280" }}>☀</span>
                </div>
                <h4 className="font-semibold" style={{ color: "#374151" }}>Soft Surface</h4>
                <p className="text-sm" style={{ color: "#6b7280" }}>Raised from the background with dual shadows.</p>
              </div>

              {/* Input neumorphic */}
              <div className="rounded-2xl p-6 flex flex-col justify-center gap-4" style={{ background: "#e0e5ec", boxShadow: "8px 8px 16px #b8bec7, -8px -8px 16px #ffffff" }}>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full px-4 py-3 rounded-xl border-none outline-none text-sm"
                  style={{ background: "#e0e5ec", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff", color: "#374151" }}
                />
                <div className="flex gap-3 justify-center">
                  {["sm", "md", "lg"].map((s) => (
                    <button key={s} className="w-10 h-10 rounded-xl text-xs font-bold flex items-center justify-center" style={{ background: "#e0e5ec", boxShadow: "4px 4px 8px #b8bec7, -4px -4px 8px #ffffff", color: "#6b7280" }}>
                      {s.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle neumorphic */}
              <div className="rounded-2xl p-6 flex flex-col items-center justify-center gap-4" style={{ background: "#e0e5ec", boxShadow: "8px 8px 16px #b8bec7, -8px -8px 16px #ffffff" }}>
                <div className="w-16 h-8 rounded-full relative" style={{ background: "#e0e5ec", boxShadow: "inset 4px 4px 8px #b8bec7, inset -4px -4px 8px #ffffff" }}>
                  <div className="absolute top-1 left-1 w-6 h-6 rounded-full" style={{ background: "#e0e5ec", boxShadow: "2px 2px 4px #b8bec7, -2px -2px 4px #ffffff" }} />
                </div>
                <p className="text-xs font-medium" style={{ color: "#6b7280" }}>Tactile toggle</p>
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 4. CLAYMORPHISM ═════════════════════════════════ */}
        <StyleSection num={4} title="Claymorphism" desc="Inflated 3D. Rounded. Pastel colors. Inner highlights. Playful depth.">
          <div className="rounded-3xl p-8 bg-orange-50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { bg: "#a78bfa", label: "Créer", icon: "+" },
                { bg: "#f472b6", label: "Modifier", icon: "✎" },
                { bg: "#34d399", label: "Valider", icon: "✓" },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl p-6 text-center cursor-pointer transition-transform hover:scale-105" style={{
                  background: item.bg,
                  boxShadow: `0 12px 24px ${item.bg}60, inset 0 -4px 8px rgba(0,0,0,0.1), inset 0 4px 8px rgba(255,255,255,0.4)`,
                  border: "1px solid rgba(255,255,255,0.3)",
                }}>
                  <div className="text-4xl mb-3 text-white drop-shadow-md">{item.icon}</div>
                  <p className="text-white font-bold text-lg drop-shadow-sm">{item.label}</p>
                  <p className="text-white/70 text-xs mt-1">Clay button</p>
                </div>
              ))}
            </div>
          </div>
        </StyleSection>

        {/* ═══ 5. RETRO-FUTURISM / CYBERPUNK ═══════════════════ */}
        <StyleSection num={5} title="Retro-Futurism / Cyberpunk" desc="Neon glows. Dark backgrounds. Scan lines. Monospaced terminals. Electric accents.">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#0a0a1a" }}>
            {/* Scanline overlay */}
            <div className="relative p-8" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,200,0.03) 2px, rgba(0,255,200,0.03) 4px)" }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-3 h-3 rounded-full animate-pulse" style={{ background: "#00ffc8", boxShadow: "0 0 12px #00ffc8" }} />
                <span className="font-mono text-xs uppercase tracking-[0.3em]" style={{ color: "#00ffc8" }}>SYSTEM.ONLINE</span>
                <span className="font-mono text-xs ml-auto" style={{ color: "#00ffc840" }}>v2.0.26</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-lg p-6" style={{ border: "1px solid #00ffc830", background: "rgba(0,255,200,0.03)" }}>
                  <p className="font-mono text-2xl font-bold" style={{ color: "#00ffc8", textShadow: "0 0 20px #00ffc860" }}>
                    NEON GRID
                  </p>
                  <p className="font-mono text-xs mt-2" style={{ color: "#00ffc880" }}>
                    // Electric glow on dark void<br/>
                    // Monospaced everything<br/>
                    // Terminal aesthetics
                  </p>
                  <div className="mt-4 flex gap-2">
                    <button className="px-4 py-2 rounded font-mono text-xs uppercase tracking-wider transition-all" style={{
                      background: "#00ffc8", color: "#0a0a1a", boxShadow: "0 0 20px #00ffc840",
                    }}>
                      INITIATE
                    </button>
                    <button className="px-4 py-2 rounded font-mono text-xs uppercase tracking-wider" style={{
                      border: "1px solid #00ffc850", color: "#00ffc8",
                    }}>
                      SCAN
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "NEURAL_LOAD", value: 87 },
                    { label: "DATA_STREAM", value: 64 },
                    { label: "SYS_MEMORY", value: 42 },
                  ].map((bar) => (
                    <div key={bar.label}>
                      <div className="flex justify-between font-mono text-[10px] mb-1" style={{ color: "#00ffc880" }}>
                        <span>{bar.label}</span>
                        <span>{bar.value}%</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#00ffc810" }}>
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${bar.value}%`, background: "#00ffc8",
                          boxShadow: "0 0 8px #00ffc860",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 6. ART DECO / GEOMETRIC ═════════════════════════ */}
        <StyleSection num={6} title="Art Deco / Geometric" desc="Gold accents. Symmetry. Ornamental lines. Serif fonts. Gatsby-era elegance.">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#1a1a2e" }}>
            <div className="p-8 text-center">
              {/* Ornamental line */}
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(90deg, transparent, #d4af37)" }} />
                <span style={{ color: "#d4af37" }}>◆</span>
                <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(90deg, #d4af37, transparent)" }} />
              </div>

              <h3 className="text-4xl font-serif font-bold tracking-wider" style={{ color: "#d4af37" }}>
                ÉLÉGANCE
              </h3>
              <p className="text-sm tracking-[0.4em] uppercase mt-2" style={{ color: "#d4af3780" }}>
                Géométrie & Raffinement
              </p>

              {/* Ornamental line */}
              <div className="flex items-center justify-center gap-4 my-6">
                <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(90deg, transparent, #d4af37)" }} />
                <span style={{ color: "#d4af37" }}>◆</span>
                <div className="h-px flex-1 max-w-[100px]" style={{ background: "linear-gradient(90deg, #d4af37, transparent)" }} />
              </div>

              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                {["I", "II", "III"].map((n) => (
                  <div key={n} className="py-4 text-center" style={{ border: "1px solid #d4af3740" }}>
                    <p className="font-serif text-2xl font-bold" style={{ color: "#d4af37" }}>{n}</p>
                    <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "#d4af3760" }}>Section</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 7. SOFT / PASTEL ════════════════════════════════ */}
        <StyleSection num={7} title="Soft / Pastel" desc="Gentle palette. Rounded forms. Calm. Light gradients. Airy whitespace.">
          <div className="rounded-3xl p-8" style={{ background: "linear-gradient(135deg, #fef3f2, #fdf2f8, #f0f9ff, #f0fdf4)" }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { bg: "#fecdd3", text: "#be123c", label: "Rose", emoji: "🌸" },
                { bg: "#c7d2fe", text: "#4338ca", label: "Lavande", emoji: "💜" },
                { bg: "#a7f3d0", text: "#065f46", label: "Menthe", emoji: "🍃" },
                { bg: "#fde68a", text: "#92400e", label: "Soleil", emoji: "☀️" },
              ].map((card) => (
                <div key={card.label} className="rounded-2xl p-5 text-center transition-transform hover:scale-105 cursor-pointer" style={{ background: card.bg + "60", border: `1px solid ${card.bg}` }}>
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <p className="font-semibold text-sm" style={{ color: card.text }}>{card.label}</p>
                  <p className="text-xs mt-1" style={{ color: card.text + "90" }}>Soft touch</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl p-5 flex items-center gap-4" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.05)" }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "#c7d2fe" }}>
                <span className="text-sm" style={{ color: "#4338ca" }}>♪</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: "#374151" }}>Ambiance calme</p>
                <div className="h-1.5 rounded-full mt-2" style={{ background: "#e5e7eb" }}>
                  <div className="h-full rounded-full" style={{ width: "60%", background: "linear-gradient(90deg, #c7d2fe, #fecdd3)" }} />
                </div>
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 8. MAXIMALIST / VIBRANT BLOCK ═══════════════════ */}
        <StyleSection num={8} title="Maximalist / Vibrant Block" desc="Bold colors. Oversized type. Dense layouts. Clashing combinations. Unapologetic.">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#ff6b35" }}>
            <div className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="col-span-2 rounded-xl p-6" style={{ background: "#004e98" }}>
                  <p className="text-6xl font-black leading-none text-white">BIG.</p>
                  <p className="text-6xl font-black leading-none" style={{ color: "#ffd23f" }}>BOLD.</p>
                </div>
                <div className="rounded-xl p-4 flex items-center justify-center" style={{ background: "#ffd23f" }}>
                  <p className="text-4xl font-black" style={{ color: "#ff6b35" }}>!!!</p>
                </div>
                <div className="rounded-xl p-4 flex items-center justify-center" style={{ background: "#1a1a2e" }}>
                  <p className="text-sm font-bold uppercase tracking-widest text-white">More is more</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#3a86ff" }}>
                  <p className="text-white font-black text-xs uppercase">Density</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#8338ec" }}>
                  <p className="text-white font-black text-xs uppercase">Tension</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#ff006e" }}>
                  <p className="text-white font-black text-xs uppercase">Energy</p>
                </div>
                <div className="rounded-xl p-4" style={{ background: "#06d6a0" }}>
                  <p className="font-black text-xs uppercase" style={{ color: "#1a1a2e" }}>Impact</p>
                </div>
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 9. DARK OLED LUXURY ═════════════════════════════ */}
        <StyleSection num={9} title="Dark OLED Luxury" desc="Pure black. Thin lines. Subtle gradients. Premium feel. Restrained typography.">
          <div className="rounded-2xl overflow-hidden" style={{ background: "#000000" }}>
            <div className="p-8 space-y-6">
              <div className="flex items-center justify-between" style={{ borderBottom: "1px solid #ffffff10", paddingBottom: "16px" }}>
                <span className="text-xs font-light tracking-[0.5em] uppercase" style={{ color: "#ffffff40" }}>Collection</span>
                <span className="text-xs" style={{ color: "#ffffff20" }}>—</span>
              </div>

              <h3 className="text-3xl font-extralight tracking-wider" style={{ color: "#ffffff", letterSpacing: "0.1em" }}>
                Understated
              </h3>
              <p className="text-sm font-light leading-relaxed max-w-md" style={{ color: "#ffffff50" }}>
                True black backgrounds. Whisper-thin borders. Typography does all the work.
                Every pixel is intentional.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-4">
                {[
                  { label: "Revenus", val: "€124K" },
                  { label: "Projets", val: "18" },
                  { label: "Croissance", val: "+23%" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center py-4" style={{ border: "1px solid #ffffff08" }}>
                    <p className="text-2xl font-light" style={{ color: "#ffffff" }}>{stat.val}</p>
                    <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: "#ffffff30" }}>{stat.label}</p>
                  </div>
                ))}
              </div>

              <button className="px-6 py-3 text-xs uppercase tracking-[0.3em] font-light transition-colors" style={{
                border: "1px solid #ffffff20", color: "#ffffff60",
              }}>
                Découvrir
              </button>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 10. ORGANIC / BIOMORPHIC ════════════════════════ */}
        <StyleSection num={10} title="Organic / Biomorphic" desc="Nature-inspired. Flowing shapes. Earth tones. Blob forms. Asymmetric balance.">
          <div className="rounded-[32px] p-8 relative overflow-hidden" style={{ background: "#f5f0e8" }}>
            {/* Organic blobs */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20" style={{ background: "#8fbc8f", filter: "blur(40px)" }} />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full opacity-20" style={{ background: "#deb887", filter: "blur(30px)" }} />

            <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-3xl font-light" style={{ color: "#5c4033", fontStyle: "italic" }}>
                  Living forms
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#8b7355" }}>
                  Shapes that breathe. Edges that flow. Colors from earth, clay, moss, and sky.
                  Asymmetry that feels balanced.
                </p>
                <div className="flex gap-3">
                  {["#8fbc8f", "#deb887", "#b8860b", "#cd853f"].map((c) => (
                    <div key={c} className="w-8 h-8" style={{ background: c, borderRadius: "30% 70% 70% 30% / 30% 30% 70% 70%" }} />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                {[60, 80, 50].map((h, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div style={{
                      width: "48px", height: `${h}px`,
                      background: ["#8fbc8f", "#deb887", "#cd853f"][i],
                      borderRadius: "40% 60% 50% 50% / 60% 40% 60% 40%",
                    }} />
                    <span className="text-[10px]" style={{ color: "#8b7355" }}>{["Moss", "Sand", "Clay"][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 11. EDITORIAL / MAGAZINE ═════════════════════════ */}
        <StyleSection num={11} title="Editorial / Magazine" desc="Strong typographic hierarchy. Grid precision. High contrast. Content-first. Serif + sans pairing.">
          <div className="rounded-2xl overflow-hidden bg-white">
            <div className="grid grid-cols-3">
              <div className="col-span-2 p-8 space-y-4" style={{ borderRight: "1px solid #e5e5e5" }}>
                <p className="text-[10px] uppercase tracking-[0.4em] font-semibold" style={{ color: "#dc2626" }}>
                  Tendance 2026
                </p>
                <h3 className="text-4xl font-serif font-bold leading-tight" style={{ color: "#0a0a0a" }}>
                  Le design qui<br/>raconte une histoire
                </h3>
                <p className="text-sm leading-relaxed max-w-md" style={{ color: "#6b7280" }}>
                  Editorial layouts prioritize content hierarchy. Every element serves the narrative.
                  White space is deliberate, not accidental.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold">Y</div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: "#0a0a0a" }}>Agence Yam</p>
                    <p className="text-[10px]" style={{ color: "#9ca3af" }}>5 min de lecture</p>
                  </div>
                </div>
              </div>

              <div className="p-6 flex flex-col justify-between" style={{ background: "#fafafa" }}>
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "#9ca3af" }}>Sommaire</p>
                  {["Introduction", "Typographie", "Mise en page", "Conclusion"].map((item, i) => (
                    <p key={item} className="text-xs py-2 flex items-center gap-2" style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}>
                      <span className="font-mono text-[10px]" style={{ color: "#9ca3af" }}>0{i + 1}</span>
                      {item}
                    </p>
                  ))}
                </div>
                <p className="text-[10px] font-mono" style={{ color: "#d1d5db" }}>Page 1 / 4</p>
              </div>
            </div>
          </div>
        </StyleSection>

        {/* ═══ 12. AURORA MESH GRADIENT ══════════════════════════ */}
        <StyleSection num={12} title="Aurora / Mesh Gradient" desc="Flowing color transitions. Animated gradients. Ethereal atmosphere. Modern & premium.">
          <div className="rounded-3xl overflow-hidden relative min-h-[280px] flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)",
            }}>
            {/* Mesh gradient blobs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full opacity-40" style={{ background: "#7c3aed", filter: "blur(80px)" }} />
              <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-30" style={{ background: "#06b6d4", filter: "blur(70px)" }} />
              <div className="absolute top-1/3 right-1/3 w-48 h-48 rounded-full opacity-30" style={{ background: "#ec4899", filter: "blur(60px)" }} />
            </div>

            <div className="relative text-center space-y-4 px-8">
              <p className="text-xs uppercase tracking-[0.5em] font-light" style={{ color: "rgba(255,255,255,0.4)" }}>Aurora System</p>
              <h3 className="text-4xl font-bold text-white" style={{ textShadow: "0 0 40px rgba(124,58,237,0.3)" }}>
                Mesh Gradients
              </h3>
              <p className="text-sm max-w-sm mx-auto" style={{ color: "rgba(255,255,255,0.5)" }}>
                Multiple gradient blobs with blur create an ethereal, premium atmosphere.
              </p>
              <button className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all" style={{
                background: "linear-gradient(135deg, #7c3aed, #ec4899)",
                boxShadow: "0 0 30px rgba(124,58,237,0.3)",
              }}>
                Explorer
              </button>
            </div>
          </div>
        </StyleSection>

        {/* ─── FOOTER ──────────────────────────────────────── */}
        <footer className="pt-8 border-t border-zinc-200 dark:border-zinc-800 text-center">
          <p className="text-xs text-zinc-400 dark:text-zinc-500">
            12 directions esthétiques du Claude Frontend Design Plugin
          </p>
        </footer>
      </div>
    </main>
  );
}

/* ─── Section wrapper ──────────────────────────────────────── */
function StyleSection({ num, title, desc, children }: { num: number; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-mono text-zinc-400 dark:text-zinc-500">
          {String(num).padStart(2, "0")}
        </span>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h2>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">{desc}</p>
      {children}
    </section>
  );
}
