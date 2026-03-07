"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Message } from "@/lib/supabase/messages"

interface MessageBubbleProps {
  message: Message & { isStreaming?: boolean }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
      {isUser ? (
        // User bubble: right-aligned, blue background
        <div className="max-w-[560px] rounded-2xl rounded-tr-sm px-4 py-3 bg-blue-600 text-white shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      ) : (
        // Agent bubble: left-aligned, white with border, markdown rendered
        <div className="max-w-[560px] rounded-2xl rounded-tl-sm px-5 py-4 bg-white border border-gray-200 shadow-sm">
          <div className="prose prose-sm max-w-none text-gray-900 prose-p:leading-relaxed prose-li:leading-relaxed prose-headings:text-base prose-headings:font-semibold prose-headings:mb-0 prose-h1:text-sm prose-h2:text-sm prose-h3:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle" />
          )}
        </div>
      )}
    </div>
  )
}
