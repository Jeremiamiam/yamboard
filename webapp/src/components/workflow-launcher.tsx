"use client"

import { useRouter } from "next/navigation"
import { WORKFLOW_ORDER, WORKFLOW_LABELS } from "@/lib/workflows/system-prompts"

type WorkflowStatus = "available" | "completed" | "locked"

function StatusBadge({ status }: { status: WorkflowStatus }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
        <span>✓</span> Complété
      </span>
    )
  }
  if (status === "available") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
        <span className="text-blue-400">●</span> Disponible
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
      <span>🔒</span> Bloqué
    </span>
  )
}

interface WorkflowLauncherProps {
  projectId: string
  workflowStates: Array<{ workflow_slug: string; status: WorkflowStatus }>
}

export function WorkflowLauncher({ projectId, workflowStates }: WorkflowLauncherProps) {
  const router = useRouter()
  const stateMap = Object.fromEntries(
    workflowStates.map((w) => [w.workflow_slug, w.status])
  )

  const handleLaunch = (slug: string) => {
    router.push(`/projects/${projectId}/chat?workflow=${slug}`)
  }

  return (
    <ul className="space-y-1">
      {WORKFLOW_ORDER.map((slug) => {
        const status = (stateMap[slug] ?? "locked") as WorkflowStatus
        const label = WORKFLOW_LABELS[slug] ?? slug

        return (
          <li
            key={slug}
            className={`flex items-center justify-between py-2 px-1 ${
              status === "available" ? "border-l-2 border-blue-500 pl-3" : ""
            } ${status === "locked" ? "opacity-60" : ""}`}
          >
            <span className={`font-mono text-sm ${status === "locked" ? "text-gray-400" : "text-gray-800"}`}>
              {status === "completed" && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-100 text-green-600 text-xs mr-2">✓</span>
              )}
              {label}
            </span>
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              {status === "available" && (
                <button
                  onClick={() => handleLaunch(slug)}
                  className="text-xs px-4 py-1.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  Lancer
                </button>
              )}
              {status === "completed" && (
                <button
                  onClick={() => handleLaunch(slug)}
                  className="text-xs px-3 py-1 text-gray-500 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  Reprendre
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
