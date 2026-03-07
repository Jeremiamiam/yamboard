"use client"

import { ChoiceItem } from "@/hooks/use-chat-stream"

interface ChoiceCardsProps {
  question: string
  choices: ChoiceItem[]
  disabled: boolean
  onSelect: (label: string) => void
}

export function ChoiceCards({ question, choices, disabled, onSelect }: ChoiceCardsProps) {
  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[560px] w-full">
        <p className="text-xs font-medium text-gray-500 mb-2 px-1">{question}</p>

        <div className={`grid gap-2 ${choices.length > 2 ? "sm:grid-cols-2" : "grid-cols-1"}`}>
          {choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => !disabled && onSelect(choice.label)}
              disabled={disabled}
              className={`
                text-left rounded-xl border px-4 py-3 transition-all duration-150
                ${
                  disabled
                    ? "border-gray-200 bg-white text-gray-400 cursor-not-allowed opacity-60"
                    : "border-blue-200 bg-blue-50 text-gray-900 hover:bg-blue-100 hover:border-blue-400 hover:shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                }
              `}
            >
              <p className="text-sm font-semibold leading-snug mb-1">{choice.label}</p>
              <p className={`text-xs leading-relaxed ${disabled ? "text-gray-400" : "text-gray-600"}`}>
                {choice.description}
              </p>
            </button>
          ))}
        </div>

        {disabled && (
          <p className="text-xs text-gray-400 mt-2 px-1">Chargement en cours...</p>
        )}
      </div>
    </div>
  )
}
