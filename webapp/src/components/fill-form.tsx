"use client"

import { useState } from "react"
import { FormField } from "@/hooks/use-chat-stream"

interface FillFormProps {
  title?: string
  fields: FormField[]
  disabled: boolean
  onSubmit: (response: string) => void
}

export function FillForm({ title, fields, disabled, onSubmit }: FillFormProps) {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.id, f.value]))
  )

  const handleSubmit = () => {
    if (disabled) return
    const response = fields
      .map((f) => `**${f.label}** : ${values[f.id] ?? ""}`)
      .join("\n")
    onSubmit(response)
  }

  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[560px] w-full">
        {title && (
          <p className="text-xs font-semibold text-gray-700 mb-3 px-1">{title}</p>
        )}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          {fields.map((field, i) => (
            <div
              key={field.id}
              className={`px-4 py-3 ${i < fields.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <label className="block text-xs font-medium text-gray-500 mb-1">
                {field.label}
              </label>
              {field.multiline ? (
                <textarea
                  value={values[field.id] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  disabled={disabled}
                  rows={3}
                  className="w-full text-sm text-gray-900 resize-none focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                />
              ) : (
                <input
                  type="text"
                  value={values[field.id] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                  }
                  disabled={disabled}
                  className="w-full text-sm text-gray-900 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed bg-transparent"
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-3 px-1">
          <button
            onClick={handleSubmit}
            disabled={disabled}
            className={`
              px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
              ${
                disabled
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-60"
                  : "bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 cursor-pointer"
              }
            `}
          >
            Valider
          </button>
        </div>
        {disabled && (
          <p className="text-xs text-gray-400 mt-2 px-1">Chargement en cours...</p>
        )}
      </div>
    </div>
  )
}
