import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/utils/tailwind'
import { MentionItem } from './types'

interface MentionListProps {
  items: MentionItem[]
  command: (item: MentionItem) => void
  query: string
}

export const MentionList = forwardRef<any, MentionListProps>(({ items, command, query }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState(query)
  const [filteredItems, setFilteredItems] = useState(items)
  const itemRefs = React.useRef<(HTMLButtonElement | null)[]>([])

  const selectItem = (index: number) => {
    const item = filteredItems[index]
    if (item) {
      command(item)
    }
  }

  const upHandler = () => {
    const newIndex = (selectedIndex + filteredItems.length - 1) % filteredItems.length
    setSelectedIndex(newIndex)
    // Scroll into view
    itemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest' })
  }

  const downHandler = () => {
    const newIndex = (selectedIndex + 1) % filteredItems.length
    setSelectedIndex(newIndex)
    // Scroll into view
    itemRefs.current[newIndex]?.scrollIntoView({ block: 'nearest' })
  }

  const enterHandler = () => {
    selectItem(selectedIndex)
  }

  // Update filtered items when search query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items)
    } else {
      const filtered = items.filter(item => 
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setFilteredItems(filtered)
    }
    setSelectedIndex(0)
  }, [searchQuery, items])

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems])

  // Update search query when query prop changes
  useEffect(() => {
    setSearchQuery(query)
  }, [query])

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        upHandler()
        return true
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        downHandler()
        return true
      }

      if (event.key === 'Enter') {
        event.preventDefault();
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
      )}>
      {/* Search Input */}
      <div className="p-2 border-b border-border">
        <Input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-8 text-sm"
          autoFocus
        />
      </div>

      {/* Results */}
      <div className={cn(
        'max-h-48',
        'overflow-y-auto',
        'scrollbar-thin',
        'scrollbar-thumb-muted',
        'scrollbar-track-transparent'
      )}>
        {filteredItems.length ? (
          filteredItems.map((item, index) => {
            const relPath = item.path ? getRelativePath(item.path) : ''
            
            return (
              <button
                key={item.id}
                ref={(el) => { itemRefs.current[index] = el }}
                className={cn(
                  'w-full',
                  'text-left',
                  'p-2',
                  'hover:bg-accent',
                  'hover:text-accent-foreground',
                  'flex',
                  'items-center',
                  'gap-2',
                  'rounded-md',
                  'transition-colors',
                  index === selectedIndex && 'bg-accent text-accent-foreground'
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
          <div className="p-4 text-center text-sm text-muted-foreground">
            No files found
          </div>
        )}
      </div>
    </div>
  )
})

MentionList.displayName = 'MentionList'
