import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { MentionList } from './mention-list'
import { mentionProvider } from './mention-provider'

// Tiptap suggestion utility configuration
// See: https://tiptap.dev/api/utilities/suggestion
export const mentionSuggestion = {
  // The character that triggers the suggestion
  char: '@',

  // The items to display in the suggestion list
  // `query` is the text after the trigger character
  items: async ({ query }: { query: string }) => {
    return mentionProvider.searchFiles(query)
  },

  // How the suggestion list is rendered
  render: () => {
    let component: ReactRenderer<any>
    let popup: any

    return {
      // On start, create the popup and render the MentionList component
      onStart: (props: any) => {
        component = new ReactRenderer(MentionList, {
          props,
          editor: props.editor,
        })

        if (!props.clientRect) {
          return
        }

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'top-start', // Show above the input
        })
      },

      // On update, refresh the popup and component props
      onUpdate(props: any) {
        component.updateProps(props)

        if (!props.clientRect) {
          return
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        })
      },

      // On keydown, forward events to the MentionList component
      // This is the magic that allows the list to handle up/down/enter
      // while the editor remains focused
      onKeyDown(props: { event: KeyboardEvent }) {
        if (props.event.key === 'Escape') {
          popup[0].hide()
          return true
        }

        // Forward key events to the MentionList's imperative handle
        return component.ref?.onKeyDown(props)
      },

      // On exit, destroy the popup and component
      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy()
        }
        if (component) {
          component.destroy()
        }
      },
    }
  },

  // What happens when an item is selected
  command: ({ editor, range, props }: any) => {
    // Insert the mention into the editor
    editor
      .chain()
      .focus()
      .insertContentAt(range, [
        {
          type: 'mention',
          attrs: { id: props.id, label: props.label, path: props.path },
        },
        {
          type: 'text',
          text: ' ', // Add a space after the mention
        },
      ])
      .run()
  },
}