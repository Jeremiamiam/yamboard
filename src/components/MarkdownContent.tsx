"use client";

import ReactMarkdown from "react-markdown";

/**
 * Renders markdown content for assistant chat messages.
 * Used by all three chat scopes (agency, client, project).
 * User messages remain plain text — only assistant responses are rendered.
 */
export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      components={{
        // Headings
        h1: ({ children }) => (
          <h1 className="text-base font-bold mt-3 mb-1 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-sm font-bold mt-3 mb-1 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mt-2 mb-1 first:mt-0">{children}</h3>
        ),
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
        ),
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-4 mb-2 space-y-0.5">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-4 mb-2 space-y-0.5">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-relaxed">{children}</li>
        ),
        // Inline code
        code: ({ children, className }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <code className="block bg-zinc-100 dark:bg-zinc-800 rounded px-3 py-2 text-xs font-mono overflow-x-auto mb-2">
                {children}
              </code>
            );
          }
          return (
            <code className="bg-zinc-100 dark:bg-zinc-800 rounded px-1 py-0.5 text-xs font-mono">
              {children}
            </code>
          );
        },
        // Code blocks
        pre: ({ children }) => (
          <pre className="bg-zinc-100 dark:bg-zinc-800 rounded px-3 py-2 text-xs font-mono overflow-x-auto mb-2 whitespace-pre-wrap">
            {children}
          </pre>
        ),
        // Bold and italic
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        // Horizontal rule
        hr: () => (
          <hr className="border-zinc-200 dark:border-zinc-700 my-2" />
        ),
        // Blockquote
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-zinc-300 dark:border-zinc-600 pl-3 my-2 text-zinc-600 dark:text-zinc-400">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
