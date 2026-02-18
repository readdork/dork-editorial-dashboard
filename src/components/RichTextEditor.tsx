import { useState, useRef } from 'react'
import { Bold, Italic, Link, Quote, List, Heading } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isFocused, setIsFocused] = useState(false)

  function insertTag(before: string, after: string = '') {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const toolbarButtons = [
    { icon: Bold, label: 'Bold', action: () => insertTag('<strong>', '</strong>') },
    { icon: Italic, label: 'Italic', action: () => insertTag('<em>', '</em>') },
    { icon: Heading, label: 'Heading', action: () => insertTag('<h2>', '</h2>') },
    { icon: Quote, label: 'Quote', action: () => insertTag('<blockquote>', '</blockquote>') },
    { icon: List, label: 'List', action: () => insertTag('<ul>\n  <li>', '</li>\n</ul>') },
    { icon: Link, label: 'Link', action: () => insertTag('<a href="">', '</a>') },
  ]

  return (
    <div className={`border rounded-lg overflow-hidden transition-colors ${
      isFocused ? 'border-dork-500 ring-1 ring-dork-500/20' : 'border-gray-200 dark:border-gray-700'
    }`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        {toolbarButtons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title={btn.label}
          >
            <btn.icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full px-4 py-3 min-h-[300px] resize-y bg-white dark:bg-gray-900 focus:outline-none"
        style={{ fontFamily: 'monospace', fontSize: '14px', lineHeight: '1.6' }}
      />
    </div>
  )
}
