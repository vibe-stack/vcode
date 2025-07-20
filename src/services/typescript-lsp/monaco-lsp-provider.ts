import * as monaco from 'monaco-editor';
import { typescriptLSPClient, LSPPosition, LSPRange, LSPCompletionItem, LSPHoverInfo, LSPLocation, LSPDiagnostic } from '../typescript-lsp/typescript-lsp-client';

// Convert Monaco position to LSP position
function monacoToLSPPosition(position: monaco.Position): LSPPosition {
  return {
    line: position.lineNumber - 1, // LSP is 0-based, Monaco is 1-based
    character: position.column - 1,
  };
}

// Convert LSP position to Monaco position
function lspToMonacoPosition(position: LSPPosition): monaco.Position {
  return new monaco.Position(position.line + 1, position.character + 1);
}

// Convert LSP range to Monaco range
function lspToMonacoRange(range: LSPRange): monaco.Range {
  return new monaco.Range(
    range.start.line + 1,
    range.start.character + 1,
    range.end.line + 1,
    range.end.character + 1
  );
}

// Convert Monaco range to LSP range
function monacoToLSPRange(range: monaco.IRange): LSPRange {
  return {
    start: {
      line: range.startLineNumber - 1,
      character: range.startColumn - 1,
    },
    end: {
      line: range.endLineNumber - 1,
      character: range.endColumn - 1,
    },
  };
}

// Convert LSP completion item kind to Monaco suggestion kind
function lspCompletionKindToMonaco(kind?: number): monaco.languages.CompletionItemKind {
  if (!kind) return monaco.languages.CompletionItemKind.Text;
  
  const kindMap: Record<number, monaco.languages.CompletionItemKind> = {
    1: monaco.languages.CompletionItemKind.Text,
    2: monaco.languages.CompletionItemKind.Method,
    3: monaco.languages.CompletionItemKind.Function,
    4: monaco.languages.CompletionItemKind.Constructor,
    5: monaco.languages.CompletionItemKind.Field,
    6: monaco.languages.CompletionItemKind.Variable,
    7: monaco.languages.CompletionItemKind.Class,
    8: monaco.languages.CompletionItemKind.Interface,
    9: monaco.languages.CompletionItemKind.Module,
    10: monaco.languages.CompletionItemKind.Property,
    11: monaco.languages.CompletionItemKind.Unit,
    12: monaco.languages.CompletionItemKind.Value,
    13: monaco.languages.CompletionItemKind.Enum,
    14: monaco.languages.CompletionItemKind.Keyword,
    15: monaco.languages.CompletionItemKind.Snippet,
    16: monaco.languages.CompletionItemKind.Color,
    17: monaco.languages.CompletionItemKind.File,
    18: monaco.languages.CompletionItemKind.Reference,
    19: monaco.languages.CompletionItemKind.Folder,
    20: monaco.languages.CompletionItemKind.EnumMember,
    21: monaco.languages.CompletionItemKind.Constant,
    22: monaco.languages.CompletionItemKind.Struct,
    23: monaco.languages.CompletionItemKind.Event,
    24: monaco.languages.CompletionItemKind.Operator,
    25: monaco.languages.CompletionItemKind.TypeParameter,
  };

  return kindMap[kind] || monaco.languages.CompletionItemKind.Text;
}

// Convert LSP diagnostic severity to Monaco marker severity
function lspSeverityToMonaco(severity?: number): monaco.MarkerSeverity {
  if (!severity) return monaco.MarkerSeverity.Info;
  
  const severityMap: Record<number, monaco.MarkerSeverity> = {
    1: monaco.MarkerSeverity.Error,
    2: monaco.MarkerSeverity.Warning,
    3: monaco.MarkerSeverity.Info,
    4: monaco.MarkerSeverity.Hint,
  };

  return severityMap[severity] || monaco.MarkerSeverity.Info;
}

// Helper functions for language detection
function getLanguageId(monacoLanguage: string): string {
  const languageMap: Record<string, string> = {
    typescript: 'typescript',
    javascript: 'javascript',
    typescriptreact: 'typescriptreact',
    javascriptreact: 'javascriptreact',
  };

  return languageMap[monacoLanguage] || monacoLanguage;
}

