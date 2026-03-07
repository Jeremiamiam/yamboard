import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">GET BRANDON</h1>
          <p className="text-sm text-gray-500 mt-2">Outil de production agence</p>
        </div>
        <LoginForm />
      </div>
    </main>
  )
}
