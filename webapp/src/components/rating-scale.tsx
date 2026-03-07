"use client"

import { useState } from "react"

interface RatingScaleProps {
  question: string
  scale: number
  minLabel: string
  maxLabel: string
  disabled: boolean
  onSelect: (value: string) => void
}

export function RatingScale({ question, scale, minLabel, maxLabel, disabled, onSelect }: RatingScaleProps) {
  const [hovered, setHovered] = useState<number | null>(null)

  const buttons = Array.from({ length: scale }, (_, i) => i + 1)

  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[560px] w-full">
        <p className="text-xs font-medium text-gray-500 mb-3 px-1">{question}</p>
        <div className="flex gap-1.5">
          {buttons.map((n) => {
            const isHighlighted = hovered !== null && n <= hovered
            return (
              <button
                key={n}
                onClick={() => !disabled && onSelect(`${n}/${scale}`)}
                onMouseEnter={() => !disabled && setHovered(n)}
                onMouseLeave={() => !disabled && setHovered(null)}
                disabled={disabled}
                className={`
                  flex-1 h-10 rounded-lg text-sm font-semibold transition-all duration-100
                  ${
                    disabled
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                      : isHighlighted
                      ? "bg-blue-600 text-white cursor-pointer"
                      : "bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                  }
                `}
              >
                {n}
              </button>
            )
          })}
        </div>
        <div className="flex justify-between mt-1.5 px-0.5">
          <span className="text-xs text-gray-400">{minLabel}</span>
          <span className="text-xs text-gray-400">{maxLabel}</span>
        </div>
        {disabled && (
          <p className="text-xs text-gray-400 mt-2 px-1">Chargement en cours...</p>
        )}
      </div>
    </div>
  )
}
