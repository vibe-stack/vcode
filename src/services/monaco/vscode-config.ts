/**
 * VSCode Configuration and Settings Management
 */
import { updateUserConfiguration } from '@codingame/monaco-vscode-configuration-service-override';

export interface VSCodeSettings {
    editor?: {
        fontSize?: number;
        lineHeight?: number;
        fontFamily?: string;
        fontWeight?: string;
        letterSpacing?: number;
        wordWrap?: 'off' | 'on' | 'wordWrapColumn' | 'bounded';
        minimap?: {
            enabled?: boolean;
        };
        scrollBeyondLastLine?: boolean;
        automaticLayout?: boolean;
        theme?: string;
        tabSize?: number;
        insertSpaces?: boolean;
        detectIndentation?: boolean;
        renderWhitespace?: 'none' | 'boundary' | 'selection' | 'all';
        renderControlCharacters?: boolean;
        renderIndentGuides?: boolean;
        highlightActiveIndentGuide?: boolean;
        rulers?: number[];
        codeLens?: boolean;
        folding?: boolean;
        foldingStrategy?: 'auto' | 'indentation';
        showFoldingControls?: 'always' | 'mouseover';
        unfoldOnClickAfterEndOfLine?: boolean;
        matchBrackets?: 'never' | 'near' | 'always';
        glyphMargin?: boolean;
        lineNumbers?: 'on' | 'off' | 'relative' | 'interval';
        lineNumbersMinChars?: number;
        lineDecorationsWidth?: number | string;
        cursorStyle?: 'line' | 'block' | 'underline' | 'line-thin' | 'block-outline' | 'underline-thin';
        cursorBlinking?: 'blink' | 'smooth' | 'phase' | 'expand' | 'solid';
        hideCursorInOverviewRuler?: boolean;
        scrollbar?: {
            vertical?: 'auto' | 'visible' | 'hidden';
            horizontal?: 'auto' | 'visible' | 'hidden';
            useShadows?: boolean;
            verticalHasArrows?: boolean;
            horizontalHasArrows?: boolean;
            verticalScrollbarSize?: number;
            horizontalScrollbarSize?: number;
            arrowSize?: number;
        };
        overviewRulerLanes?: number;
        overviewRulerBorder?: boolean;
        contextmenu?: boolean;
        mouseWheelZoom?: boolean;
        multiCursorModifier?: 'ctrlCmd' | 'alt';
        multiCursorMergeOverlapping?: boolean;
        accessibilitySupport?: 'auto' | 'on' | 'off';
        quickSuggestions?: boolean | {
            other?: boolean;
            comments?: boolean;
            strings?: boolean;
        };
        quickSuggestionsDelay?: number;
        parameterHints?: {
            enabled?: boolean;
            cycle?: boolean;
        };
        autoClosingBrackets?: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
        autoClosingQuotes?: 'always' | 'languageDefined' | 'beforeWhitespace' | 'never';
        autoSurround?: 'languageDefined' | 'quotes' | 'brackets' | 'never';
        formatOnType?: boolean;
        formatOnPaste?: boolean;
        suggestOnTriggerCharacters?: boolean;
        acceptSuggestionOnEnter?: 'on' | 'smart' | 'off';
        acceptSuggestionOnCommitCharacter?: boolean;
        snippetSuggestions?: 'top' | 'bottom' | 'inline' | 'none';
        emptySelectionClipboard?: boolean;
        copyWithSyntaxHighlighting?: boolean;
        wordBasedSuggestions?: boolean;
        wordBasedSuggestionsMode?: 'currentDocument' | 'matchingDocuments' | 'allDocuments';
        suggestSelection?: 'first' | 'recentlyUsed' | 'recentlyUsedByPrefix';
        suggestFontSize?: number;
        suggestLineHeight?: number;
        tabCompletion?: 'on' | 'off' | 'onlySnippets';
        suggest?: {
            insertMode?: 'insert' | 'replace';
            filterGraceful?: boolean;
            localityBonus?: boolean;
            shareSuggestSelections?: boolean;
            snippetsPreventQuickSuggestions?: boolean;
            showIcons?: boolean;
            showStatusBar?: boolean;
            preview?: boolean;
            previewMode?: 'prefix' | 'subword' | 'subwordSmart';
            showInlineDetails?: boolean;
            maxVisibleSuggestions?: number;
        };
        gotoLocation?: {
            multiple?: 'peek' | 'gotoAndPeek' | 'goto';
            multipleDefinitions?: 'peek' | 'gotoAndPeek' | 'goto';
            multipleTypeDefinitions?: 'peek' | 'gotoAndPeek' | 'goto';
            multipleDeclarations?: 'peek' | 'gotoAndPeek' | 'goto';
            multipleImplementations?: 'peek' | 'gotoAndPeek' | 'goto';
            multipleReferences?: 'peek' | 'gotoAndPeek' | 'goto';
            alternativeDefinitionCommand?: string;
            alternativeTypeDefinitionCommand?: string;
            alternativeDeclarationCommand?: string;
            alternativeImplementationCommand?: string;
            alternativeReferenceCommand?: string;
        };
        hover?: {
            enabled?: boolean;
            delay?: number;
            sticky?: boolean;
        };
        find?: {
            seedSearchStringFromSelection?: 'always' | 'selection' | 'never';
            autoFindInSelection?: 'always' | 'never' | 'multiline';
            globalFindClipboard?: boolean;
            addExtraSpaceOnTop?: boolean;
            loop?: boolean;
        };
        colorDecorators?: boolean;
        lightbulb?: {
            enabled?: boolean;
        };
        codeActionsOnSave?: {
            [key: string]: boolean;
        };
        codeActionsOnSaveTimeout?: number;
        inlineSuggest?: {
            enabled?: boolean;
            mode?: 'prefix' | 'subword' | 'subwordSmart';
            showToolbar?: 'always' | 'onHover';
            suppressSuggestions?: boolean;
        };
        semanticHighlighting?: {
            enabled?: boolean | 'configuredByTheme';
        };
        guides?: {
            bracketPairs?: boolean | 'active';
            bracketPairsHorizontal?: boolean | 'active';
            highlightActiveBracketPair?: boolean;
            indentation?: boolean;
            highlightActiveIndentation?: boolean | 'always';
        };
        unicodeHighlight?: {
            nonBasicASCII?: boolean | 'inUntrustedWorkspace';
            invisibleCharacters?: boolean;
            ambiguousCharacters?: boolean;
            includeComments?: boolean | 'inUntrustedWorkspace';
            includeStrings?: boolean | 'inUntrustedWorkspace';
            allowedCharacters?: { [char: string]: boolean };
            allowedLocales?: { [locale: string]: boolean };
        };
        bracketPairColorization?: {
            enabled?: boolean;
            independentColorPoolPerBracketType?: boolean;
        };
        linkedEditing?: boolean;
        occurrencesHighlight?: boolean;
        selectionHighlight?: boolean;
        wordHighlight?: boolean;
        definitionLinkOpensInPeek?: boolean;
        showUnused?: boolean;
        showDeprecated?: boolean;
        inlayHints?: {
            enabled?: 'on' | 'onUnlessPressed' | 'offUnlessPressed' | 'off';
            fontSize?: number;
            fontFamily?: string;
            padding?: boolean;
        };
        stickyScroll?: {
            enabled?: boolean;
            maxLineCount?: number;
            defaultModel?: 'outlineModel' | 'foldingProviderModel' | 'indentationModel';
        };
    };
    workbench?: {
        colorTheme?: string;
        iconTheme?: string;
        productIconTheme?: string;
        activityBar?: {
            visible?: boolean;
            location?: 'default' | 'top' | 'bottom' | 'hidden';
        };
        statusBar?: {
            visible?: boolean;
        };
        sideBar?: {
            location?: 'left' | 'right';
        };
        panel?: {
            defaultLocation?: 'bottom' | 'right';
            opensMaximized?: 'always' | 'never' | 'preserve';
        };
        editor?: {
            showTabs?: boolean;
            enablePreview?: boolean;
            enablePreviewFromQuickOpen?: boolean;
            closeOnFileDelete?: boolean;
            openPositioning?: 'left' | 'right' | 'first' | 'last';
            revealIfOpen?: boolean;
            mouseBackForwardToNavigate?: boolean;
            restoreViewState?: boolean;
            splitInGroupLayout?: 'vertical' | 'horizontal';
            splitSizing?: 'auto' | 'distribute' | 'split';
            highlightModifiedTabs?: boolean;
            decorations?: {
                badges?: boolean;
                colors?: boolean;
            };
            labelFormat?: 'default' | 'short' | 'medium' | 'long';
            tabSizing?: 'fit' | 'shrink';
            tabSizingFixedMinWidth?: number;
            tabSizingFixedMaxWidth?: number;
            showIcons?: boolean;
            enablePreviewFromCodeNavigation?: boolean;
            closeEmptyGroups?: boolean;
            focusRecentEditorAfterClose?: boolean;
            limit?: {
                enabled?: boolean;
                excludeDirty?: boolean;
                perEditorGroup?: boolean;
                value?: number;
            };
        };
        tree?: {
            indent?: number;
            renderIndentGuides?: 'none' | 'onHover' | 'always';
            horizontalScrolling?: boolean;
            enableStickyScroll?: boolean;
            stickyScrollMaxItemCount?: number;
        };
        list?: {
            horizontalScrolling?: boolean;
            keyboardNavigation?: 'simple' | 'highlight' | 'filter';
            multiSelectModifier?: 'ctrlCmd' | 'alt';
            openMode?: 'singleClick' | 'doubleClick';
            confirmDelete?: boolean;
            smoothScrolling?: boolean;
            automaticKeyboardNavigation?: boolean;
        };
        quickOpen?: {
            closeOnFocusLost?: boolean;
            preserveInput?: boolean;
        };
        commandPalette?: {
            history?: number;
            preserveInput?: boolean;
        };
        settings?: {
            openDefaultSettings?: boolean;
            openDefaultKeybindings?: boolean;
            useGraphicalDiff?: boolean;
            useSplitJSON?: boolean;
        };
        startupEditor?: 'none' | 'welcomePage' | 'readme' | 'newUntitledFile' | 'welcomePageInEmptyWorkbench';
    };
    files?: {
        eol?: '\n' | '\r\n' | 'auto';
        encoding?: string;
        trimTrailingWhitespace?: boolean;
        trimFinalNewlines?: boolean;
        insertFinalNewline?: boolean;
        autoSave?: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange';
        autoSaveDelay?: number;
        hotExit?: 'off' | 'onExit' | 'onExitAndWindowClose';
        defaultLanguage?: string;
        maxMemoryForLargeFilesMB?: number;
        restoreUndoStack?: boolean;
    };
    search?: {
        exclude?: { [glob: string]: boolean };
        useRipgrep?: boolean;
        useIgnoreFiles?: boolean;
        useGlobalIgnoreFiles?: boolean;
        useParentIgnoreFiles?: boolean;
        followSymlinks?: boolean;
        smartCase?: boolean;
        globalFindClipboard?: boolean;
        location?: 'sidebar' | 'panel';
        collapseResults?: 'auto' | 'alwaysCollapse' | 'alwaysExpand';
        searchOnType?: boolean;
        searchOnTypeDebouncePeriod?: number;
        seedOnFocus?: boolean;
        seedWithNearestWord?: boolean;
        showLineNumbers?: boolean;
        sortOrder?: 'default' | 'fileNames' | 'type' | 'modified' | 'countDescending' | 'countAscending';
        decorations?: {
            colors?: boolean;
            badges?: boolean;
        };
        maxResults?: number;
        quickOpen?: {
            includeSymbols?: boolean;
            includeHistory?: boolean;
            history?: {
                filterSortOrder?: 'default' | 'recency';
            };
        };
    };
    [key: string]: any;
}

