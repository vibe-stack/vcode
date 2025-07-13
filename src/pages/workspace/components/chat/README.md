# Enhanced Chat Input System

This enhanced chat input system provides advanced features for the IDE's AI assistant, including file mentions, attachments, and rich text editing.

## Features

### 1. File Mentions (@filename)
- Type `@` followed by a filename to mention files from your project
- Intelligent file search with fuzzy matching
- Automatic file content attachment when mentioned
- Visual mention highlighting in the editor

### 2. Rich Text Editing
- Built with Tiptap editor for better UX
- Supports multiline input with proper formatting
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)

### 3. Attachments Support
- Integrates with AI SDK's `experimental_attachments` feature
- Automatic file content loading for mentioned files
- Attachment preview in messages
- Support for various file types (code, documents, etc.)

### 4. Serialization & Persistence
- Structured message format for future editing capabilities
- Maintains relationship between Tiptap content and AI SDK messages
- Extensible for future mention types (URLs, references, etc.)

## Usage

### Basic Usage
```tsx
import { EnhancedChatInput } from './enhanced-chat-input';

<EnhancedChatInput
  onSend={(content, attachments) => {
    // Handle message with attachments
    console.log('Message:', content);
    console.log('Attachments:', attachments);
  }}
  onStop={() => {
    // Handle stop action
  }}
  isLoading={false}
  placeholder="Ask me anything about your project..."
/>
```

### Mention Usage
1. Type `@` in the input
2. Start typing a filename
3. Select from the dropdown suggestions
4. The file will be automatically attached to your message

## Architecture

### Components

1. **EnhancedChatInput** - Main input component with Tiptap editor
2. **MentionSuggestion** - Dropdown component for mention suggestions
3. **AttachmentDisplay** - Component to display file attachments
4. **MentionProvider** - Service for searching and providing mention suggestions

### Services

1. **MentionProvider** - Handles file searching and caching
2. **ChatSerializationService** - Converts between Tiptap and AI SDK formats
3. **ProjectAPI** - Existing service for file operations

### Data Flow

1. User types `@filename` in the editor
2. MentionProvider searches project files
3. User selects a mention from suggestions
4. File content is loaded and attached
5. Message is sent with both text and attachments
6. AI SDK receives structured message with attachments

## Extension Points

### Adding New Mention Types
```typescript
// In mention-provider.ts
async searchMentions(query: string, type: 'file' | 'url' | 'custom' = 'all') {
  // Add new mention type logic
  if (type === 'custom') {
    // Custom mention search logic
  }
}
```

### Custom Attachment Types
```typescript
// In types.ts
export interface ChatAttachment {
  id: string;
  type: 'file' | 'url' | 'reference' | 'custom';
  // Add custom fields
}
```

## Integration with AI SDK

The system seamlessly integrates with Vercel's AI SDK:

```typescript
// Messages are automatically formatted with attachments
const message = {
  role: 'user',
  content: 'Can you explain this @app.tsx file?',
  experimental_attachments: [
    {
      name: 'app.tsx',
      contentType: 'application/typescript',
      url: 'file:///path/to/app.tsx',
      content: '...' // File content
    }
  ]
};
```

## Future Enhancements

1. **Message Editing** - Edit messages while preserving attachments
2. **URL Mentions** - Mention external URLs and web resources
3. **Reference Mentions** - Mention documentation, issues, etc.
4. **Drag & Drop** - Drop files directly into the input
5. **Image Attachments** - Support for images and diagrams
6. **Snippet Attachments** - Attach code snippets from the editor

## Performance Considerations

- File search results are cached for 30 seconds
- Large files are truncated in attachment preview
- Efficient file watching for real-time updates
- Debounced search to reduce API calls

## Security

- File access is restricted to the current project
- Path validation prevents directory traversal
- Content sanitization for display
- Secure IPC communication with main process
