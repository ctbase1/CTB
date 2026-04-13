'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  children: string
  className?: string
}

export function MarkdownRenderer({ children, className }: Props) {
  return (
    <div className={`prose prose-sm prose-invert max-w-none ${className ?? ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-violet-400 hover:underline"
            >
              {children}
            </a>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.startsWith('language-')
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-violet-300 font-mono">
                {children}
              </code>
            )
          },
          pre: ({ children }) => <pre className="my-2">{children}</pre>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-slate-600 pl-3 text-slate-400 italic">
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
