'use client'

import { Bold, Italic, Code } from 'lucide-react'

interface Props {
  textareaRef: React.RefObject<HTMLTextAreaElement>
  onUpdate: (value: string) => void
}

function wrap(textarea: HTMLTextAreaElement, prefix: string, suffix: string, onUpdate: (v: string) => void) {
  const { selectionStart: start, selectionEnd: end, value } = textarea
  const selected = value.slice(start, end)
  const replacement = `${prefix}${selected || 'text'}${suffix}`
  const next = value.slice(0, start) + replacement + value.slice(end)
  // Update the DOM value and trigger React's onChange
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
  nativeInputValueSetter?.call(textarea, next)
  textarea.dispatchEvent(new Event('input', { bubbles: true }))
  onUpdate(next)
  // Re-position cursor inside the wrapping
  const cursorPos = start + prefix.length + (selected ? selected.length : 4)
  textarea.focus()
  textarea.setSelectionRange(cursorPos, cursorPos)
}

export function MarkdownToolbar({ textareaRef, onUpdate }: Props) {
  function handleBold() {
    if (!textareaRef.current) return
    wrap(textareaRef.current, '**', '**', onUpdate)
  }
  function handleItalic() {
    if (!textareaRef.current) return
    wrap(textareaRef.current, '*', '*', onUpdate)
  }
  function handleCode() {
    if (!textareaRef.current) return
    wrap(textareaRef.current, '`', '`', onUpdate)
  }

  return (
    <div className="flex items-center gap-1 border-b border-zinc-700 pb-1 mb-2">
      <button
        type="button"
        onClick={handleBold}
        title="Bold"
        className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
      >
        <Bold className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleItalic}
        title="Italic"
        className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleCode}
        title="Inline code"
        className="rounded p-1 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
      >
        <Code className="h-3.5 w-3.5" />
      </button>
      <span className="ml-1 text-[10px] text-zinc-600">Markdown supported</span>
    </div>
  )
}