function isTypeScriptLike(languageId: string): boolean {
  return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(languageId);
}

class MonacoLSPProvider {
  private documentVersions = new Map<string, number>();
  private models = new Map<string, monaco.editor.ITextModel>();

  constructor() {
    // Set up diagnostics callback
    typescriptLSPClient.setDiagnosticsCallback((uri, diagnostics) => {
      this.updateDiagnostics(uri, diagnostics);
    });
  }

  public async initializeForProject(projectPath: string): Promise<boolean> {
    return typescriptLSPClient.initialize(projectPath);
  }

  public async addModel(model: monaco.editor.ITextModel): Promise<void> {
    const uri = model.uri.toString();
    this.models.set(uri, model);

    // Determine language ID
    const languageId = getLanguageId(model.getLanguageId());
    if (!isTypeScriptLike(languageId)) {
      return; // Only handle TypeScript/JavaScript files
    }

    // Open document in LSP
    await typescriptLSPClient.openDocument(uri, languageId, model.getValue());

    // Listen for content changes
    model.onDidChangeContent((e) => {
      this.handleContentChange(model, e);
    });

    // Clean up when model is disposed
    model.onWillDispose(() => {
      this.removeModel(model);
    });
  }

  public async removeModel(model: monaco.editor.ITextModel): Promise<void> {
    const uri = model.uri.toString();
    this.models.delete(uri);
    this.documentVersions.delete(uri);

    if (typescriptLSPClient.isDocumentOpen(uri)) {
      await typescriptLSPClient.closeDocument(uri);
    }
  }

  private async handleContentChange(
    model: monaco.editor.ITextModel,
    event: monaco.editor.IModelContentChangedEvent
  ): Promise<void> {
    const uri = model.uri.toString();
    
    if (!typescriptLSPClient.isDocumentOpen(uri)) {
      return;
    }

    // Convert Monaco changes to LSP format
    const changes = event.changes.map((change) => ({
      range: monacoToLSPRange(change.range),
      text: change.text,
    }));

    await typescriptLSPClient.updateDocument(uri, changes);
  }

  private updateDiagnostics(uri: string, diagnostics: LSPDiagnostic[]): void {
    const model = monaco.editor.getModel(monaco.Uri.parse(uri));
    if (!model) return;

    const markers: monaco.editor.IMarkerData[] = diagnostics.map((diagnostic) => ({
      severity: lspSeverityToMonaco(diagnostic.severity),
      startLineNumber: diagnostic.range.start.line + 1,
      startColumn: diagnostic.range.start.character + 1,
      endLineNumber: diagnostic.range.end.line + 1,
      endColumn: diagnostic.range.end.character + 1,
      message: diagnostic.message,
      code: diagnostic.code?.toString(),
      source: diagnostic.source,
    }));

    monaco.editor.setModelMarkers(model, 'typescript-lsp', markers);
  }
}

