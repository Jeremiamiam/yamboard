export function TypingIndicator() {
  return (
    <div className="flex justify-start w-full">
      <div className="max-w-[560px] rounded-2xl rounded-tl-sm px-5 py-4 bg-white border border-gray-200 shadow-sm">
        <div className="flex gap-1 items-center h-5" aria-label="Agent is typing">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}
