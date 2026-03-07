"use client"

interface ConfirmStepProps {
  question: string
  confirmLabel: string
  cancelLabel: string
  disabled: boolean
  onSelect: (label: string) => void
}

export function ConfirmStep({ question, confirmLabel, cancelLabel, disabled, onSelect }: ConfirmStepProps) {
  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[560px] w-full">
        <p className="text-xs font-medium text-gray-500 mb-3 px-1">{question}</p>
        <div className="flex gap-2">
          <button
            onClick={() => !disabled && onSelect(confirmLabel)}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
              ${
                disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer"
              }
            `}
          >
            {confirmLabel}
          </button>
          <button
            onClick={() => !disabled && onSelect(cancelLabel)}
            disabled={disabled}
            className={`
              flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-150
              ${
                disabled
                  ? "border-gray-200 bg-white text-gray-400 cursor-not-allowed opacity-60"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 cursor-pointer"
              }
            `}
          >
            {cancelLabel}
          </button>
        </div>
        {disabled && (
          <p className="text-xs text-gray-400 mt-2 px-1">Chargement en cours...</p>
        )}
      </div>
    </div>
  )
}
