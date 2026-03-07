"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"

function getRedirectUrl() {
  if (typeof window !== "undefined") return window.location.origin + "/reset-password"
  return process.env.NEXT_PUBLIC_SITE_URL || "https://get-brandon.netlify.app/reset-password"
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault()
    if (!email) {
      setError("Saisis ton email pour recevoir le lien de réinitialisation.")
      return
    }
    setError(null)
    setResetLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectUrl(),
    })
    setResetLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setResetSent(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("Email ou mot de passe incorrect.")
      setLoading(false)
      return
    }

    // router.refresh() is required: forces Server Components to re-render with new session
    // Without it, /dashboard renders as if unauthenticated (stale RSC cache)
    router.push("/dashboard")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-7 rounded-xl shadow-sm border border-gray-200">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
          <span>⚠</span>
          <span>{error}</span>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gray-900 text-white py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
      >
        {loading && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
        {loading ? "Connexion..." : "Se connecter"}
      </button>
      <div className="text-center pt-2">
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading || resetSent}
          className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
        >
          {resetSent ? "Email envoyé — vérifie ta boîte" : resetLoading ? "Envoi..." : "Mot de passe oublié ?"}
        </button>
      </div>
    </form>
  )
}
