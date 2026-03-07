"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasRecoveryToken, setHasRecoveryToken] = useState<boolean | null>(null)

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : ""
    setHasRecoveryToken(hash.includes("type=recovery"))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword || newPassword.length < 6) {
      setError("Le mot de passe doit faire au moins 6 caractères.")
      return
    }
    setError(null)
    setLoading(true)
    const supabase = createClient()
    const { error: err } = await supabase.auth.updateUser({ password: newPassword })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    router.push("/dashboard")
    router.refresh()
  }

  if (hasRecoveryToken === null) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-500">Chargement…</div>
      </main>
    )
  }

  if (!hasRecoveryToken) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-sm px-4">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-gray-600 text-sm mb-6">
            Ce lien de réinitialisation n&apos;est plus valide. Demande-en un nouveau depuis la page de connexion.
          </p>
          <Link href="/login" className="text-gray-900 font-medium hover:underline">
            ← Retour à la connexion
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nouveau mot de passe</h1>
          <p className="text-sm text-gray-500 mt-2">Choisis un mot de passe sécurisé</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-7 rounded-xl shadow-sm border border-gray-200">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              placeholder="Min. 6 caractères"
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
            {loading ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </button>
          <p className="text-center">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
              ← Retour à la connexion
            </Link>
          </p>
        </form>
      </div>
    </main>
  )
}