// Create Monaco language providers that use our LSP client
export function registerLSPProviders() {
  const lspProvider = new MonacoLSPProvider();

  // Completion provider
  monaco.languages.registerCompletionItemProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
    triggerCharacters: ['.', '"', "'", '/', '@', '<'],
    
    async provideCompletionItems(model, position, context, token) {
      const uri = model.uri.toString();
      const lspPosition = monacoToLSPPosition(position);
      
      // Ensure document is open in LSP
      if (!typescriptLSPClient.isDocumentOpen(uri)) {
        const languageId = getLanguageId(model.getLanguageId());
        if (isTypeScriptLike(languageId)) {
          await typescriptLSPClient.openDocument(uri, languageId, model.getValue());
          // Give LSP a moment to process the document
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      try {
        // Add a timeout wrapper for the completion request
        const completionPromise = typescriptLSPClient.getCompletions(uri, lspPosition);
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Completion request timed out')), 5000);
        });
        
        const completions = await Promise.race([completionPromise, timeoutPromise]);
        
        const suggestions: monaco.languages.CompletionItem[] = completions.map((item: LSPCompletionItem) => ({
          label: item.label,
          kind: lspCompletionKindToMonaco(item.kind),
          detail: item.detail,
          documentation: typeof item.documentation === 'string' 
            ? item.documentation 
            : item.documentation?.value,
          insertText: item.insertText || item.label,
          filterText: item.filterText,
          sortText: item.sortText,
          commitCharacters: item.commitCharacters,
          range: new monaco.Range(
            position.lineNumber,
            position.column,
            position.lineNumber,
            position.column
          ),
        }));

        return { suggestions };
      } catch (error) {
        console.error('Error providing completions:', error);
        // Return empty suggestions instead of failing completely
        return { suggestions: [] };
      }
    },
  });

  // Hover provider
  monaco.languages.registerHoverProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
    async provideHover(model, position, token) {
      const uri = model.uri.toString();
      const lspPosition = monacoToLSPPosition(position);
      
      try {
        const hover = await typescriptLSPClient.getHover(uri, lspPosition);
        
        if (!hover) return null;

        const contents = hover.contents.map((content) => {
          if (typeof content === 'string') {
            // Handle plain text content
            return { value: content };
          } else if (content && typeof content === 'object') {
            // Handle MarkupContent or code blocks
            if ((content as any).kind === 'markdown') {
              return { value: (content as any).value };
            } else if ((content as any).language && (content as any).value) {
              // Handle code blocks
              return {
                value: '```' + (content as any).language + '\n' + (content as any).value + '\n```'
              };
            } else if ((content as any).value) {
              // Handle other structured content
              return { value: (content as any).value };
            }
          }
          // Fallback for unknown content types
          return { value: String(content) };
        }).filter(content => content.value); // Remove empty contents

        if (contents.length === 0) {
          return null;
        }

        return {
          contents,
          range: hover.range ? lspToMonacoRange(hover.range) : undefined,
        };
      } catch (error) {
        console.error('Error providing hover:', error);
        return null;
      }
    },
  });

  // Definition provider
  monaco.languages.registerDefinitionProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
    async provideDefinition(model, position, token) {
      const uri = model.uri.toString();
      const lspPosition = monacoToLSPPosition(position);
      
      try {
        const locations = await typescriptLSPClient.getDefinition(uri, lspPosition);
        
        return locations.map((location: LSPLocation) => ({
          uri: monaco.Uri.parse(location.uri),
          range: lspToMonacoRange(location.range),
        }));
      } catch (error) {
        console.error('Error providing definition:', error);
        return [];
      }
    },
  });

  // References provider
  monaco.languages.registerReferenceProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
    async provideReferences(model, position, context, token) {
      const uri = model.uri.toString();
      const lspPosition = monacoToLSPPosition(position);
      
      try {
        const locations = await typescriptLSPClient.getReferences(uri, lspPosition);
        
        return locations.map((location: LSPLocation) => ({
          uri: monaco.Uri.parse(location.uri),
          range: lspToMonacoRange(location.range),
        }));
      } catch (error) {
        console.error('Error providing references:', error);
        return [];
      }
    },
  });

  // Signature help provider
  monaco.languages.registerSignatureHelpProvider(['typescript', 'javascript', 'typescriptreact', 'javascriptreact'], {
    signatureHelpTriggerCharacters: ['(', ','],
    
    async provideSignatureHelp(model, position, token, context) {
      const uri = model.uri.toString();
      const lspPosition = monacoToLSPPosition(position);
      
      try {
        const signatureHelp = await typescriptLSPClient.getSignatureHelp(uri, lspPosition);
        
        if (!signatureHelp) return null;

        return {
          value: {
            signatures: signatureHelp.signatures || [],
            activeSignature: signatureHelp.activeSignature || 0,
            activeParameter: signatureHelp.activeParameter || 0,
          },
          dispose: () => {},
        };
      } catch (error) {
        console.error('Error providing signature help:', error);
        return null;
      }
    },
  });

  return lspProvider;
}

export { MonacoLSPProvider };
