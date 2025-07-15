import { computePosition, flip, shift } from '@floating-ui/dom'
import { ReactRenderer } from '@tiptap/react'
import { MentionList } from './mention-list'
import { mentionProvider } from './mention-provider'

const updatePosition = (editor: any, element: HTMLElement) => {
  const selection = editor.state.selection
  const virtualElement = {
    getBoundingClientRect: () => {
      const { from, to } = selection
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      
      return {
        x: start.left,
        y: start.top,
        width: end.left - start.left,
        height: end.bottom - start.top,
        top: start.top,
        right: end.left,
        bottom: end.bottom,
        left: start.left,
      }
    },
  }

  computePosition(virtualElement, element, {
    placement: 'bottom-start',
    strategy: 'absolute',
    middleware: [shift(), flip()],
  }).then(({ x, y, strategy }) => {
    element.style.width = 'max-content'
    element.style.position = strategy
    element.style.left = `${x}px`
    element.style.top = `${y}px`
  })
}

export const mentionSuggestion = {
  char: '@',
  items: ({ query }: { query: string }) => {
    // Show suggestions as soon as @ is typed (even with empty query)
    const result = mentionProvider.searchMentionsSync(query || '', 'file')
    return result
  },
  render: () => {
    let reactRenderer: ReactRenderer | null = null
    let element: HTMLElement | null = null

    return {
      onStart: (props: any) => {
        if (!props.clientRect) {
          return
        }

        reactRenderer = new ReactRenderer(MentionList, {
          props: {
            ...props,
            query: props.query || '', // Pass the query to the component
          },
          editor: props.editor,
        })

        element = reactRenderer.element as HTMLElement
        element.style.position = 'absolute'
        element.style.zIndex = '1000'

        document.body.appendChild(element)

        updatePosition(props.editor, element)
      },

      onUpdate(props: any) {
        if (!reactRenderer) return

        reactRenderer.updateProps({
          ...props,
          query: props.query || '', // Update the query prop
        })

        if (!props.clientRect || !element) {
          return
        }

        updatePosition(props.editor, element)
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          if (reactRenderer) {
            reactRenderer.destroy()
          }
          if (element) {
            element.remove()
          }
          return true
        }

        // Only handle keys if there are actual suggestions
        if (props.items && props.items.length > 0 && reactRenderer) {
          const ref = reactRenderer.ref as any
          return ref?.onKeyDown?.(props)
        }

        return false
      },

      onExit() {
        if (reactRenderer) {
          reactRenderer.destroy()
        }
        if (element) {
          element.remove()
        }
      },
    }
  },
}