/**
 * Default VSCode settings for the editor
 */
export const DEFAULT_VSCODE_SETTINGS: VSCodeSettings = {
    editor: {
        fontSize: 14,
        lineHeight: 1.5,
        fontFamily: 'Geist Mono, Monaco, "Lucida Console", monospace',
        fontWeight: '400',
        letterSpacing: 0,
        wordWrap: 'on',
        minimap: {
            enabled: false,
        },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark',
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: true,
        renderWhitespace: 'boundary',
        renderControlCharacters: false,
        renderIndentGuides: true,
        highlightActiveIndentGuide: true,
        rulers: [],
        codeLens: true,
        folding: true,
        foldingStrategy: 'auto',
        showFoldingControls: 'mouseover',
        unfoldOnClickAfterEndOfLine: false,
        matchBrackets: 'always',
        glyphMargin: true,
        lineNumbers: 'on',
        lineNumbersMinChars: 5,
        lineDecorationsWidth: 10,
        cursorStyle: 'line',
        cursorBlinking: 'blink',
        hideCursorInOverviewRuler: false,
        scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: true,
            verticalHasArrows: false,
            horizontalHasArrows: false,
            verticalScrollbarSize: 14,
            horizontalScrollbarSize: 12,
            arrowSize: 11,
        },
        overviewRulerLanes: 3,
        overviewRulerBorder: true,
        contextmenu: true,
        mouseWheelZoom: false,
        multiCursorModifier: 'alt',
        multiCursorMergeOverlapping: true,
        accessibilitySupport: 'auto',
        quickSuggestions: {
            other: true,
            comments: false,
            strings: false,
        },
        quickSuggestionsDelay: 10,
        parameterHints: {
            enabled: true,
            cycle: false,
        },
        autoClosingBrackets: 'languageDefined',
        autoClosingQuotes: 'languageDefined',
        autoSurround: 'languageDefined',
        formatOnType: false,
        formatOnPaste: false,
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        acceptSuggestionOnCommitCharacter: true,
        snippetSuggestions: 'inline',
        emptySelectionClipboard: true,
        copyWithSyntaxHighlighting: true,
        wordBasedSuggestions: true,
        wordBasedSuggestionsMode: 'matchingDocuments',
        suggestSelection: 'first',
        suggestFontSize: 0,
        suggestLineHeight: 0,
        tabCompletion: 'off',
        suggest: {
            insertMode: 'insert',
            filterGraceful: true,
            localityBonus: false,
            shareSuggestSelections: false,
            snippetsPreventQuickSuggestions: true,
            showIcons: true,
            showStatusBar: false,
            preview: false,
            previewMode: 'subwordSmart',
            showInlineDetails: true,
            maxVisibleSuggestions: 12,
        },
        hover: {
            enabled: true,
            delay: 300,
            sticky: true,
        },
        find: {
            seedSearchStringFromSelection: 'always',
            autoFindInSelection: 'never',
            globalFindClipboard: false,
            addExtraSpaceOnTop: true,
            loop: true,
        },
        colorDecorators: true,
        lightbulb: {
            enabled: true,
        },
        semanticHighlighting: {
            enabled: 'configuredByTheme',
        },
        guides: {
            bracketPairs: false,
            bracketPairsHorizontal: true,
            highlightActiveBracketPair: true,
            indentation: true,
            highlightActiveIndentation: true,
        },
        bracketPairColorization: {
            enabled: true,
            independentColorPoolPerBracketType: false,
        },
        linkedEditing: false,
        occurrencesHighlight: true,
        selectionHighlight: true,
        wordHighlight: true,
        definitionLinkOpensInPeek: false,
        showUnused: true,
        showDeprecated: true,
        inlayHints: {
            enabled: 'on',
            fontSize: 12,
            fontFamily: '',
            padding: false,
        },
        stickyScroll: {
            enabled: false,
            maxLineCount: 5,
            defaultModel: 'outlineModel',
        },
    },
    workbench: {
        colorTheme: 'Dark+',
        iconTheme: 'vs-seti',
        activityBar: {
            visible: true,
            location: 'default',
        },
        statusBar: {
            visible: true,
        },
        sideBar: {
            location: 'left',
        },
        panel: {
            defaultLocation: 'bottom',
            opensMaximized: 'preserve',
        },
        editor: {
            showTabs: true,
            enablePreview: true,
            enablePreviewFromQuickOpen: false,
            closeOnFileDelete: false,
            openPositioning: 'right',
            revealIfOpen: false,
            mouseBackForwardToNavigate: true,
            restoreViewState: true,
            splitInGroupLayout: 'vertical',
            splitSizing: 'auto',
            highlightModifiedTabs: false,
            decorations: {
                badges: true,
                colors: true,
            },
            labelFormat: 'default',
            tabSizing: 'fit',
            showIcons: true,
            enablePreviewFromCodeNavigation: false,
            closeEmptyGroups: true,
            focusRecentEditorAfterClose: true,
            limit: {
                enabled: false,
                excludeDirty: false,
                perEditorGroup: false,
                value: 10,
            },
        },
        tree: {
            indent: 8,
            renderIndentGuides: 'onHover',
            horizontalScrolling: false,
            enableStickyScroll: true,
            stickyScrollMaxItemCount: 7,
        },
        list: {
            horizontalScrolling: false,
            keyboardNavigation: 'highlight',
            multiSelectModifier: 'ctrlCmd',
            openMode: 'singleClick',
            confirmDelete: true,
            smoothScrolling: false,
            automaticKeyboardNavigation: true,
        },
        quickOpen: {
            closeOnFocusLost: true,
            preserveInput: false,
        },
        commandPalette: {
            history: 50,
            preserveInput: false,
        },
        settings: {
            openDefaultSettings: false,
            openDefaultKeybindings: false,
            useGraphicalDiff: true,
            useSplitJSON: false,
        },
        startupEditor: 'welcomePage',
    },
    files: {
        eol: 'auto',
        encoding: 'utf8',
        trimTrailingWhitespace: false,
        trimFinalNewlines: false,
        insertFinalNewline: false,
        autoSave: 'off',
        autoSaveDelay: 1000,
        hotExit: 'onExit',
        defaultLanguage: '',
        maxMemoryForLargeFilesMB: 4096,
        restoreUndoStack: true,
    },
    search: {
        exclude: {
            '**/node_modules': true,
            '**/bower_components': true,
            '**/*.code-search': true,
        },
        useRipgrep: true,
        useIgnoreFiles: true,
        useGlobalIgnoreFiles: false,
        useParentIgnoreFiles: false,
        followSymlinks: true,
        smartCase: false,
        globalFindClipboard: false,
        location: 'sidebar',
        collapseResults: 'alwaysExpand',
        searchOnType: true,
        searchOnTypeDebouncePeriod: 300,
        seedOnFocus: false,
        seedWithNearestWord: false,
        showLineNumbers: false,
        sortOrder: 'default',
        decorations: {
            colors: true,
            badges: true,
        },
        maxResults: 20000,
        quickOpen: {
            includeSymbols: false,
            includeHistory: true,
            history: {
                filterSortOrder: 'default',
            },
        },
    },
};

/**
 * Apply VSCode settings to the editor
 */
export function applyVSCodeSettings(settings: VSCodeSettings = DEFAULT_VSCODE_SETTINGS): void {
    const settingsJson = JSON.stringify(settings, null, 2);
    updateUserConfiguration(settingsJson);
}

/**
 * Create a minimal settings configuration for basic editor functionality
 */
export function createMinimalSettings(overrides: Partial<VSCodeSettings> = {}): VSCodeSettings {
    return {
        editor: {
            fontSize: 14,
            fontFamily: 'Geist Mono, Monaco, "Lucida Console", monospace',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            ...overrides.editor,
        },
        workbench: {
            colorTheme: 'Dark+',
            ...overrides.workbench,
        },
        files: {
            autoSave: 'afterDelay',
            autoSaveDelay: 1000,
            ...overrides.files,
        },
        ...overrides,
    };
}

/**
 * Merge settings with defaults
 */
export function mergeSettings(baseSettings: VSCodeSettings, overrides: Partial<VSCodeSettings>): VSCodeSettings {
    const result = { ...baseSettings };
    
    for (const [key, value] of Object.entries(overrides)) {
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            result[key] = { ...result[key], ...value };
        } else {
            result[key] = value;
        }
    }
    
    return result;
}
