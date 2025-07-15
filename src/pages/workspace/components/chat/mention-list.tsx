import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { cn } from '@/utils/tailwind'
import { MentionItem } from './types'
import { Input } from '@/components/ui/input'

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
  query: string
}

export const MentionList = forwardRef<any, MentionListProps>(({ items, command, query }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) {
      command(item)
    }
  }

  const upHandler = () => {
    const newIndex = (selectedIndex + items.length - 1) % items.length
    setSelectedIndex(newIndex)
    itemRefs.current[newIndex]?.scrollIntoView({ block: 'end' })
  }

  const downHandler = () => {
    const newIndex = (selectedIndex + 1) % items.length
    setSelectedIndex(newIndex)
    itemRefs.current[newIndex]?.scrollIntoView({ block: 'end' })
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        event.preventDefault()
        enterHandler()
        return true
      }

      return false
    },
  }))

  // Helper to get relative path
  const getRelativePath = (fullPath: string) => {
    if (!fullPath) return ''
    // Try to find /src/ or / in the path and show from there
    const match = fullPath.match(/(?:\\|\/)(src|components|pages|api|helpers|hooks|layouts|localization|routes|services|stores|styles|themes|types|utils)(?:\\|\/)/);
    if (match) {
      const idx = fullPath.indexOf(match[0]);
      return fullPath.slice(idx + 1); // skip leading slash
    }
    // fallback: show last 2 segments
    const parts = fullPath.split(/\\|\//);
    return parts.slice(-2).join('/');
  }

  return (
    <div
      className={cn(
        'mention-suggestions',
        'bg-popover',
        'border',
        'border-border',
        'rounded-lg',
        'shadow-lg',
        'max-h-64',
        'overflow-hidden',
        'p-1',
        'w-72'
      )}
    >
      <div className="absolute top-0 left-0 right-0">
        <Input
          type="text"
          placeholder="Search files..."
          value={query}
          readOnly
          className="h-8 text-sm bg-black/20 backdrop-blur-lg outline-none border-none focus:ring-0"
        />
      </div>
      <div
        className={cn(
          'max-h-48',
          'overflow-y-auto',
          'scrollbar-thin',
          'scrollbar-thumb-muted',
          'scrollbar-track-transparent'
        )}
      >
        <div className="empty-placeholder w-full h-10"/>
        {items.length > 0 ? (
          items.map((item, index) => {
            const relPath = item.path ? getRelativePath(item.path) : ''

            return (
              <button
                key={item.id}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                className={cn(
                  'w-full',
                  'text-left',
                  'p-2',
                  'hover:bg-accent/20',
                  'hover:text-accent-foreground',
                  'flex',
                  'items-center',
                  'gap-2',
                  'rounded-md',
                  'transition-colors',
                  index === selectedIndex && 'bg-accent/20 text-accent-foreground'
                )}
                onClick={() => selectItem(index)}
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-xs truncate">{item.label}</div>
                  {relPath && (
                    <div className="text-xs text-muted-foreground/50 truncate">{relPath}</div>
                  )}
                </div>
              </button>
            )
          })
        ) : (
          <div className="p-2 text-center text-sm text-muted-foreground">No results</div>
        )}
      </div>
    </div>
  )
})

MentionList.displayName = 'MentionList'
