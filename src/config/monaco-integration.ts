import * as monaco from 'monaco-editor';
import { MonacoEditorConfig, getMonacoEditorOptions } from './monaco-config';
import { MonacoAIProvider, DefaultAIProvider } from './monaco-ai-provider';
import { enhanceMonacoLanguages, registerCustomLanguages, getCustomLanguageFromExtension, detectLanguageFromFilename } from './monaco-languages';
import { registerDarkMatrixTheme } from '../themes/dark-matrix-monaco';
import { performanceMonitor, optimizeEditorForLargeFiles } from './monaco-performance';

export class MonacoIntegration {
    private static instance: MonacoIntegration;
    private aiProvider: MonacoAIProvider | null = null;
    private disposables: monaco.IDisposable[] = [];
    private editorInstances: Map<string, monaco.editor.IStandaloneCodeEditor> = new Map();

    static getInstance(): MonacoIntegration {
        if (!MonacoIntegration.instance) {
            MonacoIntegration.instance = new MonacoIntegration();
        }
        return MonacoIntegration.instance;
    }

    // Initialize Monaco with enhanced configuration
    async initialize(config: Partial<MonacoEditorConfig> = {}): Promise<void> {
        try {
            // Register custom theme
            registerDarkMatrixTheme();
            
            // Enhance language support
            enhanceMonacoLanguages();
            registerCustomLanguages();
            
            // Setup AI provider if enabled
            if (config.ai?.enabled && config.ai.provider) {
                this.aiProvider = config.ai.provider;
                await this.setupAIIntegration();
            }
            
            // Configure web workers
            this.configureWebWorkers(config.performance?.workerStrategy || 'auto');
            
            console.log('Monaco Editor initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            throw error;
        }
    }

    // Create an enhanced editor instance
    createEditor(
        container: HTMLElement,
        options: {
            content: string;
            language?: string;
            filename?: string;
            editorId?: string;
            config?: Partial<MonacoEditorConfig>;
        }
    ): monaco.editor.IStandaloneCodeEditor {
        const { content, language, filename, editorId = `editor-${Date.now()}`, config = {} } = options;
        
        // Detect language from filename or extension
        const detectedLanguage = this.detectLanguage(language, filename);
        
        // Track performance
        const fileSize = new Blob([content]).size;
        const performanceTracker = performanceMonitor.trackEditorLoad(editorId, fileSize, detectedLanguage);
        
        // Get optimized configuration
        const editorConfig = getMonacoEditorOptions(config);
        const optimizations = optimizeEditorForLargeFiles(fileSize);
        
        // Create editor with enhanced options
        const editor = monaco.editor.create(container, {
            ...editorConfig,
            ...optimizations,
            value: content,
            language: detectedLanguage,
            automaticLayout: true
        });
        
        // Complete performance tracking
        performanceTracker();
        
        // Store editor instance
        this.editorInstances.set(editorId, editor);
        
        // Setup editor enhancements
        this.setupEditorEnhancements(editor, editorId, config);
        
        return editor;
    }

    // Setup AI integration for all supported languages
    private async setupAIIntegration(): Promise<void> {
        if (!this.aiProvider) return;

        const languages = ['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'go', 'rust'];
        
        for (const language of languages) {
            // Register completion provider
            this.disposables.push(
                monaco.languages.registerCompletionItemProvider(language, {
                    provideCompletionItems: this.aiProvider.provideCompletionItems.bind(this.aiProvider),
                    triggerCharacters: ['.', '(', '<', '"', "'", '/', '@']
                })
            );

            // Register code action provider
            this.disposables.push(
                monaco.languages.registerCodeActionProvider(language, {
                    provideCodeActions: this.aiProvider.provideCodeActions.bind(this.aiProvider),
                    providedCodeActionKinds: [
                        monaco.languages.CodeActionKind.QuickFix,
                        monaco.languages.CodeActionKind.Refactor,
                        monaco.languages.CodeActionKind.Source
                    ]
                })
            );

            // Register hover provider
            this.disposables.push(
                monaco.languages.registerHoverProvider(language, {
                    provideHover: this.aiProvider.provideHover.bind(this.aiProvider)
                })
            );
        }
    }

    // Setup additional editor enhancements
    private setupEditorEnhancements(
        editor: monaco.editor.IStandaloneCodeEditor,
        editorId: string,
        config: Partial<MonacoEditorConfig>
    ): void {
        // Add custom keybindings
        this.setupKeybindings(editor);
        
        // Setup auto-save if enabled
        if (config.preferences?.autoSave) {
            this.setupAutoSave(editor, editorId);
        }
        
        // Setup format on save if enabled
        if (config.preferences?.formatOnSave) {
            this.setupFormatOnSave(editor);
        }
        
        // Setup AI diagnostics if enabled
        if (config.ai?.enabled && config.ai.diagnostics && this.aiProvider) {
            this.setupAIDiagnostics(editor, editorId);
        }
    }

    // Setup custom keybindings
    private setupKeybindings(editor: monaco.editor.IStandaloneCodeEditor): void {
        // Save keybinding
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            this.saveEditor(editor);
        });

        // Format document keybinding
        editor.addCommand(monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF, () => {
            editor.getAction('editor.action.formatDocument')?.run();
        });

        // AI code completion keybinding
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            editor.getAction('editor.action.triggerSuggest')?.run();
        });

        // Quick fix keybinding
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Period, () => {
            editor.getAction('editor.action.quickFix')?.run();
        });
    }

    // Setup auto-save functionality
    private setupAutoSave(editor: monaco.editor.IStandaloneCodeEditor, editorId: string): void {
        let autoSaveTimer: NodeJS.Timeout;
        
        const autoSaveDelay = 2000; // 2 seconds
        
        editor.onDidChangeModelContent(() => {
            clearTimeout(autoSaveTimer);
            autoSaveTimer = setTimeout(() => {
                this.saveEditor(editor);
            }, autoSaveDelay);
        });
    }

    // Setup format on save
    private setupFormatOnSave(editor: monaco.editor.IStandaloneCodeEditor): void {
        // This would integrate with the save functionality
        // For now, it's a placeholder that could be extended
    }

    // Setup AI diagnostics
    private setupAIDiagnostics(editor: monaco.editor.IStandaloneCodeEditor, editorId: string): void {
        if (!this.aiProvider) return;

        let diagnosticsTimer: NodeJS.Timeout;
        const diagnosticsDelay = 1000; // 1 second

        editor.onDidChangeModelContent(() => {
            clearTimeout(diagnosticsTimer);
            diagnosticsTimer = setTimeout(async () => {
                const model = editor.getModel();
                if (model && this.aiProvider) {
                    try {
                        const diagnostics = await this.aiProvider.provideDiagnostics(model, monaco.CancellationToken.None);
                        monaco.editor.setModelMarkers(model, 'ai-diagnostics', diagnostics);
                    } catch (error) {
                        console.error('AI diagnostics error:', error);
                    }
                }
            }, diagnosticsDelay);
        });
    }

    // Save editor content
    private saveEditor(editor: monaco.editor.IStandaloneCodeEditor): void {
        const model = editor.getModel();
        if (model) {
            const content = model.getValue();
            console.log('Saving editor content:', content.length, 'characters');
            // Here you would integrate with your save system
        }
    }

    // Detect language from various sources
    private detectLanguage(language?: string, filename?: string): string {
        if (language) return language;
        
        if (filename) {
            // Check filename patterns first
            const filenameLanguage = detectLanguageFromFilename(filename);
            if (filenameLanguage) return filenameLanguage;
            
            // Check extension
            const extension = filename.split('.').pop();
            if (extension) {
                const extensionLanguage = getCustomLanguageFromExtension(extension);
                if (extensionLanguage) return extensionLanguage;
                
                // Standard Monaco language detection
                return this.getStandardLanguageFromExtension(extension);
            }
        }
        
        return 'plaintext';
    }

    // Get standard Monaco language from extension
    private getStandardLanguageFromExtension(extension: string): string {
        const standardMappings: Record<string, string> = {
            'js': 'javascript',
            'jsx': 'javascript',
            'ts': 'typescript',
            'tsx': 'typescript',
            'py': 'python',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'cpp',
            'h': 'cpp',
            'hpp': 'cpp',
            'cs': 'csharp',
            'go': 'go',
            'rs': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
            'scala': 'scala',
            'html': 'html',
            'htm': 'html',
            'css': 'css',
            'scss': 'scss',
            'sass': 'scss',
            'less': 'less',
            'json': 'json',
            'xml': 'xml',
            'md': 'markdown',
            'sql': 'sql',
            'sh': 'shell',
            'bash': 'shell',
            'zsh': 'shell',
            'ps1': 'powershell',
            'r': 'r',
            'lua': 'lua',
            'dart': 'dart',
            'tex': 'latex'
        };
        
        return standardMappings[extension.toLowerCase()] || 'plaintext';
    }

    // Configure web workers based on strategy
    private configureWebWorkers(strategy: 'auto' | 'disabled' | 'web-worker'): void {
        if (strategy === 'disabled') {
            // Disable all web workers
            (self as any).MonacoEnvironment = {
                getWorker: () => null
            };
        } else if (strategy === 'web-worker') {
            // Enable web workers (default Monaco behavior)
            delete (self as any).MonacoEnvironment;
        } else {
            // Auto strategy - use web workers in browser, disable in Electron
            const isElectron = typeof window !== 'undefined' && window.process && window.process.versions && window.process.versions.electron;
            
            if (isElectron) {
                (self as any).MonacoEnvironment = {
                    getWorker: () => null
                };
            }
        }
    }

    // Get editor instance by ID
    getEditor(editorId: string): monaco.editor.IStandaloneCodeEditor | undefined {
        return this.editorInstances.get(editorId);
    }

    // Dispose of an editor instance
    disposeEditor(editorId: string): void {
        const editor = this.editorInstances.get(editorId);
        if (editor) {
            editor.dispose();
            this.editorInstances.delete(editorId);
            performanceMonitor.clearEditorData(editorId);
        }
    }

    // Set AI provider
    setAIProvider(provider: MonacoAIProvider): void {
        this.aiProvider = provider;
    }

    // Get performance summary
    getPerformanceSummary(): any {
        return performanceMonitor.getOverallPerformanceSummary();
    }

    // Dispose of all resources
    dispose(): void {
        // Dispose all language providers
        this.disposables.forEach(disposable => disposable.dispose());
        this.disposables = [];
        
        // Dispose all editor instances
        this.editorInstances.forEach((editor, editorId) => {
            editor.dispose();
            performanceMonitor.clearEditorData(editorId);
        });
        this.editorInstances.clear();
        
        // Clear performance data
        performanceMonitor.clearAllData();
    }
}

// Export singleton instance
export const monacoIntegration = MonacoIntegration.getInstance();

// Convenience function to create AI provider
export function createAIProvider(apiEndpoint: string, apiKey: string): MonacoAIProvider {
    return new DefaultAIProvider(apiEndpoint, apiKey);
}

// Convenience function to initialize Monaco with AI
export async function initializeMonacoWithAI(
    config: Partial<MonacoEditorConfig> = {},
    aiConfig?: { apiEndpoint: string; apiKey: string }
): Promise<void> {
    if (aiConfig) {
        const aiProvider = createAIProvider(aiConfig.apiEndpoint, aiConfig.apiKey);
        config.ai = {
            enabled: true,
            provider: aiProvider,
            completions: true,
            codeActions: true,
            hover: true,
            diagnostics: true,
            ...config.ai
        };
    }
    
    await monacoIntegration.initialize(config);
}
