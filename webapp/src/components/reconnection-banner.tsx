import { ReconnectStatus } from "@/hooks/use-chat-stream"

interface ReconnectionBannerProps {
  status: ReconnectStatus
  onRetry: () => void
}

export function ReconnectionBanner({ status, onRetry }: ReconnectionBannerProps) {
  if (status === "idle") return null

  if (status === "reconnecting") {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl shadow-md text-sm">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shrink-0" />
          Reconnexion...
        </div>
      </div>
    )
  }

  // status === "failed"
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4">
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-md text-sm">
        <span className="flex-1">Connexion interrompue</span>
        <button
          onClick={onRetry}
          className="font-medium underline hover:no-underline focus:outline-none shrink-0"
        >
          Réessayer
        </button>
      </div>
    </div>
  )
}
