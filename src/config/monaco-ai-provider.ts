import * as monaco from "monaco-editor";

export interface MonacoAIProvider {
  // Code completion
  provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): monaco.languages.ProviderResult<monaco.languages.CompletionList>;

  // Code actions (quick fixes, refactoring)
  provideCodeActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext,
    token: monaco.CancellationToken,
  ): monaco.languages.ProviderResult<monaco.languages.CodeActionList>;

  // Hover information
  provideHover(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
  ): monaco.languages.ProviderResult<monaco.languages.Hover>;

  // Diagnostics (errors, warnings)
  provideDiagnostics(
    model: monaco.editor.ITextModel,
    token: monaco.CancellationToken,
  ): Promise<monaco.editor.IMarkerData[]>;
}

export class DefaultAIProvider implements MonacoAIProvider {
  private aiApiEndpoint: string;
  private apiKey: string;

  constructor(apiEndpoint: string, apiKey: string) {
    this.aiApiEndpoint = apiEndpoint;
    this.apiKey = apiKey;
  }

  async provideCompletionItems(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    context: monaco.languages.CompletionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.CompletionList> {
    if (token.isCancellationRequested) {
      return { suggestions: [] };
    }

    try {
      const lineContent = model.getLineContent(position.lineNumber);
      const prefix = lineContent.substring(0, position.column - 1);

      // Get surrounding context
      const contextRange = new monaco.Range(
        Math.max(1, position.lineNumber - 10),
        1,
        Math.min(model.getLineCount(), position.lineNumber + 10),
        model.getLineMaxColumn(
          Math.min(model.getLineCount(), position.lineNumber + 10),
        ),
      );
      const contextText = model.getValueInRange(contextRange);

      const suggestions = await this.fetchAISuggestions(
        contextText,
        prefix,
        model.getLanguageId(),
      );

      return {
        suggestions: suggestions.map((suggestion) => ({
          label: suggestion.label,
          kind: this.getCompletionItemKind(suggestion.type),
          insertText: suggestion.insertText,
          documentation: suggestion.documentation,
          detail: suggestion.detail,
          sortText: suggestion.sortText,
          filterText: suggestion.filterText,
          range: new monaco.Range(
            position.lineNumber,
            position.column - prefix.length,
            position.lineNumber,
            position.column,
          ),
        })),
      };
    } catch (error) {
      console.error("AI completion error:", error);
      return { suggestions: [] };
    }
  }

  async provideCodeActions(
    model: monaco.editor.ITextModel,
    range: monaco.Range,
    context: monaco.languages.CodeActionContext,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.CodeActionList> {
    if (token.isCancellationRequested) {
      return { actions: [], dispose: () => {} };
    }

    try {
      const selectedText = model.getValueInRange(range);
      const actions = await this.fetchAICodeActions(
        selectedText,
        model.getLanguageId(),
        context.markers,
      );

      return {
        actions: actions.map((action) => ({
          title: action.title,
          kind: action.kind,
          edit: {
            edits: [
              {
                resource: model.uri,
                versionId: model.getVersionId(),
                textEdit: {
                  range: range,
                  text: action.newText,
                },
              },
            ],
          },
          isPreferred: action.isPreferred,
        })),
        dispose: () => {},
      };
    } catch (error) {
      console.error("AI code action error:", error);
      return { actions: [], dispose: () => {} };
    }
  }

  async provideHover(
    model: monaco.editor.ITextModel,
    position: monaco.Position,
    token: monaco.CancellationToken,
  ): Promise<monaco.languages.Hover | null> {
    if (token.isCancellationRequested) {
      return null;
    }

    try {
      const word = model.getWordAtPosition(position);
      if (!word) return null;

      const range = new monaco.Range(
        position.lineNumber,
        word.startColumn,
        position.lineNumber,
        word.endColumn,
      );

      const contextRange = new monaco.Range(
        Math.max(1, position.lineNumber - 5),
        1,
        Math.min(model.getLineCount(), position.lineNumber + 5),
        model.getLineMaxColumn(
          Math.min(model.getLineCount(), position.lineNumber + 5),
        ),
      );
      const contextText = model.getValueInRange(contextRange);

      const hoverInfo = await this.fetchAIHoverInfo(
        word.word,
        contextText,
        model.getLanguageId(),
      );

      if (!hoverInfo) return null;

      return {
        range,
        contents: [
          { value: hoverInfo.description },
          ...(hoverInfo.examples
            ? [{ value: hoverInfo.examples, isTrusted: true }]
            : []),
        ],
      };
    } catch (error) {
      console.error("AI hover error:", error);
      return null;
    }
  }

  async provideDiagnostics(
    model: monaco.editor.ITextModel,
    token: monaco.CancellationToken,
  ): Promise<monaco.editor.IMarkerData[]> {
    if (token.isCancellationRequested) {
      return [];
    }

    try {
      const content = model.getValue();
      const diagnostics = await this.fetchAIDiagnostics(
        content,
        model.getLanguageId(),
      );

      return diagnostics.map((diagnostic) => ({
        severity: this.getSeverity(diagnostic.severity),
        startLineNumber: diagnostic.startLine,
        startColumn: diagnostic.startColumn,
        endLineNumber: diagnostic.endLine,
        endColumn: diagnostic.endColumn,
        message: diagnostic.message,
        code: diagnostic.code,
        source: "AI Assistant",
      }));
    } catch (error) {
      console.error("AI diagnostics error:", error);
      return [];
    }
  }

  private async fetchAISuggestions(
    context: string,
    prefix: string,
    language: string,
  ): Promise<any[]> {
    // Implementation would make API call to AI service
    // This is a placeholder implementation
    return [];
  }

  private async fetchAICodeActions(
    selectedText: string,
    language: string,
    markers: monaco.editor.IMarkerData[],
  ): Promise<any[]> {
    // Implementation would make API call to AI service
    // This is a placeholder implementation
    return [];
  }

  private async fetchAIHoverInfo(
    word: string,
    context: string,
    language: string,
  ): Promise<any> {
    // Implementation would make API call to AI service
    // This is a placeholder implementation
    return null;
  }

  private async fetchAIDiagnostics(
    content: string,
    language: string,
  ): Promise<any[]> {
    // Implementation would make API call to AI service
    // This is a placeholder implementation
    return [];
  }

  private getCompletionItemKind(
    type: string,
  ): monaco.languages.CompletionItemKind {
    switch (type) {
      case "function":
        return monaco.languages.CompletionItemKind.Function;
      case "variable":
        return monaco.languages.CompletionItemKind.Variable;
      case "class":
        return monaco.languages.CompletionItemKind.Class;
      case "interface":
        return monaco.languages.CompletionItemKind.Interface;
      case "module":
        return monaco.languages.CompletionItemKind.Module;
      case "keyword":
        return monaco.languages.CompletionItemKind.Keyword;
      case "snippet":
        return monaco.languages.CompletionItemKind.Snippet;
      default:
        return monaco.languages.CompletionItemKind.Text;
    }
  }

  private getSeverity(severity: string): monaco.MarkerSeverity {
    switch (severity) {
      case "error":
        return monaco.MarkerSeverity.Error;
      case "warning":
        return monaco.MarkerSeverity.Warning;
      case "info":
        return monaco.MarkerSeverity.Info;
      default:
        return monaco.MarkerSeverity.Hint;
    }
  }
}

export function createAIProvider(
  apiEndpoint: string,
  apiKey: string,
): MonacoAIProvider {
  return new DefaultAIProvider(apiEndpoint, apiKey);
}
